import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { User } from "./User";

@Entity()
export class Message {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  sender!: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  receiver!: User;

  @Column()
  content!: string;

  @Column({ default: 'text' })
  type!: 'text' | 'image';

  @Column("text", { array: true, default: [] })
  readBy!: string[];

  @Column("jsonb", { default: [] })
  reactions!: {
    userId: string;
    reaction: '❤️' | '👍' | '😊' | '😂' | '😮' | '😢';
  }[];

  @Column({ default: false })
  delivered!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
} 