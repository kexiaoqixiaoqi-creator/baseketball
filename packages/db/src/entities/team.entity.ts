import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Player } from './player.entity';

@Entity('teams')
export class Team {
  @PrimaryGeneratedColumn()
  id: number;

  /** English short name, e.g. "Hawks" */
  @Column({ length: 50 })
  name: string;

  /** Chinese name, e.g. "老鹰" */
  @Column({ name: 'name_cn', length: 50 })
  nameCn: string;

  /** English city/market, e.g. "Atlanta" */
  @Column({ length: 50 })
  market: string;

  /** Chinese city/market, e.g. "亚特兰大" */
  @Column({ type: 'varchar', name: 'market_cn', length: 50, nullable: true })
  marketCn: string | null;

  @OneToMany(() => Player, (p) => p.teamEntity)
  players: Player[];
}
