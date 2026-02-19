import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { GameDaysService } from './game-days.service';

@Controller('game-days')
export class GameDaysController {
  constructor(private gameDaysService: GameDaysService) {}

  @Get()
  findAll() {
    return this.gameDaysService.findAll();
  }

  @Get('current')
  getCurrent() {
    return this.gameDaysService.getCurrent();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.gameDaysService.findOne(id);
  }

  @Get(':id/players')
  getEligiblePlayers(@Param('id', ParseIntPipe) id: number) {
    return this.gameDaysService.getEligiblePlayers(id);
  }
}
