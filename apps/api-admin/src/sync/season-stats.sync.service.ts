import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Player, PlayerSeasonStats } from '@fantasy-nba/db';
import { SinaClientService } from '../sina/sina.client.service';
import { MappingService } from '../mapping/mapping.service';
import { computePlayerCosts, CURRENT_SEASON } from '@fantasy-nba/shared';

const SOURCE = 'sina';

@Injectable()
export class SeasonStatsSyncService {
  private readonly logger = new Logger(SeasonStatsSyncService.name);

  constructor(
    private readonly sina: SinaClientService,
    private readonly mapping: MappingService,
    @InjectRepository(Player) private readonly playerRepo: Repository<Player>,
    @InjectRepository(PlayerSeasonStats)
    private readonly seasonStatsRepo: Repository<PlayerSeasonStats>,
  ) {}

  async syncAllSeasonStats(): Promise<{ updated: number }> {
    this.logger.log('Starting season-stats sync…');

    const teamMappings = await this.mapping.getAllExtIds(SOURCE, 'team');
    if (teamMappings.length === 0) {
      this.logger.warn('No team mappings found — run roster sync first');
      return { updated: 0 };
    }

    const playerStatMap = new Map<
      number,
      { ppg: number; rpg: number; apg: number; spg: number; bpg: number; topg: number; mpg: number; gamesPlayed: number }
    >();

    for (const { extId: tid } of teamMappings) {
      let statsData;
      try {
        statsData = await this.sina.getTeamSeasonStats(tid);
      } catch (err) {
        this.logger.warn(`Failed to fetch season stats for tid=${tid}: ${(err as Error).message}`);
        continue;
      }

      for (const sp of statsData.players) {
        const internalId = await this.mapping.getInternalId(SOURCE, 'player', sp.pid);
        if (internalId === null) continue;

        playerStatMap.set(internalId, {
          ppg: sp.points,
          rpg: sp.rebounds,
          apg: sp.assists,
          spg: sp.steals,
          bpg: sp.blocks,
          topg: sp.turnovers,
          mpg: sp.minutes,
          gamesPlayed: sp.games_played,
        });
      }
    }

    if (playerStatMap.size === 0) {
      this.logger.warn('No player stats received from Sina');
      return { updated: 0 };
    }

    const costInput = Array.from(playerStatMap.entries()).map(([id, s]) => ({
      id,
      stats: { pts: s.ppg, reb: s.rpg, ast: s.apg, stl: s.spg, blk: s.bpg, to: s.topg },
    }));
    const costMap = computePlayerCosts(costInput);

    const season = CURRENT_SEASON;
    let updated = 0;

    for (const [playerId, stats] of playerStatMap.entries()) {
      const cost = costMap.get(playerId) ?? 3000;
      const fantasyScore = stats.ppg * 1.0 + stats.rpg * 1.2 + stats.apg * 1.5
        + stats.spg * 3.0 + stats.bpg * 3.0 - stats.topg * 1.0;

      const existing = await this.seasonStatsRepo.findOne({
        where: { playerId, season },
      });

      const record = {
        playerId,
        season,
        ppg: stats.ppg,
        rpg: stats.rpg,
        apg: stats.apg,
        spg: stats.spg,
        bpg: stats.bpg,
        topg: stats.topg,
        mpg: stats.mpg,
        fantasyScore,
        cost,
      };

      if (existing) {
        await this.seasonStatsRepo.update(existing.id, record);
      } else {
        await this.seasonStatsRepo.save(this.seasonStatsRepo.create(record));
      }
      updated++;
    }

    this.logger.log(`Season-stats sync complete: ${updated} players updated`);
    return { updated };
  }
}
