import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameDay, Game, Lineup, Room, GamePlayerStats, Player } from '@fantasy-nba/db';
import { computeCostFromSeasonStatsRaw, computeFantasyScore, computeSalaryCapFromEligiblePlayers, ScoreWeights, CURRENT_SEASON } from '@fantasy-nba/shared';
import { CreateGameDayDto } from './dto/create-game-day.dto';
import { ScheduleSyncService } from '../sync/schedule.sync.service';
import { GameStatsSyncService } from '../sync/game-stats.sync.service';

@Injectable()
export class GameDaysService {
  private readonly logger = new Logger(GameDaysService.name);

  constructor(
    @InjectRepository(GameDay) private gameDayRepo: Repository<GameDay>,
    @InjectRepository(Game) private gameRepo: Repository<Game>,
    @InjectRepository(Lineup) private lineupRepo: Repository<Lineup>,
    @InjectRepository(Room) private roomRepo: Repository<Room>,
    @InjectRepository(GamePlayerStats) private gameStatsRepo: Repository<GamePlayerStats>,
    @InjectRepository(Player) private playerRepo: Repository<Player>,
    private readonly scheduleSync: ScheduleSyncService,
    private readonly gameStatsSync: GameStatsSyncService,
  ) {}

  async findAll() {
    const list = await this.gameDayRepo.find({ order: { date: 'DESC' } });
    return Promise.all(
      list.map(async (gd) => {
        const games = await this.gameRepo.find({ where: { date: gd.date } });
        return { ...gd, games };
      }),
    );
  }

  async findOne(id: number) {
    const gd = await this.gameDayRepo.findOne({ where: { id } });
    if (!gd) throw new NotFoundException('Game day not found');
    const games = await this.gameRepo.find({ where: { date: gd.date } });
    return { ...gd, games };
  }

  async create(dto: CreateGameDayDto) {
    const dateStr = dto.date.slice(0, 10);

    // 1. 同步比赛日赛程（新浪 API 拉取当日赛程，创建或关联 Games）
    await this.scheduleSync.syncSchedule(dateStr, 1);

    const officialRoom = await this.roomRepo.findOne({ where: { isOfficial: true } });
    const defaultRoomId = officialRoom?.id ?? null;

    let gd = await this.gameDayRepo.findOne({ where: { date: dateStr } });
    if (!gd) {
      gd = this.gameDayRepo.create({
        date: dateStr,
        status: dto.status ?? 'prepare',
        roomId: defaultRoomId,
      });
      gd = await this.gameDayRepo.save(gd);
    } else if (dto.status || defaultRoomId !== null) {
      await this.gameDayRepo.update(gd.id, {
        ...(dto.status && { status: dto.status }),
        ...(defaultRoomId !== null && { roomId: defaultRoomId }),
      });
      gd = await this.gameDayRepo.findOneOrFail({ where: { id: gd.id } });
    }

    const games = await this.gameRepo.find({ where: { date: dateStr } });
    // 3. 初始化比赛日球员数据（同步每场比赛的 game_player_stats）
    for (const game of games) {
      try {
        await this.gameStatsSync.syncByInternalId(game.id);
      } catch (err) {
        this.logger.warn(`Game ${game.id} stats sync failed: ${(err as Error).message}`);
      }
    }

    // 4. 根据当日参赛球员平均数据和关联 room 的 salaryCapCoefficient 计算并存储 salaryCap
    if (defaultRoomId && officialRoom) {
      const salaryCap = await this.getSalaryCapForRoom(gd.id, defaultRoomId);
      await this.gameDayRepo.update(gd.id, { salaryCap });
    }

    return this.findOne(gd.id);
  }

  async setStatus(id: number, status: string) {
    await this.gameDayRepo.update(id, { status });
    return this.findOne(id);
  }

