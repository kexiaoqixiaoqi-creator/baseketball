import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from '@fantasy-nba/db';

@Injectable()
export class RoomsService {
  constructor(@InjectRepository(Room) private roomRepo: Repository<Room>) {}

  findAll() {
    return this.roomRepo.find({ relations: ['members'], order: { createdAt: 'DESC' } });
  }
}
