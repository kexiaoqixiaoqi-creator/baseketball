import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Room } from './room.entity';
import { GameDay } from './game-day.entity';

@Entity('lineups')
@Index(['userId', 'roomId', 'gameDayId'], { unique: true })
export class Lineup {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => Room, (r) => r.lineups)
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @Column({ name: 'room_id' })
  roomId: number;

  @ManyToOne(() => GameDay, (gd) => gd.lineups)
  @JoinColumn({ name: 'game_day_id' })
  gameDay: GameDay;

  @Column({ name: 'game_day_id' })
  gameDayId: number;

  @Column({ name: 'pg_id' })
  pgId: number;

  @Column({ name: 'sg_id' })
  sgId: number;

  @Column({ name: 'sf_id' })
  sfId: number;

  @Column({ name: 'pf_id' })
  pfId: number;

  @Column({ name: 'c_id' })
  cId: number;

  @Column({ name: 'total_cost', type: 'int', default: 0 })
  totalCost: number;

  @Column({ name: 'total_score', type: 'decimal', precision: 8, scale: 2, nullable: true })
  totalScore: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
