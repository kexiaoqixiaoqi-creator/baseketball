import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameDay, Game, GamePlayerStats, Player } from '@fantasy-nba/db';
import { ScraperService } from './scraper.service';
import { ScraperController } from './scraper.controller';
import { CronService } from './cron.service';

@Module({
  imports: [TypeOrmModule.forFeature([GameDay, Game, GamePlayerStats, Player])],
  providers: [ScraperService, CronService],
  controllers: [ScraperController],
})
export class ScraperModule {}
