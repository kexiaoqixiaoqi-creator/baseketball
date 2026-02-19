import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { PlayersService } from './players.service';

@Controller('players')
export class PlayersUserController {
  constructor(private playersService: PlayersService) {}

  @Get()
  findAll(@Query('position') position?: string, @Query('team') team?: string) {
    return this.playersService.findAllForUser(position, team);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.playersService.findOneForUser(id);
  }
}
