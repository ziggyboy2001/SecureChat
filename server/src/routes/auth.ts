import express from 'express';
import { register, login, getUsers, searchUsers } from '../controllers/authController';
import { getSettings, updateSettings, switchToUnderDuress } from '../controllers/underDuressController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Auth routes
router.post('/register', register);
router.post('/login', login);
router.get('/users', authenticate, getUsers);
router.get('/search', authenticate, searchUsers);

// Under duress routes
router.get('/under-duress-settings', authenticate, getSettings);
router.post('/under-duress-settings', authenticate, updateSettings);
router.post('/switch-to-duress', authenticate, switchToUnderDuress);

export default router; 