  async getPlayerStatsForGameDay(gameDayId: number) {
    const gameDay = await this.gameDayRepo.findOne({ where: { id: gameDayId } });
    if (!gameDay) throw new NotFoundException(`Game day ${gameDayId} not found`);

    const stats = await this.gameStatsRepo
      .createQueryBuilder('gps')
      .innerJoinAndSelect('gps.game', 'g')
      .innerJoinAndSelect('gps.player', 'p')
      .where('g.date = :date', { date: gameDay.date })
      .orderBy('g.id')
      .addOrderBy('gps.pts', 'DESC')
      .getMany();

    return stats.map((s) => ({
      id: s.id,
      playerId: s.playerId,
      gameId: s.gameId,
      playerName: s.player?.name ?? '—',
      playerNameCn: s.player?.nameCn ?? null,
      position: s.player?.position ?? '—',
      team: s.player?.team ?? '—',
      pts: s.pts,
      reb: s.reb,
      ast: s.ast,
      stl: s.stl,
      blk: s.blk,
      to: s.toVal,
      min: s.min,
      fantasyScore: s.fantasyScore != null ? Number(s.fantasyScore) : null,
      game: {
        id: s.game.id,
        homeTeam: s.game.homeTeam,
        awayTeam: s.game.awayTeam,
        status: s.game.status,
      },
    }));
  }

  async getLineups(gameDayId: number) {
    const gd = await this.gameDayRepo.findOne({ where: { id: gameDayId } });
    if (!gd) throw new NotFoundException('Game day not found');

    const lineups = await this.lineupRepo.find({
      where: { gameDayId },
      relations: ['user', 'room'],
      order: { totalScore: 'DESC' },
    });

    return lineups.map((l) => ({
      id: l.id,
      user: { id: l.userId, username: l.user?.username ?? '—' },
      room: { id: l.roomId, name: l.room?.name ?? '—' },
      players: { pg: l.pgId, sg: l.sgId, sf: l.sfId, pf: l.pfId, c: l.cId },
      totalCost: l.totalCost,
      totalScore: l.totalScore !== null ? Number(l.totalScore) : null,
      createdAt: l.createdAt,
    }));
  }

  async complete(gameDayId: number) {
    const gameDay = await this.gameDayRepo.findOne({ where: { id: gameDayId } });
    if (!gameDay) throw new NotFoundException('Game day not found');
    if (gameDay.status === 'finish') {
      throw new BadRequestException('Game day is already completed');
    }

    await this.gameRepo.update({ date: gameDay.date }, { status: 'finish' });

    const lineups = await this.lineupRepo.find({ where: { gameDayId } });
    const roomCache = new Map<number, Room>();

    for (const lineup of lineups) {
      let room = roomCache.get(lineup.roomId);
      if (!room) {
        const found = await this.roomRepo.findOne({ where: { id: lineup.roomId } });
        if (!found) continue;
        room = found;
        roomCache.set(lineup.roomId, room);
      }

      const weights: ScoreWeights = {
        pts: room.ptsWeight,
        reb: room.rebWeight,
        ast: room.astWeight,
        stl: room.stlWeight,
        blk: room.blkWeight,
        to: room.toWeight,
      };

      const playerIds = [lineup.pgId, lineup.sgId, lineup.sfId, lineup.pfId, lineup.cId];

      const statsRows = await this.gameStatsRepo
        .createQueryBuilder('gps')
        .innerJoin('gps.game', 'g')
        .where('g.date = :date', { date: gameDay.date })
        .andWhere('gps.playerId IN (:...playerIds)', { playerIds })
        .getMany();

      let totalScore = 0;
      for (const stat of statsRows) {
        const score = computeFantasyScore(
          { pts: stat.pts, reb: stat.reb, ast: stat.ast, stl: stat.stl, blk: stat.blk, to: stat.toVal },
          weights,
        );
        await this.gameStatsRepo.update(stat.id, { fantasyScore: score });
        totalScore += score;
      }

      await this.lineupRepo.update(lineup.id, { totalScore: Number(totalScore.toFixed(2)) });
    }

    await this.gameDayRepo.update(gameDayId, { status: 'finish' });
    return { message: `Game day ${gameDayId} completed. ${lineups.length} lineups scored.` };
  }

  async findAllForUser(roomId?: number) {
    const list = await this.gameDayRepo.find({ order: { date: 'DESC' } });
    const room = await this.roomRepo.findOne({
      where: roomId ? { id: roomId } : { isOfficial: true },
    });
    const salaryCaps = room
      ? await Promise.all(list.map((gd) => this.getSalaryCapForRoom(gd.id, room.id)))
      : list.map(() => 50000);
    return Promise.all(list.map((gd, i) => this.mapGameDayForUser(gd, salaryCaps[i])));
  }

  async findOneForUser(id: number, roomId?: number) {
    const gd = await this.gameDayRepo.findOne({ where: { id } });
    if (!gd) throw new NotFoundException('Game day not found');
    const room = await this.roomRepo.findOne({
      where: roomId ? { id: roomId } : { isOfficial: true },
    });
    const salaryCap = room ? await this.getSalaryCapForRoom(id, room.id) : gd.salaryCap;
    return this.mapGameDayForUser(gd, salaryCap);
  }

