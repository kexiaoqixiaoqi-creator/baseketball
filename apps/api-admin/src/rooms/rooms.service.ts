import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room, Lineup } from '@fantasy-nba/db';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room) private roomRepo: Repository<Room>,
    @InjectRepository(Lineup) private lineupRepo: Repository<Lineup>,
  ) {}

  findAll() {
    return this.roomRepo.find({ relations: ['members'], order: { createdAt: 'DESC' } });
  }

  async findOne(id: number) {
    const room = await this.roomRepo.findOne({ where: { id }, relations: ['members'] });
    if (!room) throw new NotFoundException('Room not found');
    return room;
  }

  async getRankings(roomId: number, gameDayId: number) {
    const room = await this.roomRepo.findOne({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Room not found');

    const lineups = await this.lineupRepo.find({
      where: { roomId, gameDayId },
      relations: ['user'],
      order: { totalScore: 'DESC' },
    });

    return lineups.map((l, i) => ({
      rank: i + 1,
      user: { id: l.userId, username: l.user?.username ?? '—' },
      totalScore: l.totalScore !== null ? Number(l.totalScore) : null,
      totalCost: l.totalCost,
      players: { pg: l.pgId, sg: l.sgId, sf: l.sfId, pf: l.pfId, c: l.cId },
      createdAt: l.createdAt,
    }));
  }
}
