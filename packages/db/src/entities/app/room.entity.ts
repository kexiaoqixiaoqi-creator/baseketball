import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { RoomMember } from './room-member.entity';
import { Lineup } from './lineup.entity';

@Entity('app_rooms')
export class Room {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'owner_id' })
  owner: User | null;

  @Column({ name: 'owner_id', nullable: true })
  ownerId: number | null;

  @Column({ name: 'is_official', default: false })
  isOfficial: boolean;

  @Column({ type: 'float', name: 'pts_weight', default: 1.0 })
  ptsWeight: number;

  @Column({ type: 'float', name: 'reb_weight', default: 1.2 })
  rebWeight: number;

  @Column({ type: 'float', name: 'ast_weight', default: 1.5 })
  astWeight: number;

  @Column({ type: 'float', name: 'stl_weight', default: 3.0 })
  stlWeight: number;

  @Column({ type: 'float', name: 'blk_weight', default: 3.0 })
  blkWeight: number;

  @Column({ type: 'float', name: 'to_weight', default: -1.0 })
  toWeight: number;

  /** 薪资帽计算系数：salaryCap = avgCost × LINEUP_SLOTS × coefficient；无球员时用 SALARY_CAP_OFFICIAL 作 fallback */
  @Column({ name: 'salary_cap_coefficient', type: 'float', default: 0.33 })
  salaryCapCoefficient: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => RoomMember, (rm) => rm.room)
  members: RoomMember[];

  @OneToMany(() => Lineup, (l) => l.room)
  lineups: Lineup[];
}
