import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Message } from '../entities/Message';
import { User } from '../entities/User';

const messageRepository = AppDataSource.getRepository(Message);
const userRepository = AppDataSource.getRepository(User);

interface MessageData {
  senderId: string;
  receiverId: string;
  content: string;
  type: 'text' | 'image';
}

interface MessageRequest extends Request {
  params: {
    userId: string;
    otherUserId: string;
  };
  query: {
    page?: string;
  };
}

interface MessageActionRequest extends Request {
  body: {
    messageId: string;
    userId: string;
    reaction?: '❤️' | '👍' | '😊' | '😂' | '😮' | '😢';
  };
}

export const saveMessage = async (data: MessageData) => {
  try {
    const sender = await userRepository.findOneBy({ id: data.senderId });
    const receiver = await userRepository.findOneBy({ id: data.receiverId });

    if (!sender || !receiver) {
      throw new Error('Sender or receiver not found');
    }

    const message = messageRepository.create({
      sender,
      receiver,
      content: data.content,
      type: data.type
    });

    await messageRepository.save(message);
    return message;
  } catch (error) {
    console.error('Error saving message:', error);
    throw error;
  }
};

export const getMessages = async (req: MessageRequest, res: Response) => {
  try {
    const { userId, otherUserId } = req.params;
    const page = parseInt(req.query.page || '1');
    const limit = 20;
    const skip = (page - 1) * limit;

    const messages = await messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .leftJoinAndSelect('message.receiver', 'receiver')
      .where(
        '(message.sender = :userId AND message.receiver = :otherUserId) OR ' +
        '(message.sender = :otherUserId AND message.receiver = :userId)',
        { userId, otherUserId }
      )
      .orderBy('message.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getMany();

    res.json(messages.reverse());
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const markMessageAsRead = async (req: MessageActionRequest, res: Response) => {
  try {
    const { messageId, userId } = req.body;

    const message = await messageRepository.findOneBy({ id: messageId });
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (!message.readBy.includes(userId)) {
      message.readBy.push(userId);
      await messageRepository.save(message);
    }

    res.json(message);
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const addReaction = async (req: MessageActionRequest, res: Response) => {
  try {
    const { messageId, userId, reaction } = req.body;

    const message = await messageRepository.findOneBy({ id: messageId });
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Remove existing reaction from this user if any
    message.reactions = message.reactions.filter(r => r.userId !== userId);

    // Add new reaction
    if (reaction) {
      message.reactions.push({
        userId,
        reaction
      });
    }

    await messageRepository.save(message);
    res.json(message);
  } catch (error) {
    console.error('Error adding reaction:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getChats = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Get the latest message for each conversation
    const chats = await messageRepository
      .createQueryBuilder('message')
      .innerJoinAndSelect('message.sender', 'sender')
      .innerJoinAndSelect('message.receiver', 'receiver')
      .where(
        '(message.sender = :userId OR message.receiver = :userId)',
        { userId }
      )
      .orderBy('message.createdAt', 'DESC')
      .getMany();

    // Group messages by conversation and get the latest one
    const conversationMap = new Map();
    chats.forEach(message => {
      const otherUser = message.sender.id === userId ? message.receiver : message.sender;
      const conversationId = [message.sender.id, message.receiver.id].sort().join('-');
      
      if (!conversationMap.has(conversationId) || 
          new Date(message.createdAt) > new Date(conversationMap.get(conversationId).lastMessage.createdAt)) {
        conversationMap.set(conversationId, {
          id: conversationId,
          user: {
            id: otherUser.id,
            username: otherUser.username,
            avatar: otherUser.avatar,
          },
          lastMessage: {
            content: message.content,
            createdAt: message.createdAt,
            type: message.type,
          },
          unreadCount: message.sender.id !== userId && !message.readBy.includes(userId) ? 1 : 0,
        });
      } else if (message.sender.id !== userId && !message.readBy.includes(userId)) {
        const conversation = conversationMap.get(conversationId);
        conversation.unreadCount += 1;
      }
    });

    const conversations = Array.from(conversationMap.values());
    res.json(conversations);
  } catch (error) {
    console.error('Error getting chats:', error);
    res.status(500).json({ message: 'Server error' });
  }
}; 