import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard';
import { PlayersService } from './players.service';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';

@Controller('players')
@UseGuards(AdminGuard)
export class PlayersController {
  constructor(private playersService: PlayersService) {}

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('position') position?: string,
    @Query('team') team?: string,
  ) {
    return this.playersService.findAll({ search, position, team });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.playersService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreatePlayerDto) {
    return this.playersService.create(dto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePlayerDto) {
    return this.playersService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.playersService.remove(id);
  }

  @Post('recalculate-costs')
  recalculateCosts() {
    return this.playersService.recalculateCosts();
  }
}
