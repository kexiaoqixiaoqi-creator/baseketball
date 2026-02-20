import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LineupsService } from './lineups.service';
import { CreateLineupDto } from './dto/create-lineup.dto';
import { UpdateLineupDto } from './dto/update-lineup.dto';

@Controller('lineups')
@UseGuards(JwtAuthGuard)
export class LineupsController {
  constructor(private lineupsService: LineupsService) {}

  @Post()
  create(
    @Request() req: { user: { id: number } },
    @Body() dto: CreateLineupDto,
  ) {
    return this.lineupsService.create(req.user.id, dto);
  }

  @Patch(':id')
  update(
    @Request() req: { user: { id: number } },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLineupDto,
  ) {
    return this.lineupsService.update(id, req.user.id, dto);
  }

  @Get('history')
  history(@Request() req: { user: { id: number } }) {
    return this.lineupsService.getHistory(req.user.id);
  }

  @Get('my')
  findMy(
    @Request() req: { user: { id: number } },
    @Query('gameDayId', ParseIntPipe) gameDayId: number,
    @Query('roomId', ParseIntPipe) roomId: number,
  ) {
    return this.lineupsService.findMyLineup(req.user.id, gameDayId, roomId);
  }
}
