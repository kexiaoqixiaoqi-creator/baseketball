import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export type ExtEntityType = 'team' | 'player' | 'game';

/**
 * Universal external-ID → internal-ID mapping table.
 *
 * Purpose: the external data source (Sina Sports, ESPN, nba_stats, …) can be
 * swapped at any time without touching internal entity IDs. Every external
 * identifier is stored here keyed by (source, entityType, extId).
 *
 * Example rows
 *   source='sina'  entityType='player'  extId='c4475a2b-…'  internalId=7
 *   source='sina'  entityType='team'    extId='583ecb8f-…'  internalId=0  ← teams are mapped to 0 (name-based)
 *   source='sina'  entityType='game'    extId='87040d88-…'  internalId=23
 */
@Entity('ext_id_map')
@Index('uq_ext_id_map', ['source', 'entityType', 'extId'], { unique: true })
export class ExtIdMap {
  @PrimaryGeneratedColumn()
  id: number;

  /** Data-source identifier, e.g. 'sina', 'espn', 'nba_stats' */
  @Column({ type: 'varchar', length: 32 })
  source: string;

  /** Type of the entity this row maps */
  @Column({ type: 'varchar', length: 16, name: 'entity_type' })
  entityType: ExtEntityType;

  /** The UUID / string ID assigned by the external source */
  @Column({ type: 'varchar', length: 64, name: 'ext_id' })
  extId: string;

  /** Our internal primary-key value in the corresponding table */
  @Column({ type: 'int', name: 'internal_id' })
  internalId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
