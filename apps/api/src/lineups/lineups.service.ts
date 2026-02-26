import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  Lineup,
  GameDay,
  Room,
  RoomMember,
  Player,
  PlayerSeasonStats,
  GamePlayerStats,
  Game,
} from '@fantasy-nba/db';
import { MappingService } from '../mapping/mapping.service';

const SINA_AVATAR_BASE = 'https://www.sinaimg.cn/ty/nba/player/NBA_1_1';
import { computeCostFromSeasonStatsRaw, computeFantasyScore, ScoreWeights, CURRENT_SEASON } from '@fantasy-nba/shared';
import { GameDaysService } from '../game-days/game-days.service';
import { CreateLineupDto } from './dto/create-lineup.dto';
import { UpdateLineupDto } from './dto/update-lineup.dto';

@Injectable()
export class LineupsService {
  constructor(
    @InjectRepository(Lineup) private lineupRepo: Repository<Lineup>,
    @InjectRepository(GameDay) private gameDayRepo: Repository<GameDay>,
    @InjectRepository(Room) private roomRepo: Repository<Room>,
    private readonly gameDaysService: GameDaysService,
    @InjectRepository(RoomMember) private roomMemberRepo: Repository<RoomMember>,
    @InjectRepository(Player) private playerRepo: Repository<Player>,
    @InjectRepository(PlayerSeasonStats)
    private statsRepo: Repository<PlayerSeasonStats>,
    @InjectRepository(GamePlayerStats)
    private gameStatsRepo: Repository<GamePlayerStats>,
    @InjectRepository(Game) private gameRepo: Repository<Game>,
    private readonly mapping: MappingService,
  ) {}

  async create(userId: number, dto: CreateLineupDto) {
    // 1. Verify game day is prepare (only prepare allows lineup submission)
    const gameDay = await this.gameDayRepo.findOne({ where: { id: dto.gameDayId } });
    if (!gameDay) throw new NotFoundException('Game day not found');
    if (gameDay.status !== 'prepare') {
      throw new BadRequestException('Game day is not open for lineup submission');
    }

    // 2. Verify room exists
    const room = await this.roomRepo.findOne({ where: { id: dto.roomId } });
    if (!room) throw new NotFoundException('Room not found');

    // 3. For custom rooms, verify membership
    if (!room.isOfficial) {
      const membership = await this.roomMemberRepo.findOne({
        where: { roomId: dto.roomId, userId },
      });
      if (!membership) {
        throw new ForbiddenException('You are not a member of this room');
      }
    }

    // 4. Verify no duplicate lineup
    const existing = await this.lineupRepo.findOne({
      where: { userId, roomId: dto.roomId, gameDayId: dto.gameDayId },
    });
    if (existing) {
      throw new ConflictException('You already have a lineup for this room and game day');
    }

    // 5. Verify positions match
    const positionMap: Record<string, number> = {
      PG: dto.pgId,
      SG: dto.sgId,
      SF: dto.sfId,
      PF: dto.pfId,
      C: dto.cId,
    };
    const playerIds = Object.values(positionMap);

    // Check for duplicate player IDs
    if (new Set(playerIds).size !== 5) {
      throw new BadRequestException('All 5 players must be different');
    }

    const players = await this.playerRepo.findBy({ id: In(playerIds) });
    if (players.length !== 5) {
      throw new BadRequestException('One or more player IDs are invalid');
    }

    for (const [position, playerId] of Object.entries(positionMap)) {
      const player = players.find((p) => p.id === playerId);
      if (!player || player.position !== position) {
        throw new BadRequestException(
          `Player ${playerId} does not play the ${position} position`,
        );
      }
    }

    // 6. Verify all players are eligible (have a game on this game day)
    const eligibleIds = await this.getEligiblePlayerIds(dto.gameDayId);
    for (const pid of playerIds) {
      if (!eligibleIds.has(pid)) {
        throw new BadRequestException(
          `Player ${pid} has no game scheduled on this game day`,
        );
      }
    }

    // 7. Calculate total cost from season stats × room weights (real-time)
    const statsRows = await this.statsRepo.findBy({
      playerId: In(playerIds),
      season: CURRENT_SEASON,
    });
    const weights: ScoreWeights = {
      pts: room.ptsWeight,
      reb: room.rebWeight,
      ast: room.astWeight,
      stl: room.stlWeight,
      blk: room.blkWeight,
      to: room.toWeight,
    };
    const costMap = new Map<number, number>();
    for (const s of statsRows) {
      costMap.set(s.playerId, computeCostFromSeasonStatsRaw(s, weights));
    }
    const totalCost = playerIds.reduce((sum, id) => sum + (costMap.get(id) ?? 0), 0);

    const salaryCap = await this.gameDaysService.getSalaryCapForRoom(dto.gameDayId, dto.roomId);
    if (totalCost > salaryCap) {
      throw new BadRequestException(
        `Total cost ${totalCost} exceeds the salary cap of ${salaryCap}`,
      );
    }

    // 8. Save lineup
    const lineup = this.lineupRepo.create({
      userId,
      roomId: dto.roomId,
      gameDayId: dto.gameDayId,
      pgId: dto.pgId,
      sgId: dto.sgId,
      sfId: dto.sfId,
      pfId: dto.pfId,
      cId: dto.cId,
      pgCost: costMap.get(dto.pgId) ?? 0,
      sgCost: costMap.get(dto.sgId) ?? 0,
      sfCost: costMap.get(dto.sfId) ?? 0,
      pfCost: costMap.get(dto.pfId) ?? 0,
      cCost: costMap.get(dto.cId) ?? 0,
      totalCost,
      totalScore: null,
    });
    return this.lineupRepo.save(lineup);
  }

