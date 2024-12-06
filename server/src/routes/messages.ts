import express from 'express';
import {
  getMessages,
  markMessageAsRead,
  addReaction,
  getChats
} from '../controllers/messageController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.get('/chats', authenticate, getChats);
router.get('/:userId/:otherUserId', authenticate, getMessages);
router.post('/read', authenticate, markMessageAsRead);
router.post('/reaction', authenticate, addReaction);

export default router; 