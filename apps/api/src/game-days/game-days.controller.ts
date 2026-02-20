import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard';
import { GameDaysService } from './game-days.service';
import { CreateGameDayDto } from './dto/create-game-day.dto';

@Controller('admin/game-days')
@UseGuards(AdminGuard)
export class GameDaysController {
  constructor(private gameDaysService: GameDaysService) {}

  @Get()
  findAll() {
    return this.gameDaysService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.gameDaysService.findOne(id);
  }

  @Get(':id/lineups')
  getLineups(@Param('id', ParseIntPipe) id: number) {
    return this.gameDaysService.getLineups(id);
  }

  @Get(':id/player-stats')
  getPlayerStats(@Param('id', ParseIntPipe) id: number) {
    return this.gameDaysService.getPlayerStatsForGameDay(id);
  }

  @Post()
  create(@Body() dto: CreateGameDayDto) {
    return this.gameDaysService.create(dto);
  }

  @Patch(':id/status')
  setStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: string,
  ) {
    return this.gameDaysService.setStatus(id, status);
  }

  @Post(':id/complete')
  complete(@Param('id', ParseIntPipe) id: number) {
    return this.gameDaysService.complete(id);
  }

  @Post(':id/recalculate-salary-cap')
  recalculateSalaryCap(@Param('id', ParseIntPipe) id: number) {
    return this.gameDaysService.recalculateSalaryCap(id);
  }
}
