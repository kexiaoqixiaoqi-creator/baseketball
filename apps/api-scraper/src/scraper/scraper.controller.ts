import { Controller, Post, Param, ParseIntPipe } from '@nestjs/common';
import { ScraperService } from './scraper.service';

@Controller('scraper')
export class ScraperController {
  constructor(private scraperService: ScraperService) {}

  @Post('sync/active')
  syncActive() {
    return this.scraperService.syncActiveGameDay();
  }

  @Post('sync/game-day/:id')
  syncGameDay(@Param('id', ParseIntPipe) id: number) {
    return this.scraperService.syncGameDayById(id);
  }
}
