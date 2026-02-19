import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { GameDaysService } from './game-days.service';

@Controller('game-days')
export class GameDaysUserController {
  constructor(private gameDaysService: GameDaysService) {}

  @Get()
  findAll() {
    return this.gameDaysService.findAllForUser();
  }

  @Get('current')
  getCurrent() {
    return this.gameDaysService.getCurrent();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.gameDaysService.findOneForUser(id);
  }

  @Get(':id/players')
  getEligiblePlayers(@Param('id', ParseIntPipe) id: number) {
    return this.gameDaysService.getEligiblePlayers(id);
  }
}
