import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ScraperService } from './scraper.service';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(private scraperService: ScraperService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleHourlyCron() {
    this.logger.log('Running hourly game day sync...');
    await this.scraperService.syncActiveGameDay();
  }
}
