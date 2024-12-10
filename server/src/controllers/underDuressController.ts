import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { UnderDuressSettings } from '../entities/UnderDuressSettings';
import { faker } from '@faker-js/faker';
import jwt from 'jsonwebtoken';
import { DeepPartial } from 'typeorm';
import { generateFakeConversations } from './fakeConversationController';

const userRepository = AppDataSource.getRepository(User);
const settingsRepository = AppDataSource.getRepository(UnderDuressSettings);
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

    const settings = await settingsRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });

    if (!settings?.underDuressUserId) {
      return res.status(404).json({ message: 'Under duress account not found' });
    }

    const duressUser = await userRepository.findOneBy({ id: settings.underDuressUserId });
    if (!duressUser) {
      return res.status(404).json({ message: 'Under duress account not found' });
    }

    // Generate fake conversations for the under duress account
    await generateFakeConversations(duressUser.id);

    // Generate token for under duress account
    const token = jwt.sign(
      { userId: duressUser.id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: duressUser.id,
        username: duressUser.username,
        email: duressUser.email,
        avatar: duressUser.avatar,
      },
    });
  } catch (error) {
    console.error('Error switching to under duress account:', error);
    res.status(500).json({ message: 'Server error' });
  }
}; 