import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameDay, Game, Lineup, Room, GamePlayerStats } from '@fantasy-nba/db';
import { GameDaysService } from './game-days.service';
import { GameDaysController } from './game-days.controller';

@Module({
  imports: [TypeOrmModule.forFeature([GameDay, Game, Lineup, Room, GamePlayerStats])],
  providers: [GameDaysService],
  controllers: [GameDaysController],
})
export class GameDaysModule {}
