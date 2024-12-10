import { faker } from '@faker-js/faker';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { Message } from '../entities/Message';
import { UnderDuressSettings } from '../entities/UnderDuressSettings';
import { DeepPartial } from 'typeorm';

const userRepository = AppDataSource.getRepository(User);
const messageRepository = AppDataSource.getRepository(Message);
const settingsRepository = AppDataSource.getRepository(UnderDuressSettings);

const generateFakeUser = async (mainUserId: string): Promise<User> => {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  
  const userData: DeepPartial<User> = {
    username: faker.internet.userName({ firstName, lastName }),
    email: faker.internet.email({ firstName, lastName }),
    password: faker.internet.password(),
    avatar: faker.image.avatar(),
    status: faker.helpers.arrayElement(['online', 'offline']) as 'online' | 'offline',
    lastSeen: faker.date.recent({ days: 7 }),
    isUnderDuressAccount: false,
    mainAccountId: mainUserId,
  };

  return userRepository.save(userRepository.create(userData));
};

const generateFakeMessages = async (
  user1: User,
  user2: User,
  minTimeInMinutes: number,
  maxTimeInMinutes: number,
  showTimestamps: boolean
): Promise<Message[]> => {
  const messages: DeepPartial<Message>[] = [];
  const numberOfMessages = faker.number.int({ min: 5, max: 20 });
  
  // Calculate time range for messages
  const now = new Date();
  const minTime = new Date(now.getTime() - minTimeInMinutes * 60000);
  const maxTime = new Date(now.getTime() - maxTimeInMinutes * 60000);
  
  for (let i = 0; i < numberOfMessages; i++) {
    const timestamp = showTimestamps
      ? faker.date.between({ from: maxTime, to: minTime })
      : undefined;
    
    const sender = faker.helpers.arrayElement([user1, user2]);
    const receiver = sender.id === user1.id ? user2 : user1;
    
    messages.push({
      sender,
      receiver,
      content: faker.lorem.sentence(),
      type: 'text',
      readBy: [sender.id],
      reactions: [],
      delivered: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }
  
  return messageRepository.save(messages);
};

export const generateFakeConversations = async (userId: string): Promise<void> => {
  try {
    // Get user's under duress settings
    const settings = await settingsRepository.findOne({
      where: { user: { id: userId } },
    });
    
    if (!settings) {
      throw new Error('Under duress settings not found');
    }
    
    // Generate fake users
    const fakeUsers = await Promise.all(
      Array(settings.numberOfFakeUsers)
        .fill(null)
        .map(() => generateFakeUser(userId))
    );
    
    // Generate conversations between the user and each fake user
    await Promise.all(
      fakeUsers.map(fakeUser =>
        generateFakeMessages(
          { id: userId } as User,
          fakeUser,
          settings.minTimeInMinutes,
          settings.maxTimeInMinutes,
          settings.showTimestamps
        )
      )
    );
  } catch (error) {
    console.error('Error generating fake conversations:', error);
    throw error;
  }
}; 