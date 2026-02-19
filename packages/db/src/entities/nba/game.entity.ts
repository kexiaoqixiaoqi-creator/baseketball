import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { GameDay } from './game-day.entity';
import { GamePlayerStats } from './game-player-stats.entity';

@Entity('nba_games')
export class Game {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => GameDay, (gd) => gd.games)
  @JoinColumn({ name: 'game_day_id' })
  gameDay: GameDay;

  @Column({ name: 'game_day_id' })
  gameDayId: number;

  @Column({ name: 'home_team', length: 50 })
  homeTeam: string;

  @Column({ name: 'away_team', length: 50 })
  awayTeam: string;

  @Column({
    type: 'enum',
    enum: ['scheduled', 'in_progress', 'completed'],
    default: 'scheduled',
  })
  status: string;

  @OneToMany(() => GamePlayerStats, (gps) => gps.game)
  playerStats: GamePlayerStats[];
}
