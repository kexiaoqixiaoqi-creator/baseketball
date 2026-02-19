import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameDay, Game, Lineup, Room, GamePlayerStats, Player } from '@fantasy-nba/db';
import { GameDaysService } from './game-days.service';
import { GameDaysController } from './game-days.controller';
import { GameDaysUserController } from './game-days-user.controller';

@Module({
  imports: [TypeOrmModule.forFeature([GameDay, Game, Lineup, Room, GamePlayerStats, Player])],
  providers: [GameDaysService],
  controllers: [GameDaysController, GameDaysUserController],
})
export class GameDaysModule {}
