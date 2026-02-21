import { Controller, Get, Post, Param, ParseIntPipe, Query, UseGuards, InternalServerErrorException } from '@nestjs/common';
import { ScraperService } from './scraper.service';
import { CronService } from './cron.service';
import { GameDaysService } from '../game-days/game-days.service';
import { AdminGuard } from '../auth/admin.guard';

/**
 * Scraper endpoints — require admin JWT.
 * Routes: GET /admin/scraper/cron-status, POST /admin/scraper/finish-game-days, etc.
 */
@Controller('admin/scraper')
@UseGuards(AdminGuard)
export class ScraperController {
  constructor(
    private readonly scraperService: ScraperService,
    private readonly cronService: CronService,
    private readonly gameDaysService: GameDaysService,
  ) {}

  @Get('cron-status')
  getCronStatus() {
    return this.cronService.getCronStatus();
  }

  @Post('finish-game-days')
  async finishGameDays(@Query('date') date?: string) {
    const dateStr =
      date?.slice(0, 10) ??
      new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' });
    return this.gameDaysService.finishGameDaysForDate(dateStr);
  }

  @Post('sync/rosters')
  async syncRosters() {
    try {
      return await this.scraperService.syncRosters();
    } catch (err) {
      const msg = (err as Error).message;
      throw new InternalServerErrorException(`Sync Rosters 失败: ${msg}`);
    }
  }

  @Post('sync/season-stats')
  syncSeasonStats() {
    return this.scraperService.syncSeasonStats();
  }

  @Post('sync/schedule')
  syncSchedule(
    @Query('date') date?: string,
    @Query('span') span?: string,
  ) {
    return this.scraperService.syncSchedule(
      date,
      span ? parseInt(span, 10) : 1,
    );
  }

  @Post('sync/active')
  syncActiveGameDays() {
    return this.scraperService.syncActiveGameDays();
  }

  @Post('sync/game-day/:id')
  syncGameDay(@Param('id', ParseIntPipe) id: number) {
    return this.scraperService.syncGameDayById(id);
  }

  @Post('sync/game/:id')
  syncGame(@Param('id', ParseIntPipe) id: number) {
    return this.scraperService.syncGameById(id);
  }

  @Post('sync/mid/:mid')
  syncGameByMid(@Param('mid') mid: string) {
    return this.scraperService.syncGameByMid(mid);
  }

  @Post('aggregate/game-day')
  aggregateGameDay(@Query('date') date?: string) {
    return this.scraperService.aggregateGamesForDate(
      date ?? new Date().toISOString().slice(0, 10),
    );
  }
}
