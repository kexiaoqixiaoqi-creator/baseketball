import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameDay, Game } from '@fantasy-nba/db';
import { RosterSyncService } from '../sync/roster.sync.service';
import { SeasonStatsSyncService } from '../sync/season-stats.sync.service';
import { ScheduleSyncService } from '../sync/schedule.sync.service';
import { GameStatsSyncService } from '../sync/game-stats.sync.service';

/**
 * Thin orchestrator: delegates to the four sync/* services.
 * Keeps the controller and cron service free of business logic.
 */
@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);

  constructor(
    @InjectRepository(GameDay) private readonly gameDayRepo: Repository<GameDay>,
    @InjectRepository(Game) private readonly gameRepo: Repository<Game>,
    private readonly rosterSync: RosterSyncService,
    private readonly seasonStatsSync: SeasonStatsSyncService,
    private readonly scheduleSync: ScheduleSyncService,
    private readonly gameStatsSync: GameStatsSyncService,
  ) {}

  syncRosters() {
    return this.rosterSync.syncAllRosters();
  }

  syncSeasonStats() {
    return this.seasonStatsSync.syncAllSeasonStats();
  }

  syncSchedule(date?: string, span = 1) {
    const target = date ?? new Date().toISOString().slice(0, 10);
    return this.scheduleSync.syncSchedule(target, span);
  }

  syncActiveGames() {
    return this.gameStatsSync.syncActiveGames();
  }

  async syncGameDayById(gameDayId: number): Promise<{ synced: number }> {
    const gameDay = await this.gameDayRepo.findOne({
      where: { id: gameDayId },
      relations: ['games'],
    });
    if (!gameDay) throw new NotFoundException(`GameDay ${gameDayId} not found`);

    let synced = 0;
    for (const game of gameDay.games) {
      if (game.status === 'completed') continue;
      try {
        await this.gameStatsSync.syncByInternalId(game.id);
        synced++;
      } catch (err) {
        this.logger.warn(`Skipping game id=${game.id}: ${(err as Error).message}`);
      }
    }
    return { synced };
  }

  async syncGameById(gameId: number): Promise<{ ok: boolean }> {
    const game = await this.gameRepo.findOne({ where: { id: gameId } });
    if (!game) throw new NotFoundException(`Game ${gameId} not found`);
    await this.gameStatsSync.syncByInternalId(gameId);
    return { ok: true };
  }

  async syncGameByMid(mid: string): Promise<{ ok: boolean }> {
    await this.gameStatsSync.syncByMid(mid);
    return { ok: true };
  }
}
