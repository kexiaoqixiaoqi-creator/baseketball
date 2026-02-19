import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LineupsService } from './lineups.service';
import { CreateLineupDto } from './dto/create-lineup.dto';

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
