import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameDay, Player } from '@fantasy-nba/db';
import { GameDaysService } from './game-days.service';
import { GameDaysController } from './game-days.controller';

@Module({
  imports: [TypeOrmModule.forFeature([GameDay, Player])],
  providers: [GameDaysService],
  controllers: [GameDaysController],
  exports: [GameDaysService],
})
export class GameDaysModule {}
