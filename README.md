# Chat App

A real-time messaging application built with Expo, React Native, Node.js, and MongoDB.

## Features

- Real-time messaging using Socket.IO
- User authentication with JWT
- Image sharing
- Message reactions
- Read receipts
- Typing indicators
- User profiles with avatars
- Modern UI with smooth animations
- Search functionality
- Message history

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Expo CLI
- iOS Simulator or Android Emulator (optional)

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd chat-app
```

2. Install dependencies for both frontend and backend:

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
```

3. Configure environment variables:

```bash
# In the server directory, create a .env file with the following:
PORT=5000
MONGODB_URI=mongodb://localhost:27017/chat-app
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

## Running the App

1. Start MongoDB:

```bash
mongod
```

2. Start the backend server:

```bash
cd server
npm run dev
```

3. Start the Expo development server:

```bash
# In a new terminal, from the project root
npm start
```

4. Run on your device or simulator:

- Press 'i' for iOS simulator
- Press 'a' for Android emulator
- Scan QR code with Expo Go app on your physical device

## Development

- Frontend code is in the `src` directory
- Backend code is in the `server` directory
- MongoDB models are in `server/models`
- API routes are in `server/routes`
- Socket.IO logic is in `server/socket.ts`

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
