import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { UnderDuressSettings } from '../entities/UnderDuressSettings';
import { faker } from '@faker-js/faker';
import jwt from 'jsonwebtoken';
import { DeepPartial } from 'typeorm';
import { generateFakeConversations } from './fakeConversationController';
import { Message } from '../entities/Message';

const userRepository = AppDataSource.getRepository(User);
const settingsRepository = AppDataSource.getRepository(UnderDuressSettings);
const messageRepository = AppDataSource.getRepository(Message);
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface AuthRequest extends Request {
  user?: {
    userId: string;
  };
}

interface UnderDuressAccountData {
  username: string;
  email: string;
  password?: string;
}

export const getSettings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const settings = await settingsRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });

    if (!settings) {
      return res.json({
        showTimestamps: true,
        minTimeInMinutes: 2,
        maxTimeInMinutes: 1440,
        numberOfFakeUsers: 5,
      });
    }

    // Get under duress account info if it exists
    const underDuressAccount = await userRepository.findOne({
      where: { id: settings.underDuressUserId },
      select: ['username', 'email'],
    });

    res.json({
      showTimestamps: settings.showTimestamps,
      minTimeInMinutes: settings.minTimeInMinutes,
      maxTimeInMinutes: settings.maxTimeInMinutes,
      numberOfFakeUsers: settings.numberOfFakeUsers,
      underDuressAccount,
    });
  } catch (error) {
    console.error('Error getting settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateSettings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    console.log('Updating settings:', req.body);

    const {
      showTimestamps,
      minTimeInMinutes,
      maxTimeInMinutes,
      numberOfFakeUsers,
      underDuressAccount,
    }: {
      showTimestamps: boolean;
      minTimeInMinutes: number;
      maxTimeInMinutes: number;
      numberOfFakeUsers: number;
      underDuressAccount?: UnderDuressAccountData;
    } = req.body;

    let settings = await settingsRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });

    // Create or update settings regardless of under duress account
    if (!settings) {
      settings = settingsRepository.create({
        user: { id: userId },
        showTimestamps,
        minTimeInMinutes,
        maxTimeInMinutes,
        numberOfFakeUsers,
      });
    } else {
      settings.showTimestamps = showTimestamps;
      settings.minTimeInMinutes = minTimeInMinutes;
      settings.maxTimeInMinutes = maxTimeInMinutes;
      settings.numberOfFakeUsers = numberOfFakeUsers;
    }

    // Handle under duress account creation/update if provided
    if (underDuressAccount) {
      let duressUser = settings.underDuressUserId
        ? await userRepository.findOneBy({ id: settings.underDuressUserId })
        : null;

      const duressUserData: DeepPartial<User> = {
        ...underDuressAccount,
        isUnderDuressAccount: true,
        mainAccountId: userId,
      };

      if (!duressUser) {
        duressUser = await userRepository.save(
          userRepository.create(duressUserData)
        );
      } else {
        duressUser.username = underDuressAccount.username;
        duressUser.email = underDuressAccount.email;
        if (underDuressAccount.password) {
          duressUser.password = underDuressAccount.password;
        }
        duressUser = await userRepository.save(duressUser);
      }

      settings.underDuressUserId = duressUser.id;
    }

    await settingsRepository.save(settings);
    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating settings:', error);
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Server error' });
    }
  }
};

export const switchToUnderDuress = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    console.log('Finding settings for user:', userId);
    const settings = await settingsRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });

    console.log('Settings found:', settings);

    if (!settings || !settings.underDuressUserId) {
      console.log('No settings or underDuressUserId found');
      return res.status(404).json({ message: 'Under duress account not found' });
    }

    console.log('Finding duress user:', settings.underDuressUserId);
    const duressUser = await userRepository.findOne({
      where: { id: settings.underDuressUserId },
    });

    console.log('Duress user found:', duressUser);

    if (!duressUser) {
      return res.status(404).json({ message: 'Under duress account not found' });
    }

    try {
      console.log('Checking for existing messages...');
      const existingMessages = await messageRepository.find({
        where: [
          { sender: { id: duressUser.id } },
          { receiver: { id: duressUser.id } }
        ]
      });

      console.log('Existing messages count:', existingMessages.length);

      if (existingMessages.length === 0) {
        console.log('Generating fake conversations...');
        await generateFakeConversations(duressUser.id);
        console.log('Fake conversations generated');
      }
    } catch (error) {
      console.error('Error with messages:', error);
      throw error;
    }

    console.log('Updating duress user...');
    duressUser.isUnderDuressAccount = true;
    await userRepository.save(duressUser);

    const token = jwt.sign(
      { userId: duressUser.id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('Sending response...');
    return res.json({
      token,
      user: {
        id: duressUser.id,
        username: duressUser.username,
        email: duressUser.email,
        avatar: duressUser.avatar,
        isUnderDuressAccount: true
      }
    });
  } catch (error) {
    console.error('Detailed error in switchToUnderDuress:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Server error',
      details: error instanceof Error ? error.stack : undefined
    });
  }
};

export const checkUnderDuressSettings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const settings = await settingsRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });

    return res.json({
      hasSettings: !!settings,
      hasDuressAccount: !!(settings?.underDuressUserId),
      settings: settings
    });
  } catch (error) {
    console.error('Error checking settings:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}; 