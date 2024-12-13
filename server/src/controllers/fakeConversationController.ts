import { faker } from '@faker-js/faker';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { Message } from '../entities/Message';
import { UnderDuressSettings } from '../entities/UnderDuressSettings';
import { DeepPartial } from 'typeorm';
import * as bcrypt from 'bcrypt';

const userRepository = AppDataSource.getRepository(User);
const messageRepository = AppDataSource.getRepository(Message);
const settingsRepository = AppDataSource.getRepository(UnderDuressSettings);

const generateFakeUser = async (mainUserId: string): Promise<User> => {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  
  const userData = userRepository.create({
    id: faker.string.uuid(),
    username: `fake_${faker.internet.userName({ firstName, lastName })}`,
    email: faker.internet.email({ firstName, lastName }),
    password: await bcrypt.hash(faker.internet.password(), 10),
    avatar: faker.image.avatar(),
    status: faker.helpers.arrayElement(['online', 'offline']) as 'online' | 'offline',
    lastSeen: faker.date.recent({ days: 7 }),
    isUnderDuressAccount: false,
    mainAccountId: mainUserId
  });

  return await userRepository.save(userData);
};

const generateFakeMessages = async (
  duressUser: User,
  fakeUser: User,
  minMinutes: number,
  maxMinutes: number,
  showTimestamps: boolean
): Promise<void> => {
  const numberOfMessages = faker.number.int({ min: 5, max: 20 });
  const messages = [];
  let currentDate = new Date();

  for (let i = 0; i < numberOfMessages; i++) {
    const minutesAgo = faker.number.int({ min: minMinutes, max: maxMinutes });
    currentDate = new Date(currentDate.getTime() - minutesAgo * 60000);

    const message = messageRepository.create({
      sender: duressUser,
      receiver: fakeUser,
      content: faker.lorem.sentence(),
      type: 'text',
      readBy: [],
      reactions: [],
      delivered: true
    });

    messages.push(message);
  }

  await messageRepository.save(messages);
  console.log(`Generated ${messages.length} messages between ${duressUser.id} and ${fakeUser.id}`);
};

export const generateFakeConversations = async (userId: string): Promise<void> => {
  try {
    console.log('Generating fake conversations for user:', userId);
    
    // Get user's under duress settings
    const settings = await settingsRepository.findOne({
      where: { underDuressUserId: userId },
    });
    
    if (!settings) {
      console.error('No settings found for duress user:', userId);
      throw new Error('Under duress settings not found');
    }
    
    console.log('Found settings:', settings);
    
    // Generate fake users with fake_ prefix
    const fakeUsers = await Promise.all(
      Array(settings.numberOfFakeUsers)
        .fill(null)
        .map(async () => {
          const fakeUser = await generateFakeUser(userId);
          console.log('Generated fake user:', fakeUser.id);
          return fakeUser;
        })
    );
    
    console.log(`Generated ${fakeUsers.length} fake users`);
    
    // Generate conversations between the duress user and each fake user
    await Promise.all(
      fakeUsers.map(async (fakeUser) => {
        console.log(`Generating messages between ${userId} and ${fakeUser.id}`);
        await generateFakeMessages(
          { id: userId } as User,
          fakeUser,
          settings.minTimeInMinutes,
          settings.maxTimeInMinutes,
          settings.showTimestamps
        );
      })
    );
    
    console.log('Finished generating all fake conversations');
  } catch (error) {
    console.error('Error in generateFakeConversations:', error);
    throw error;
  }
}; 