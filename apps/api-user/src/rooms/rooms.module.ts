import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room, RoomMember, Lineup, User } from '@fantasy-nba/db';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Room, RoomMember, Lineup, User])],
  providers: [RoomsService],
  controllers: [RoomsController],
})
export class RoomsModule {}
