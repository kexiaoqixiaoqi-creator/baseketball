import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Player } from './player.entity';

@Entity('nba_teams')
export class Team {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  name: string;

  @Column({ name: 'name_cn', length: 50 })
  nameCn: string;

  @Column({ length: 50 })
  market: string;

  @Column({ type: 'varchar', name: 'market_cn', length: 50, nullable: true })
  marketCn: string | null;

  @OneToMany(() => Player, (p) => p.teamEntity)
  players: Player[];
}
