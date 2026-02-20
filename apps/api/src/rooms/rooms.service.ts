import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Room, Lineup, RoomMember, Player, GameDay, Game, GamePlayerStats } from '@fantasy-nba/db';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { SALARY_CAP_COEFFICIENT_DEFAULT, SCORE_WEIGHTS_DEFAULT } from '@fantasy-nba/shared';

@Injectable()
export class RoomsService implements OnModuleInit {
  constructor(
    @InjectRepository(Room) private roomRepo: Repository<Room>,
    @InjectRepository(Lineup) private lineupRepo: Repository<Lineup>,
    @InjectRepository(RoomMember) private roomMemberRepo: Repository<RoomMember>,
    @InjectRepository(Player) private playerRepo: Repository<Player>,
    @InjectRepository(GameDay) private gameDayRepo: Repository<GameDay>,
    @InjectRepository(GamePlayerStats) private gameStatsRepo: Repository<GamePlayerStats>,
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

    const gameDay = await this.gameDayRepo.findOne({ where: { id: gameDayId } });
    if (!gameDay) throw new NotFoundException('Game day not found');

    const lineups = await this.lineupRepo.find({
      where: { roomId, gameDayId },
      relations: ['user'],
      order: { totalScore: 'DESC' },
    });

    const allPlayerIds = new Set<number>();
    for (const l of lineups) {
      allPlayerIds.add(l.pgId).add(l.sgId).add(l.sfId).add(l.pfId).add(l.cId);
    }
    const playerIds = [...allPlayerIds];
    const playerMap = new Map<number, Player>();
    if (playerIds.length > 0) {
      const players = await this.playerRepo.find({ where: { id: In(playerIds) } });
      for (const p of players) playerMap.set(p.id, p);
    }

    const scoreMap = new Map<number, number>();
    if (playerIds.length > 0) {
      const statsRows = await this.gameStatsRepo
        .createQueryBuilder('gps')
        .innerJoin('gps.game', 'g')
        .where('g.date = :date', { date: gameDay.date })
        .andWhere('gps.playerId IN (:...playerIds)', { playerIds })
        .getMany();
      for (const gs of statsRows) {
        const cur = scoreMap.get(gs.playerId) ?? 0;
        scoreMap.set(gs.playerId, cur + Number(gs.fantasyScore));
      }
    }

    const makeSlot = (id: number, pos: string) => {
      const p = playerMap.get(id);
      return {
        position: pos,
        name: p?.nameCn ?? p?.name ?? '—',
        score: scoreMap.get(id) ?? null,
      };
    };

    return lineups.map((l, i) => ({
      rank: i + 1,
      user: { id: l.userId, username: l.user?.username ?? '—' },
      totalScore: l.totalScore !== null ? Number(l.totalScore) : null,
      totalCost: l.totalCost,
      players: {
        PG: makeSlot(l.pgId, 'PG'),
        SG: makeSlot(l.sgId, 'SG'),
        SF: makeSlot(l.sfId, 'SF'),
        PF: makeSlot(l.pfId, 'PF'),
        C: makeSlot(l.cId, 'C'),
      },
      createdAt: l.createdAt,
    }));
  }

  async findAllForUser() {
    const rooms = await this.roomRepo.find({ relations: ['members'], order: { createdAt: 'DESC' } });
    return rooms.map((r) => this.mapRoomForUser(r));
  }

  /** 用于榜单筛选：官方房间 + 用户已加入的房间 */
  async findForRankings(userId?: number) {
    const official = await this.roomRepo.findOne({
      where: { isOfficial: true },
      relations: ['members'],
    });
    const result = [];
    if (official) result.push(this.mapRoomForUser(official));
    if (userId) {
      const memberships = await this.roomMemberRepo.find({
        where: { userId },
        relations: ['room', 'room.members'],
      });
      for (const m of memberships) {
        if (m.room && !m.room.isOfficial && !result.some((r: { id: number }) => r.id === m.room!.id)) {
          result.push(this.mapRoomForUser(m.room));
        }
      }
    }
    return result;
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

  /** 管理员更新房间（如系数） */
  async adminUpdate(roomId: number, dto: UpdateRoomDto) {
    const room = await this.roomRepo.findOne({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Room not found');
    if (dto.salaryCapCoefficient != null) {
      room.salaryCapCoefficient = dto.salaryCapCoefficient;
      await this.roomRepo.save(room);
    }
    return this.roomRepo.findOne({ where: { id: roomId }, relations: ['members'] });
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