  async getCurrent(roomId?: number) {
    const gameDay = await this.gameDayRepo.findOne({
      where: { status: 'playing' },
      order: { date: 'DESC' },
    });
    if (!gameDay) {
      throw new NotFoundException('No active game day found');
    }
    const room = await this.roomRepo.findOne({
      where: roomId ? { id: roomId } : { isOfficial: true },
    });
    const salaryCap = room ? await this.getSalaryCapForRoom(gameDay.id, room.id) : gameDay.salaryCap;
    return this.mapGameDayForUser(gameDay, salaryCap);
  }

  /** 根据 (gameDayId, roomId) 计算 salaryCap：当日可选球员平均 cost × LINEUP_SLOTS × room.salaryCapCoefficient */
  async getSalaryCapForRoom(gameDayId: number, roomId: number): Promise<number> {
    const { costs, room } = await this.getEligiblePlayersData(gameDayId, roomId);
    return computeSalaryCapFromEligiblePlayers(costs, room.salaryCapCoefficient);
  }

  private async getEligiblePlayersData(gameDayId: number, roomId?: number) {
    const gameDay = await this.gameDayRepo.findOne({ where: { id: gameDayId } });
    if (!gameDay) throw new NotFoundException(`Game day ${gameDayId} not found`);

    const room = await this.roomRepo.findOne({
      where: roomId ? { id: roomId } : { isOfficial: true },
    });
    if (!room) throw new NotFoundException('Room not found');
    const weights: ScoreWeights = {
      pts: room.ptsWeight,
      reb: room.rebWeight,
      ast: room.astWeight,
      stl: room.stlWeight,
      blk: room.blkWeight,
      to: room.toWeight,
    };

    const games = await this.gameRepo.find({
      where: { date: gameDay.date },
      select: ['homeTeamId', 'awayTeamId'],
    });
    const teamIds = new Set<number>();
    for (const g of games) {
      if (g.homeTeamId != null) teamIds.add(g.homeTeamId);
      if (g.awayTeamId != null) teamIds.add(g.awayTeamId);
    }

    if (teamIds.size === 0) {
      return { withCost: [], costs: [], room };
    }

    const players = await this.playerRepo
      .createQueryBuilder('p')
      .where('p.teamId IN (:...teamIds)', { teamIds: Array.from(teamIds) })
      .leftJoinAndSelect(
        'p.seasonStats',
        'ss',
        'ss.season = :season',
        { season: CURRENT_SEASON },
      )
      .getMany();

    const withCost = players.map((p) => {
      const stats = p.seasonStats?.[0];
      const cost = computeCostFromSeasonStatsRaw(stats, weights);
      return { p, stats, cost };
    });
    return { withCost, costs: withCost.map((x) => x.cost), room };
  }

  async getEligiblePlayers(gameDayId: number, roomId?: number) {
    const { withCost, costs, room } = await this.getEligiblePlayersData(gameDayId, roomId);
    const salaryCap = computeSalaryCapFromEligiblePlayers(costs, room.salaryCapCoefficient);
    withCost.sort((a, b) => b.cost - a.cost);

    const players = withCost.map(({ p, stats, cost }) => ({
      id: p.id,
      name: p.name,
      nameCn: p.nameCn ?? null,
      position: p.position,
      team: p.team,
      jerseyNumber: p.jerseyNumber,
      isActive: p.isActive,
      cost,
      seasonStats: stats
        ? {
            ppg: Number(stats.ppg),
            rpg: Number(stats.rpg),
            apg: Number(stats.apg),
            spg: Number(stats.spg),
            bpg: Number(stats.bpg),
            topg: Number(stats.topg),
            mpg: Number(stats.mpg),
          }
        : undefined,
    }));
    return { players, salaryCap };
  }

  private async mapGameDayForUser(gd: GameDay, salaryCap: number) {
    const games = await this.gameRepo.find({ where: { date: gd.date } });
    return {
      id: gd.id,
      date: gd.date,
      status: gd.status,
      salaryCap,
      games: games.map((g) => ({
        id: g.id,
        homeTeam: g.homeTeam,
        awayTeam: g.awayTeam,
        status: g.status,
      })),
    };
  }
}
