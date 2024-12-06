import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { faker } from '@faker-js/faker';

const generateUsers = (count: number) => {
  const users: Partial<User>[] = [];
  
  for (let i = 0; i < count; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    
    users.push({
      username: faker.internet.userName({ firstName, lastName }),
      email: faker.internet.email({ firstName, lastName }),
      password: 'password123', // All users will have the same password for testing
      avatar: faker.image.avatar(),
      status: faker.helpers.arrayElement(['online', 'offline']) as 'online' | 'offline',
      lastSeen: faker.date.recent({ days: 7 }),
    });
  }
  
  return users;
};

const seed = async () => {
  try {
    // Initialize database connection
    await AppDataSource.initialize();
    console.log('Database connection initialized');

    const userRepository = AppDataSource.getRepository(User);

    // Generate 25 users
    const users = generateUsers(25);

    // Save users to database
    for (const userData of users) {
      const user = userRepository.create(userData);
      await userRepository.save(user);
      console.log(`Created user: ${user.username}`);
    }

    console.log('Seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seed function
seed(); 