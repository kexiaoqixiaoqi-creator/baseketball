import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { GamePlayerStats } from './game-player-stats.entity';

/**
 * NBA 数据：单场比赛，按 date 与日期关联，与 app_game_days 无 FK
 */
@Entity('nba_games')
export class Game {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  date: string;

  @Column({ name: 'home_team', length: 50 })
  homeTeam: string;

  @Column({ name: 'away_team', length: 50 })
  awayTeam: string;

  @Column({ name: 'home_team_id', type: 'int', nullable: true })
  homeTeamId: number | null;

  @Column({ name: 'away_team_id', type: 'int', nullable: true })
  awayTeamId: number | null;

  @Column({
    type: 'enum',
    enum: ['prepare', 'playing', 'finish'],
    default: 'prepare',
  })
  status: string;

  @OneToMany(() => GamePlayerStats, (gps) => gps.game)
  playerStats: GamePlayerStats[];
}
