import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { Not } from 'typeorm';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const userRepository = AppDataSource.getRepository(User);

interface RegisterRequest extends Request {
  body: {
    username: string;
    email: string;
    password: string;
  };
}

interface LoginRequest extends Request {
  body: {
    email: string;
    password: string;
  };
}

interface AuthRequest extends Request {
  user?: {
    userId: string;
  };
}

export const register = async (req: RegisterRequest, res: Response) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await userRepository.findOne({
      where: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'User with this email or username already exists'
      });
    }

    // Create new user
    const user = userRepository.create({
      username,
      email,
      password
    });

    await userRepository.save(user);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req: LoginRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await userRepository.findOne({
      where: { email }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Update last seen and status
    user.lastSeen = new Date();
    user.status = 'online';
    await userRepository.save(user);

    // Generate token
    const token = jwt.sign(
      { userId: user.id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?.userId;
    if (!currentUserId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const users = await userRepository.find({
      where: { id: Not(currentUserId) },
      select: ['id', 'username', 'email', 'avatar', 'status', 'lastSeen']
    });

    res.json(users);
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const searchUsers = async (req: Request, res: Response) => {
  try {
    const { query } = req.query;
    const currentUserId = (req as AuthRequest).user?.userId;

    if (!currentUserId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const users = await userRepository
      .createQueryBuilder('user')
      .where('user.id != :currentUserId', { currentUserId })
      .andWhere(
        '(LOWER(user.username) LIKE LOWER(:query) OR LOWER(user.email) LIKE LOWER(:query))',
        { query: `%${query}%` }
      )
      .select(['user.id', 'user.username', 'user.email', 'user.avatar', 'user.status', 'user.lastSeen'])
      .take(10)
      .getMany();

    res.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
}; 