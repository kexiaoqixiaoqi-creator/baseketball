import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameDay, Game } from '@fantasy-nba/db';
import { RosterSyncService } from '../sync/roster.sync.service';
import { SeasonStatsSyncService } from '../sync/season-stats.sync.service';
import { ScheduleSyncService } from '../sync/schedule.sync.service';
import { GameStatsSyncService } from '../sync/game-stats.sync.service';

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

  /** 更新激活比赛日的球员数据：查找 status=playing 的 game day，对其每场比赛同步 game_player_stats */
  async syncActiveGameDays(): Promise<{ gameDays: number; gamesSynced: number }> {
    const activeGameDays = await this.gameDayRepo.find({
      where: { status: 'playing' },
    });
    if (activeGameDays.length === 0) {
      return { gameDays: 0, gamesSynced: 0 };
    }
    let gamesSynced = 0;
    for (const gd of activeGameDays) {
      const { synced } = await this.syncGameDayById(gd.id);
      gamesSynced += synced;
    }
    return { gameDays: activeGameDays.length, gamesSynced };
  }

  async syncGameDayById(gameDayId: number): Promise<{ synced: number }> {
    const gameDay = await this.gameDayRepo.findOne({ where: { id: gameDayId } });
    if (!gameDay) throw new NotFoundException(`GameDay ${gameDayId} not found`);

    const games = await this.gameRepo.find({ where: { date: gameDay.date } });
    let synced = 0;
    for (const game of games) {
      if (game.status === 'finish') continue;
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

  async aggregateGamesForDate(date: string): Promise<{ gameDay: GameDay | null; games: Game[] }> {
    const target = date ?? new Date().toISOString().slice(0, 10);
    this.logger.log(`Aggregating games for date=${target}`);

    await this.scheduleSync.syncSchedule(target, 1);

    const gameDay = await this.gameDayRepo.findOne({ where: { date: target } });
    if (!gameDay) {
      this.logger.warn(`No game_day found for date=${target}`);
      return { gameDay: null, games: [] };
    }

    const games = await this.gameRepo.find({ where: { date: target } });
    for (const game of games) {
      try {
        await this.gameStatsSync.syncByInternalId(game.id);
      } catch (err) {
        this.logger.warn(`Failed to sync game id=${game.id}: ${(err as Error).message}`);
      }
    }

    await this.seasonStatsSync.syncAllSeasonStats();

    const refreshedGames = await this.gameRepo.find({ where: { date: target } });
    return {
      gameDay,
      games: refreshedGames,
    };
  }
}
