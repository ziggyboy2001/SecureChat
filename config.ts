export const API_URL = 'http://localhost:5001/api';
export const SOCKET_URL = 'http://localhost:5001';
export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
} as const;
export const REACTIONS = ['❤️', '👍', '😊', '😂', '😮', '😢'] as const;
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';