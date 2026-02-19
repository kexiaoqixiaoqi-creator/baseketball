import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Game } from './game.entity';

@Entity('nba_game_days')
export class GameDay {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  date: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'active', 'completed'],
    default: 'pending',
  })
  status: string;

  @Column({ name: 'salary_cap', type: 'int', default: 50000 })
  salaryCap: number;

  @OneToMany(() => Game, (g) => g.gameDay)
  games: Game[];
}
