import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ScraperService } from './scraper.service';
import { GameDaysService } from '../game-days/game-days.service';

/**
 * 定时任务
 * - activate-game-days: 每天 00:00 将当日 prepare 赛日激活为 playing
 * - finish-game-days: 每天 16:00 将当日 playing 赛日结算为 finish
 * - sync-season-stats: 每天 18:00 同步球员赛季场均数据，重算薪资
 * - create-game-day: 每天 18:30 自动创建当日赛日
 * - sync-active-game-days: 每 5 分钟检查并更新激活比赛日的球员数据
 */
@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    private readonly scraperService: ScraperService,
    private readonly gameDaysService: GameDaysService,
  ) {}

  @Cron('0 0 * * *', { name: 'activate-game-days', timeZone: 'Asia/Shanghai' })
  async handleActivateGameDays(): Promise<void> {
    try {
      const dateStr = new Date().toLocaleDateString('en-CA', {
        timeZone: 'Asia/Shanghai',
      });
      const result = await this.gameDaysService.activateGameDaysForDate(dateStr);
      if (result.updated > 0) {
        this.logger.log(`[CRON] 赛日激活完成: ${dateStr}, 更新 ${result.updated} 个`);
      }
    } catch (err) {
      this.logger.error('[CRON] 赛日激活失败', (err as Error).stack);
    }
  }

  @Cron('0 16 * * *', { name: 'finish-game-days', timeZone: 'Asia/Shanghai' })
  async handleFinishGameDays(): Promise<void> {
    try {
      const dateStr = new Date().toLocaleDateString('en-CA', {
        timeZone: 'Asia/Shanghai',
      });
      const result = await this.gameDaysService.finishGameDaysForDate(dateStr);
      if (result.updated > 0) {
        this.logger.log(`[CRON] 赛日结算完成: ${dateStr}, 更新 ${result.updated} 个`);
      }
    } catch (err) {
      this.logger.error('[CRON] 赛日结算失败', (err as Error).stack);
    }
  }

  @Cron('0 18 * * *', { name: 'sync-season-stats', timeZone: 'Asia/Shanghai' })
  async handleSyncSeasonStats(): Promise<void> {
    try {
      await this.scraperService.syncSeasonStats();
      this.logger.log('[CRON] 赛季场均数据同步完成');
    } catch (err) {
      this.logger.error('[CRON] 赛季场均数据同步失败', (err as Error).stack);
    }
  }

  @Cron('30 18 * * *', { name: 'create-game-day', timeZone: 'Asia/Shanghai' })
  async handleCreateGameDay(): Promise<void> {
    try {
      const dateStr = new Date().toISOString().slice(0, 10);
      await this.gameDaysService.create({ date: dateStr });
      this.logger.log(`[CRON] 赛日创建完成: ${dateStr}`);
    } catch (err) {
      this.logger.error('[CRON] 赛日创建失败', (err as Error).stack);
    }
  }

  @Cron('*/5 * * * *', { name: 'sync-active-game-days', timeZone: 'Asia/Shanghai' })
  async handleSyncActiveGameDays(): Promise<void> {
    try {
      const result = await this.scraperService.syncActiveGameDays();
      if (result.gameDays > 0 && result.gamesSynced > 0) {
        this.logger.log(
          `[CRON] 更新比赛日数据: ${result.gameDays} 个激活比赛日, ${result.gamesSynced} 场比赛`,
        );
      }
    } catch (err) {
      this.logger.error('[CRON] 更新比赛日数据失败', (err as Error).stack);
    }
  }
}
