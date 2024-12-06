import { Server, Socket } from 'socket.io';
import { saveMessage } from './controllers/messageController';

interface OnlineUsers {
  [key: string]: string; // userId: socketId
}

const onlineUsers: OnlineUsers = {};

export const socketHandler = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log('User connected:', socket.id);

    // Handle user coming online
    socket.on('user_online', (userId: string) => {
      console.log(`User ${userId} is now online with socket ${socket.id}`);
      onlineUsers[userId] = socket.id;
      io.emit('user_status', { userId, status: 'online' });
    });

    // Handle private messages
    socket.on('private_message', async (data: {
      senderId: string,
      receiverId: string,
      content: string,
      type: 'text' | 'image'
    }) => {
      console.log('Received private message:', data);
      try {
        const message = await saveMessage(data);
        console.log('Message saved:', message);

        // Send to receiver if online
        const receiverSocketId = onlineUsers[data.receiverId];
        if (receiverSocketId) {
          console.log(`Sending message to receiver ${data.receiverId} via socket ${receiverSocketId}`);
          io.to(receiverSocketId).emit('new_message', message);
        } else {
          console.log(`Receiver ${data.receiverId} is offline`);
        }

        // Send back to sender
        console.log(`Sending confirmation to sender ${data.senderId}`);
        socket.emit('message_sent', message);
      } catch (error) {
        console.error('Error handling private message:', error);
        socket.emit('message_error', { error: 'Failed to send message' });
      }
    });

    // Handle typing status
    socket.on('typing', (data: { senderId: string, receiverId: string }) => {
      console.log('Typing event:', data);
      const receiverSocketId = onlineUsers[data.receiverId];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('user_typing', { userId: data.senderId });
      }
    });

    // Handle read receipts
    socket.on('message_read', (data: { messageId: string, readBy: string }) => {
      console.log('Message read event:', data);
      // Broadcast to relevant users that message was read
      io.emit('message_status_update', data);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      const userId = Object.keys(onlineUsers).find(
        key => onlineUsers[key] === socket.id
      );
      if (userId) {
        console.log(`User ${userId} is now offline`);
        delete onlineUsers[userId];
        io.emit('user_status', { userId, status: 'offline' });
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });
}; 