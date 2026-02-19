import { Controller, Get, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard';
import { RoomsService } from './rooms.service';

@Controller('admin/rooms')
@UseGuards(AdminGuard)
export class AdminRoomsController {
  constructor(private roomsService: RoomsService) {}

  @Get()
  findAll() {
    return this.roomsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.roomsService.findOne(id);
  }

  @Get(':id/rankings')
  getRankings(
    @Param('id', ParseIntPipe) id: number,
    @Query('gameDayId', ParseIntPipe) gameDayId: number,
  ) {
    return this.roomsService.getRankings(id, gameDayId);
  }
}
