import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Player, PlayerSeasonStats } from '@fantasy-nba/db';
import { MappingModule } from '../mapping/mapping.module';
import { PlayersService } from './players.service';
import { AdminPlayersController } from './players.controller';
import { PlayersUserController } from './players-user.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Player, PlayerSeasonStats]), MappingModule],
  providers: [PlayersService],
  controllers: [AdminPlayersController, PlayersUserController],
})
export class PlayersModule {}
