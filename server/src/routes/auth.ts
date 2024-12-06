import express from 'express';
import { register, login, getUsers, searchUsers } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/users', authenticate, getUsers);
router.get('/search', authenticate, searchUsers);

export default router; 