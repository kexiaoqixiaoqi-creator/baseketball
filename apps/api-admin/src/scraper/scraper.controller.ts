import { Controller, Post, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ScraperService } from './scraper.service';
import { AdminGuard } from '../auth/admin.guard';

/**
 * Scraper endpoints — require admin JWT.
 * Routes: POST /admin/scraper/sync/rosters, /sync/schedule, etc.
 */
@Controller('scraper')
@UseGuards(AdminGuard)
export class ScraperController {
  constructor(private readonly scraperService: ScraperService) {}

  @Post('sync/rosters')
  syncRosters() {
    return this.scraperService.syncRosters();
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
  syncActiveGames() {
    return this.scraperService.syncActiveGames();
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
