import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { GameDaysService } from './game-days.service';

@Controller('game-days')
export class GameDaysUserController {
  constructor(private gameDaysService: GameDaysService) {}

  @Get()
  findAll(@Query('roomId') roomIdStr?: string) {
    const roomId = roomIdStr ? parseInt(roomIdStr, 10) : undefined;
    return this.gameDaysService.findAllForUser(roomId);
  }

  @Get('current')
  getCurrent(@Query('roomId') roomIdStr?: string) {
    const roomId = roomIdStr ? parseInt(roomIdStr, 10) : undefined;
    return this.gameDaysService.getCurrent(roomId);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('roomId') roomIdStr?: string,
  ) {
    const roomId = roomIdStr ? parseInt(roomIdStr, 10) : undefined;
    return this.gameDaysService.findOneForUser(id, roomId);
  }

  @Get(':id/players')
  getEligiblePlayers(
    @Param('id', ParseIntPipe) id: number,
    @Query('roomId') roomIdStr?: string,
  ) {
    const roomId = roomIdStr ? parseInt(roomIdStr, 10) : undefined;
    return this.gameDaysService.getEligiblePlayers(id, roomId);
  }
}
