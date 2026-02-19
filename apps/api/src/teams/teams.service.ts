import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from '@fantasy-nba/db';

@Injectable()
export class TeamsService {
  constructor(@InjectRepository(Team) private teamRepo: Repository<Team>) {}

  findAll() {
    return this.teamRepo.find({ order: { name: 'ASC' } });
  }

  async findOne(id: number) {
    const team = await this.teamRepo.findOne({ where: { id }, relations: ['players'] });
    if (!team) throw new NotFoundException('Team not found');
    return team;
  }
}
