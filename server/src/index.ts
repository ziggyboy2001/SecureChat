import dotenv from 'dotenv';
// Load environment variables before any other imports
dotenv.config();

import 'reflect-metadata';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { socketHandler } from './socket';
import authRoutes from './routes/auth';
import messageRoutes from './routes/messages';
import { initializeDatabase } from './config/database';

// Create Express app
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  path: '/socket.io',
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);

// Socket.IO connection handling
socketHandler(io);

// Initialize database connection and start server
const startServer = async () => {
  try {
    await initializeDatabase();
    const PORT = process.env.PORT || 5000;
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer(); 