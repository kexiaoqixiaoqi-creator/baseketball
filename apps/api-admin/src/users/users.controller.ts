import { Controller, Get, Patch, Delete, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(AdminGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Patch(':id/toggle-admin')
  toggleAdmin(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.toggleAdmin(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}
