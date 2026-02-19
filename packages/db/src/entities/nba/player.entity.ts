import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { PlayerSeasonStats } from './player-season-stats.entity';
import { GamePlayerStats } from './game-player-stats.entity';
import { Team } from './team.entity';

@Entity('nba_players')
export class Player {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'varchar', name: 'name_cn', length: 100, nullable: true })
  nameCn: string | null;

  @Column({ type: 'enum', enum: ['PG', 'SG', 'SF', 'PF', 'C'] })
  position: string;

  @Column({ length: 50 })
  team: string;

  @Column({ type: 'int', name: 'team_id', nullable: true })
  teamId: number | null;

  @ManyToOne(() => Team, (t) => t.players, { nullable: true })
  @JoinColumn({ name: 'team_id' })
  teamEntity: Team | null;

  @Column({ name: 'jersey_number', length: 10 })
  jerseyNumber: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => PlayerSeasonStats, (s) => s.player)
  seasonStats: PlayerSeasonStats[];

  @OneToMany(() => GamePlayerStats, (gs) => gs.player)
  gameStats: GamePlayerStats[];
}
