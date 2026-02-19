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
  ],
  providers: [LineupsService],
  controllers: [LineupsController],
})
export class LineupsModule {}
