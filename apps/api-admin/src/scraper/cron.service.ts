import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { RosterSyncService } from '../sync/roster.sync.service';
import { SeasonStatsSyncService } from '../sync/season-stats.sync.service';
import { ScheduleSyncService } from '../sync/schedule.sync.service';
import { GameStatsSyncService } from '../sync/game-stats.sync.service';

/**
 * Cron schedule (all times CST / Asia/Shanghai)
 * 07:00 daily  — syncRosters
 * 07:30 daily  — syncSeasonStats
 * 08:00 daily  — syncSchedule
 * setInterval  — syncActiveGames (default every 5 min)
 */
@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);
  private readonly pollIntervalMs: number;

  constructor(
    private readonly config: ConfigService,
    private readonly rosterSync: RosterSyncService,
    private readonly seasonStatsSync: SeasonStatsSyncService,
    private readonly scheduleSync: ScheduleSyncService,
    private readonly gameStatsSync: GameStatsSyncService,
  ) {
    const minutes = this.config.get<number>('POLL_INTERVAL_MINUTES', 5);
    this.pollIntervalMs = minutes * 60 * 1_000;
    this.startPollingLoop();
  }

  @Cron('0 7 * * *', { name: 'roster-sync', timeZone: 'Asia/Shanghai' })
  async handleRosterSync(): Promise<void> {
    this.logger.log('[CRON] Running roster sync…');
    try {
      const result = await this.rosterSync.syncAllRosters();
      this.logger.log(`[CRON] Roster sync done: ${JSON.stringify(result)}`);
    } catch (err) {
      this.logger.error('[CRON] Roster sync failed', (err as Error).stack);
    }
  }

  @Cron('30 7 * * *', { name: 'season-stats-sync', timeZone: 'Asia/Shanghai' })
  async handleSeasonStatsSync(): Promise<void> {
    this.logger.log('[CRON] Running season-stats sync…');
    try {
      const result = await this.seasonStatsSync.syncAllSeasonStats();
      this.logger.log(`[CRON] Season-stats sync done: ${JSON.stringify(result)}`);
    } catch (err) {
      this.logger.error('[CRON] Season-stats sync failed', (err as Error).stack);
    }
  }

  @Cron('0 8 * * *', { name: 'schedule-sync', timeZone: 'Asia/Shanghai' })
  async handleScheduleSync(): Promise<void> {
    this.logger.log('[CRON] Running today schedule sync…');
    try {
      const result = await this.scheduleSync.syncToday();
      this.logger.log(`[CRON] Schedule sync done: ${JSON.stringify(result)}`);
    } catch (err) {
      this.logger.error('[CRON] Schedule sync failed', (err as Error).stack);
    }
  }

  private startPollingLoop(): void {
    const startHour = this.config.get<number>('GAME_START_HOUR', 8);
    const endHour = this.config.get<number>('GAME_END_HOUR', 14);

    this.logger.log(
      `Live-game polling: every ${this.pollIntervalMs / 60_000} min, ` +
        `window ${startHour}:00–${endHour}:00 CST`,
    );

    setInterval(async () => {
      const cstHour = (new Date().getUTCHours() + 8) % 24;
      if (cstHour < startHour || cstHour >= endHour) return;

      try {
        const result = await this.gameStatsSync.syncActiveGames();
        if (result.synced > 0) {
          this.logger.log(`[POLL] Synced ${result.synced} active game(s)`);
        }
      } catch (err) {
        this.logger.error('[POLL] Active-game sync failed', (err as Error).message);
      }
    }, this.pollIntervalMs);
  }
}
