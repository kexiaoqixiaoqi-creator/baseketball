import { Controller, Get, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard';
import { TeamsService } from './teams.service';

@Controller('teams')
@UseGuards(AdminGuard)
export class TeamsController {
  constructor(private teamsService: TeamsService) {}

  @Get()
  findAll() {
    return this.teamsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.teamsService.findOne(id);
  }
}
