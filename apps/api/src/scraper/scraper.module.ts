import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameDay, Game } from '@fantasy-nba/db';
import { SyncModule } from '../sync/sync.module';
import { ScraperService } from './scraper.service';
import { ScraperController } from './scraper.controller';
import { CronService } from './cron.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([GameDay, Game]),
    SyncModule,
  ],
  providers: [ScraperService, CronService],
  controllers: [ScraperController],
})
export class ScraperModule {}
