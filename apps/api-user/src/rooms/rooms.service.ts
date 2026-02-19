import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room, RoomMember, Lineup, User } from '@fantasy-nba/db';
import { CreateRoomDto } from './dto/create-room.dto';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room) private roomRepo: Repository<Room>,
    @InjectRepository(RoomMember) private roomMemberRepo: Repository<RoomMember>,
    @InjectRepository(Lineup) private lineupRepo: Repository<Lineup>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  async findAll(userId?: number) {
    const rooms = await this.roomRepo.find({ relations: ['members'] });
    return rooms.map((r) => this.mapRoom(r));
  }

  async findOne(id: number) {
    const room = await this.roomRepo.findOne({ where: { id }, relations: ['members'] });
    if (!room) throw new NotFoundException('Room not found');
    return this.mapRoom(room);
  }

  async create(userId: number, dto: CreateRoomDto) {
    const room = this.roomRepo.create({
      name: dto.name,
      ownerId: userId,
      isOfficial: false,
      salaryCap: dto.salaryCap ?? 50000,
      ptsWeight: dto.ptsWeight ?? 1.0,
      rebWeight: dto.rebWeight ?? 1.2,
      astWeight: dto.astWeight ?? 1.5,
      stlWeight: dto.stlWeight ?? 3.0,
      blkWeight: dto.blkWeight ?? 3.0,
      toWeight: dto.toWeight ?? -1.0,
    });
    const saved = await this.roomRepo.save(room);

    // Auto-join owner
    await this.roomMemberRepo.save(
      this.roomMemberRepo.create({ roomId: saved.id, userId }),
    );

    return this.mapRoom(saved);
  }

  async joinRoom(roomId: number, userId: number) {
    const room = await this.roomRepo.findOne({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Room not found');

    const existing = await this.roomMemberRepo.findOne({ where: { roomId, userId } });
    if (existing) return { message: 'Already a member' };

    await this.roomMemberRepo.save(
      this.roomMemberRepo.create({ roomId, userId }),
    );
    return { message: 'Joined successfully' };
  }

  async getRankings(roomId: number, gameDayId: number) {
    const room = await this.roomRepo.findOne({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Room not found');

    const lineups = await this.lineupRepo
      .createQueryBuilder('l')
      .innerJoinAndSelect('l.user', 'u')
      .where('l.roomId = :roomId', { roomId })
      .andWhere('l.gameDayId = :gameDayId', { gameDayId })
      .andWhere('l.totalScore IS NOT NULL')
      .orderBy('l.totalScore', 'DESC')
      .getMany();

    return lineups.map((l, idx) => ({
      rank: idx + 1,
      userId: l.userId,
      username: l.user?.username ?? 'Unknown',
      totalScore: Number(l.totalScore),
      lineupId: l.id,
    }));
  }

  private mapRoom(r: Room) {
    return {
      id: r.id,
      name: r.name,
      isOfficial: r.isOfficial,
      ownerId: r.ownerId,
      salaryCap: r.salaryCap,
      weights: {
        pts: r.ptsWeight,
        reb: r.rebWeight,
        ast: r.astWeight,
        stl: r.stlWeight,
        blk: r.blkWeight,
        to: r.toWeight,
      },
      memberCount: r.members?.length ?? 0,
    };
  }
}
