import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Game } from './game.entity';
import { Player } from './player.entity';

@Entity('nba_game_player_stats')
export class GamePlayerStats {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Game, (g) => g.playerStats)
  @JoinColumn({ name: 'game_id' })
  game: Game;

  @Column({ name: 'game_id' })
  gameId: number;

  @ManyToOne(() => Player, (p) => p.gameStats)
  @JoinColumn({ name: 'player_id' })
  player: Player;

  @Column({ name: 'player_id' })
  playerId: number;

  @Column({ type: 'int', default: 0 })
  pts: number;

  @Column({ type: 'int', default: 0 })
  reb: number;

  @Column({ type: 'int', default: 0 })
  ast: number;

  @Column({ type: 'int', default: 0 })
  stl: number;

  @Column({ type: 'int', default: 0 })
  blk: number;

  @Column({ name: 'to_val', type: 'int', default: 0 })
  toVal: number;

  @Column({ type: 'int', default: 0 })
  min: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0, name: 'fantasy_score' })
  fantasyScore: number;
}
