import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Player } from './player.entity';

@Entity('nba_player_season_stats')
export class PlayerSeasonStats {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Player, (p) => p.seasonStats)
  @JoinColumn({ name: 'player_id' })
  player: Player;

  @Column({ name: 'player_id' })
  playerId: number;

  @Column({ length: 10 })
  season: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  ppg: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  rpg: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  apg: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  spg: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  bpg: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  topg: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  mpg: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0, name: 'fantasy_score' })
  fantasyScore: number;

  @Column({ type: 'int', default: 0 })
  cost: number;
}
