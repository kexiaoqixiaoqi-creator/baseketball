import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { GameDay, Game, Lineup, Room, GamePlayerStats } from '@fantasy-nba/db';
import { computeFantasyScore, ScoreWeights } from '@fantasy-nba/shared';
import { CreateGameDayDto } from './dto/create-game-day.dto';

@Injectable()
export class GameDaysService {
  constructor(
    @InjectRepository(GameDay) private gameDayRepo: Repository<GameDay>,
    @InjectRepository(Game) private gameRepo: Repository<Game>,
    @InjectRepository(Lineup) private lineupRepo: Repository<Lineup>,
    @InjectRepository(Room) private roomRepo: Repository<Room>,
    @InjectRepository(GamePlayerStats)
    private gameStatsRepo: Repository<GamePlayerStats>,
  ) {}

  findAll() {
    return this.gameDayRepo.find({ relations: ['games'], order: { date: 'DESC' } });
  }

  async findOne(id: number) {
    const gd = await this.gameDayRepo.findOne({ where: { id }, relations: ['games'] });
    if (!gd) throw new NotFoundException('Game day not found');
    return gd;
  }

  async create(dto: CreateGameDayDto) {
    const gd = this.gameDayRepo.create({
      date: dto.date,
      status: dto.status ?? 'pending',
      salaryCap: dto.salaryCap ?? 50000,
    });
    return this.gameDayRepo.save(gd);
  }

  async setStatus(id: number, status: string) {
    await this.gameDayRepo.update(id, { status });
    return this.findOne(id);
  }

  async complete(gameDayId: number) {
    const gameDay = await this.gameDayRepo.findOne({ where: { id: gameDayId } });
    if (!gameDay) throw new NotFoundException('Game day not found');
    if (gameDay.status === 'completed') {
      throw new BadRequestException('Game day is already completed');
    }

    // Mark all games as completed
    await this.gameRepo.update({ gameDayId }, { status: 'completed' });

    // Load all lineups for this game day
    const lineups = await this.lineupRepo.find({ where: { gameDayId } });

    // Cache rooms to avoid re-querying
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

      // Load actual game stats for these players on this game day
      const statsRows = await this.gameStatsRepo
        .createQueryBuilder('gps')
        .innerJoin('gps.game', 'g')
        .where('g.gameDayId = :gameDayId', { gameDayId })
        .andWhere('gps.playerId IN (:...playerIds)', { playerIds })
        .getMany();

      let totalScore = 0;
      for (const stat of statsRows) {
        const score = computeFantasyScore(
          {
            pts: stat.pts,
            reb: stat.reb,
            ast: stat.ast,
            stl: stat.stl,
            blk: stat.blk,
            to: stat.toVal,
          },
          weights,
        );
        // Store individual fantasy score on game stat
        await this.gameStatsRepo.update(stat.id, { fantasyScore: score });
        totalScore += score;
      }

      await this.lineupRepo.update(lineup.id, { totalScore: Number(totalScore.toFixed(2)) });
    }

    // Mark game day as completed
    await this.gameDayRepo.update(gameDayId, { status: 'completed' });

    return { message: `Game day ${gameDayId} completed. ${lineups.length} lineups scored.` };
  }
}
