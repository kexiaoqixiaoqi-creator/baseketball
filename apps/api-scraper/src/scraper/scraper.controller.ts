import { Controller, Post, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ScraperService } from './scraper.service';

/**
 * Manual-trigger endpoints for every sync operation.
 * Useful for testing, backfilling, and one-off refreshes.
 */
@Controller('scraper')
export class ScraperController {
  constructor(private readonly scraperService: ScraperService) {}

  // ── Roster & player info ─────────────────────────────────────────────────

  /** Pull all 30 team rosters and upsert players + ext_id_map entries. */
  @Post('sync/rosters')
  syncRosters() {
    return this.scraperService.syncRosters();
  }

  // ── Season stats ─────────────────────────────────────────────────────────

  /** Sync per-player season averages and recompute salary costs. */
  @Post('sync/season-stats')
  syncSeasonStats() {
    return this.scraperService.syncSeasonStats();
  }

  // ── Schedule ─────────────────────────────────────────────────────────────

  /**
   * Sync game schedule.
   * @query date  Start date YYYY-MM-DD (defaults to today)
   * @query span  Number of days to cover (defaults to 1)
   */
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

  // ── Live game stats ───────────────────────────────────────────────────────

  /** Sync all currently active (in_progress) games for the active game day. */
  @Post('sync/active')
  syncActiveGames() {
    return this.scraperService.syncActiveGames();
  }

  /** Sync all games belonging to a game day (by internal game-day id). */
  @Post('sync/game-day/:id')
  syncGameDay(@Param('id', ParseIntPipe) id: number) {
    return this.scraperService.syncGameDayById(id);
  }

  /** Sync a single game by its internal game id. */
  @Post('sync/game/:id')
  syncGame(@Param('id', ParseIntPipe) id: number) {
    return this.scraperService.syncGameById(id);
  }

  /** Sync a single game by its Sina external mid (UUID). */
  @Post('sync/mid/:mid')
  syncGameByMid(@Param('mid') mid: string) {
    return this.scraperService.syncGameByMid(mid);
  }
}
