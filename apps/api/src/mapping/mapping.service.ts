import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ExtIdMap, ExtEntityType } from '@fantasy-nba/db';

@Injectable()
export class MappingService {
  constructor(
    @InjectRepository(ExtIdMap)
    private readonly repo: Repository<ExtIdMap>,
  ) {}

  async getInternalId(
    source: string,
    entityType: ExtEntityType,
    extId: string,
  ): Promise<number | null> {
    const row = await this.repo.findOne({
      where: { source, entityType, extId },
    });
    return row?.internalId ?? null;
  }

  async getExtId(
    source: string,
    entityType: ExtEntityType,
    internalId: number,
  ): Promise<string | null> {
    const row = await this.repo.findOne({
      where: { source, entityType, internalId },
    });
    return row?.extId ?? null;
  }

  /** 批量获取 internal_id → ext_id 映射 */
  async getExtIdsByInternalIds(
    source: string,
    entityType: ExtEntityType,
    internalIds: number[],
  ): Promise<Map<number, string>> {
    if (internalIds.length === 0) return new Map();
    const rows = await this.repo.find({
      where: { source, entityType, internalId: In(internalIds) },
    });
    return new Map(rows.map((r) => [r.internalId, r.extId]));
  }

  async upsert(
    source: string,
    entityType: ExtEntityType,
    extId: string,
    internalId: number,
  ): Promise<void> {
    await this.repo.query(
      `INSERT INTO nba_ext_id_map (source, entity_type, ext_id, internal_id)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE internal_id = VALUES(internal_id)`,
      [source, entityType, extId, internalId],
    );
  }

  async upsertMany(
    rows: Array<{
      source: string;
      entityType: ExtEntityType;
      extId: string;
      internalId: number;
    }>,
  ): Promise<void> {
    if (rows.length === 0) return;
    const placeholders = rows.map(() => '(?, ?, ?, ?)').join(', ');
    const values = rows.flatMap((r) => [r.source, r.entityType, r.extId, r.internalId]);
    await this.repo.query(
      `INSERT INTO nba_ext_id_map (source, entity_type, ext_id, internal_id)
       VALUES ${placeholders}
       ON DUPLICATE KEY UPDATE internal_id = VALUES(internal_id)`,
      values,
    );
  }

  async getAllExtIds(
    source: string,
    entityType: ExtEntityType,
  ): Promise<Array<{ extId: string; internalId: number }>> {
    const rows = await this.repo.find({ where: { source, entityType } });
    return rows.map((r) => ({ extId: r.extId, internalId: r.internalId }));
  }
}
