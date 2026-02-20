import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Room } from './room.entity';

/**
 * 应用层：比赛日（与 NBA 数据通过 date 关联，不直接 FK）
 * NBA 数据（nba_games）按 date 独立存在，通过 date 查询当日比赛
 */
@Entity('app_game_days')
export class GameDay {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  date: string;

  @Column({
    type: 'enum',
    enum: ['prepare', 'playing', 'finish'],
    default: 'prepare',
  })
  status: string;

  @Column({ name: 'salary_cap', type: 'int', default: 50000 })
  salaryCap: number;

  @ManyToOne(() => Room, { nullable: true })
  @JoinColumn({ name: 'room_id' })
  room: Room | null;

  @Column({ name: 'room_id', type: 'int', nullable: true })
  roomId: number | null;
}