  async update(lineupId: number, userId: number, dto: UpdateLineupDto) {
    const lineup = await this.lineupRepo.findOne({
      where: { id: lineupId, userId },
      relations: ['room'],
    });
    if (!lineup) throw new NotFoundException('Lineup not found');

    const gameDay = await this.gameDayRepo.findOne({ where: { id: lineup.gameDayId } });
    if (!gameDay) throw new NotFoundException('Game day not found');
    if (gameDay.status !== 'prepare') {
      throw new BadRequestException('Game day is not open for lineup update');
    }

    const room = lineup.room!;
    const positionMap: Record<string, number> = {
      PG: dto.pgId,
      SG: dto.sgId,
      SF: dto.sfId,
      PF: dto.pfId,
      C: dto.cId,
    };
    const playerIds = Object.values(positionMap);

    if (new Set(playerIds).size !== 5) {
      throw new BadRequestException('All 5 players must be different');
    }

    const players = await this.playerRepo.findBy({ id: In(playerIds) });
    if (players.length !== 5) {
      throw new BadRequestException('One or more player IDs are invalid');
    }

    for (const [position, playerId] of Object.entries(positionMap)) {
      const player = players.find((p) => p.id === playerId);
      if (!player || player.position !== position) {
        throw new BadRequestException(
          `Player ${playerId} does not play the ${position} position`,
        );
      }
    }

    const eligibleIds = await this.getEligiblePlayerIds(lineup.gameDayId);
    for (const pid of playerIds) {
      if (!eligibleIds.has(pid)) {
        throw new BadRequestException(
          `Player ${pid} has no game scheduled on this game day`,
        );
      }
    }

    const statsRows = await this.statsRepo.findBy({
      playerId: In(playerIds),
      season: CURRENT_SEASON,
    });
    const weights: ScoreWeights = {
      pts: room.ptsWeight,
      reb: room.rebWeight,
      ast: room.astWeight,
      stl: room.stlWeight,
      blk: room.blkWeight,
      to: room.toWeight,
    };
    const costMap = new Map<number, number>();
    for (const s of statsRows) {
      costMap.set(s.playerId, computeCostFromSeasonStatsRaw(s, weights));
    }
    const totalCost = playerIds.reduce((sum, id) => sum + (costMap.get(id) ?? 0), 0);

    const salaryCap = await this.gameDaysService.getSalaryCapForRoom(lineup.gameDayId, lineup.roomId);
    if (totalCost > salaryCap) {
      throw new BadRequestException(
        `Total cost ${totalCost} exceeds the salary cap of ${salaryCap}`,
      );
    }

    await this.lineupRepo.update(lineupId, {
      pgId: dto.pgId,
      sgId: dto.sgId,
      sfId: dto.sfId,
      pfId: dto.pfId,
      cId: dto.cId,
      pgCost: costMap.get(dto.pgId) ?? 0,
      sgCost: costMap.get(dto.sgId) ?? 0,
      sfCost: costMap.get(dto.sfId) ?? 0,
      pfCost: costMap.get(dto.pfId) ?? 0,
      cCost: costMap.get(dto.cId) ?? 0,
      totalCost,
    });
    return this.lineupRepo.findOneOrFail({ where: { id: lineupId }, relations: ['room'] });
  }

