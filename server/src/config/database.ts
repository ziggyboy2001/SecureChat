import { DataSource } from "typeorm";
import { User } from "../entities/User";
import { Message } from "../entities/Message";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USERNAME || process.env.USER || "postgres",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "chat_app",
  synchronize: true,
  logging: true,
  entities: [User, Message],
  subscribers: [],
  migrations: [],
});

export const initializeDatabase = async () => {
  try {
    await AppDataSource.initialize();
    console.log("Database connection initialized");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
}; 