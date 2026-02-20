import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Lineup,
  GameDay,
  Room,
  RoomMember,
  Player,
  PlayerSeasonStats,
  GamePlayerStats,
} from '@fantasy-nba/db';
import { GameDaysModule } from '../game-days/game-days.module';
import { LineupsService } from './lineups.service';
import { LineupsController } from './lineups.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Lineup,
      GameDay,
      Room,
      RoomMember,
      Player,
      PlayerSeasonStats,
      GamePlayerStats,
    ]),
    GameDaysModule,
  ],
  providers: [LineupsService],
  controllers: [LineupsController],
})
export class LineupsModule {}
