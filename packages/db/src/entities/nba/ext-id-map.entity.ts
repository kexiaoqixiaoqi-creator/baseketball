import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export type ExtEntityType = 'team' | 'player' | 'game';

@Entity('nba_ext_id_map')
@Index('uq_nba_ext_id_map', ['source', 'entityType', 'extId'], { unique: true })
export class ExtIdMap {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 32 })
  source: string;

  @Column({ type: 'varchar', length: 16, name: 'entity_type' })
  entityType: ExtEntityType;

  @Column({ type: 'varchar', length: 64, name: 'ext_id' })
  extId: string;

  @Column({ type: 'int', name: 'internal_id' })
  internalId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
