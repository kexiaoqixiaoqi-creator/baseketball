import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ScraperService } from './scraper.service';

/**
 * 定时任务：每 5 分钟检查并更新激活比赛日的球员数据
 * - 若存在 status=playing 的 game day，则同步其各场比赛的 game_player_stats
 */
@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(private readonly scraperService: ScraperService) {}

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
