import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { PlayerSeasonStats } from './player-season-stats.entity';
import { GamePlayerStats } from './game-player-stats.entity';

@Entity('players')
export class Player {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'enum', enum: ['PG', 'SG', 'SF', 'PF', 'C'] })
  position: string;

  @Column({ length: 50 })
  team: string;

  @Column({ name: 'jersey_number', length: 10 })
  jerseyNumber: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => PlayerSeasonStats, (s) => s.player)
  seasonStats: PlayerSeasonStats[];

  @OneToMany(() => GamePlayerStats, (gs) => gs.player)
  gameStats: GamePlayerStats[];
}
