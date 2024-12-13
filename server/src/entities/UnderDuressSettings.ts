import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from "typeorm";
import { User } from "./User";

@Entity()
export class UnderDuressSettings {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @OneToOne(() => User)
  @JoinColumn()
  user!: User;

  @Column({ nullable: true })
  underDuressUserId!: string;

  @Column({ default: true })
  showTimestamps!: boolean;

  @Column({ default: 2 })
  minTimeInMinutes!: number;

  @Column({ default: 1440 }) // 24 hours in minutes
  maxTimeInMinutes!: number;

  @Column({ default: 5 })
  numberOfFakeUsers!: number;
} 