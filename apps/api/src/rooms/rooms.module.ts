import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room, RoomMember, Lineup, Player, GameDay, GamePlayerStats } from '@fantasy-nba/db';
import { AuthModule } from '../auth/auth.module';
import { AdminRoomsController } from './rooms.controller';
import { RoomsUserController } from './rooms-user.controller';
import { RoomsService } from './rooms.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Room, RoomMember, Lineup, Player, GameDay, GamePlayerStats]),
    AuthModule,
  ],
  providers: [RoomsService],
  controllers: [AdminRoomsController, RoomsUserController],
})
export class RoomsModule {}
