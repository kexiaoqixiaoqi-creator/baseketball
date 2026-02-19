import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Team, Player, PlayerSeasonStats, GameDay, Game, GamePlayerStats } from '@fantasy-nba/db';
import { SinaModule } from '../sina/sina.module';
import { MappingModule } from '../mapping/mapping.module';
import { RosterSyncService } from './roster.sync.service';
import { SeasonStatsSyncService } from './season-stats.sync.service';
import { ScheduleSyncService } from './schedule.sync.service';
import { GameStatsSyncService } from './game-stats.sync.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Team, Player, PlayerSeasonStats, GameDay, Game, GamePlayerStats]),
    SinaModule,
    MappingModule,
  ],
  providers: [
    RosterSyncService,
    SeasonStatsSyncService,
    ScheduleSyncService,
    GameStatsSyncService,
  ],
  exports: [
    RosterSyncService,
    SeasonStatsSyncService,
    ScheduleSyncService,
    GameStatsSyncService,
  ],
})
export class SyncModule {}
