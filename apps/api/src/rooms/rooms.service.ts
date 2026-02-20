import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room, Lineup, RoomMember } from '@fantasy-nba/db';
import { CreateRoomDto } from './dto/create-room.dto';
import { SALARY_CAP_COEFFICIENT_DEFAULT, SCORE_WEIGHTS_DEFAULT } from '@fantasy-nba/shared';

@Injectable()
export class RoomsService implements OnModuleInit {
  constructor(
    @InjectRepository(Room) private roomRepo: Repository<Room>,
    @InjectRepository(Lineup) private lineupRepo: Repository<Lineup>,
    @InjectRepository(RoomMember) private roomMemberRepo: Repository<RoomMember>,
  ) {}

  async onModuleInit() {
    const existing = await this.roomRepo.findOne({ where: { isOfficial: true } });
    if (!existing) {
      await this.roomRepo.save(
        this.roomRepo.create({
          name: '官方房间',
          ownerId: null,
          isOfficial: true,
          salaryCapCoefficient: SALARY_CAP_COEFFICIENT_DEFAULT,
          ptsWeight: SCORE_WEIGHTS_DEFAULT.pts,
          rebWeight: SCORE_WEIGHTS_DEFAULT.reb,
          astWeight: SCORE_WEIGHTS_DEFAULT.ast,
          stlWeight: SCORE_WEIGHTS_DEFAULT.stl,
          blkWeight: SCORE_WEIGHTS_DEFAULT.blk,
          toWeight: SCORE_WEIGHTS_DEFAULT.to,
        }),
      );
    }
  }

  findAll() {
    return this.roomRepo.find({ relations: ['members'], order: { createdAt: 'DESC' } });
  }

  async findOfficial() {
    const room = await this.roomRepo.findOne({ where: { isOfficial: true }, relations: ['members'] });
    if (!room) throw new NotFoundException('Official room not found');
    return this.mapRoomForUser(room);
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

  async findAllForUser() {
    const rooms = await this.roomRepo.find({ relations: ['members'], order: { createdAt: 'DESC' } });
    return rooms.map((r) => this.mapRoomForUser(r));
  }

  async findOneForUser(id: number) {
    const room = await this.roomRepo.findOne({ where: { id }, relations: ['members'] });
    if (!room) throw new NotFoundException('Room not found');
    return this.mapRoomForUser(room);
  }

  async create(userId: number, dto: CreateRoomDto) {
    const room = this.roomRepo.create({
      name: dto.name,
      ownerId: userId,
      isOfficial: false,
      salaryCapCoefficient: dto.salaryCapCoefficient ?? SALARY_CAP_COEFFICIENT_DEFAULT,
      ptsWeight: dto.ptsWeight ?? 1.0,
      rebWeight: dto.rebWeight ?? 1.2,
      astWeight: dto.astWeight ?? 1.5,
      stlWeight: dto.stlWeight ?? 3.0,
      blkWeight: dto.blkWeight ?? 3.0,
      toWeight: dto.toWeight ?? -1.0,
    });
    const saved = await this.roomRepo.save(room);
    await this.roomMemberRepo.save(
      this.roomMemberRepo.create({ roomId: saved.id, userId }),
    );
    return this.mapRoomForUser(saved);
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

  private mapRoomForUser(r: Room) {
    return {
      id: r.id,
      name: r.name,
      isOfficial: r.isOfficial,
      ownerId: r.ownerId,
      salaryCapCoefficient: r.salaryCapCoefficient,
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