  async findMyLineup(userId: number, gameDayId: number, roomId: number) {
    const lineup = await this.lineupRepo.findOne({
      where: { userId, gameDayId, roomId },
      relations: ['room'],
    });
    if (!lineup) throw new NotFoundException('Lineup not found');
    const room = lineup.room!;
    const weights: ScoreWeights = {
      pts: room.ptsWeight,
      reb: room.rebWeight,
      ast: room.astWeight,
      stl: room.stlWeight,
      blk: room.blkWeight,
      to: room.toWeight,
    };

    const playerIds = [lineup.pgId, lineup.sgId, lineup.sfId, lineup.pfId, lineup.cId];
    const players = await this.playerRepo.find({
      where: { id: In(playerIds) },
      relations: ['teamEntity'],
    });
    const playerMap = new Map(players.map((p) => [p.id, p]));
    const extIdMap = await this.mapping.getExtIdsByInternalIds('sina', 'player', playerIds);

    const statsRows = await this.statsRepo.findBy({
      playerId: In(playerIds),
      season: CURRENT_SEASON,
    });
    const costMap = new Map<number, number>();
    for (const s of statsRows) {
      costMap.set(s.playerId, computeCostFromSeasonStatsRaw(s, weights));
    }

    const gd = await this.gameDayRepo.findOne({ where: { id: lineup.gameDayId } });
    if (!gd) throw new NotFoundException('Game day not found');
    const gameStats = await this.gameStatsRepo
      .createQueryBuilder('gps')
      .innerJoin('gps.game', 'g')
      .where('g.date = :date', { date: gd.date })
      .andWhere('gps.playerId IN (:...playerIds)', { playerIds })
      .getMany();
    const scoreMap = new Map<number, number>();
    for (const gs of gameStats) {
      scoreMap.set(
        gs.playerId,
        computeFantasyScore(
          { pts: gs.pts, reb: gs.reb, ast: gs.ast, stl: gs.stl, blk: gs.blk, to: gs.toVal },
          weights,
        ),
      );
    }

    const makeSlot = (id: number) => {
      const p = playerMap.get(id);
      const sinaId = extIdMap.get(id);
      const avatarUrl = sinaId ? `${SINA_AVATAR_BASE}/${sinaId}.png` : null;
      const teamCn = p?.teamEntity?.nameCn ?? p?.team ?? '';
      return {
        id,
        name: p?.nameCn ?? p?.name ?? '未知',
        team: teamCn,
        avatarUrl,
        cost: costMap.get(id) ?? 0,
        actualScore: scoreMap.get(id) ?? null,
      };
    };

    return {
      id: lineup.id,
      gameDayId: lineup.gameDayId,
      roomId: lineup.roomId,
      totalCost: lineup.totalCost,
      totalScore: lineup.totalScore !== null ? Number(lineup.totalScore) : null,
      players: {
        PG: makeSlot(lineup.pgId),
        SG: makeSlot(lineup.sgId),
        SF: makeSlot(lineup.sfId),
        PF: makeSlot(lineup.pfId),
        C: makeSlot(lineup.cId),
      },
      createdAt: lineup.createdAt,
    };
  }

  async getHistory(userId: number) {
    const lineups = await this.lineupRepo.find({
      where: { userId },
      relations: ['gameDay', 'room'],
      order: { id: 'DESC' },
    });
    return lineups.map((l) => ({
      id: l.id,
      gameDayId: l.gameDayId,
      gameDayDate: l.gameDay?.date ?? null,
      roomId: l.roomId,
      roomName: l.room?.name ?? null,
      totalCost: l.totalCost,
      totalScore: l.totalScore !== null ? Number(l.totalScore) : null,
      createdAt: l.createdAt,
    }));
  }

  /** 从 gameDayId 获取比赛列表 → 参赛球队 → 这些球队的球员 */
  private async getEligiblePlayerIds(gameDayId: number): Promise<Set<number>> {
    const gameDay = await this.gameDayRepo.findOne({ where: { id: gameDayId } });
    if (!gameDay) return new Set();

    const games = await this.gameRepo.find({ where: { date: gameDay.date } });
    const teamNames = new Set<string>();
    for (const g of games) {
      teamNames.add(g.homeTeam);
      teamNames.add(g.awayTeam);
    }
    if (teamNames.size === 0) return new Set();

    const players = await this.playerRepo.find({
      where: { team: In([...teamNames]) },
      select: ['id'],
    });
    return new Set(players.map((p) => p.id));
  }
}
