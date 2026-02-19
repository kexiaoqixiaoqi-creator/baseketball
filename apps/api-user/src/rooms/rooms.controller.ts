import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';

@Controller('rooms')
export class RoomsController {
  constructor(private roomsService: RoomsService) {}

  @Get()
  findAll() {
    return this.roomsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.roomsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Request() req: { user: { id: number } },
    @Body() dto: CreateRoomDto,
  ) {
    return this.roomsService.create(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/join')
  join(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: { id: number } },
  ) {
    return this.roomsService.joinRoom(id, req.user.id);
  }

  @Get(':id/rankings')
  getRankings(
    @Param('id', ParseIntPipe) id: number,
    @Query('gameDayId', ParseIntPipe) gameDayId: number,
  ) {
    return this.roomsService.getRankings(id, gameDayId);
  }
}
