import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room, RoomMember, Lineup } from '@fantasy-nba/db';
import { AdminRoomsController } from './rooms.controller';
import { RoomsUserController } from './rooms-user.controller';
import { RoomsService } from './rooms.service';

@Module({
  imports: [TypeOrmModule.forFeature([Room, RoomMember, Lineup])],
  providers: [RoomsService],
  controllers: [AdminRoomsController, RoomsUserController],
})
export class RoomsModule {}
