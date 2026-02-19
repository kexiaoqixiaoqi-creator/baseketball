import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameDay, Player } from '@fantasy-nba/db';
import { CURRENT_SEASON } from '@fantasy-nba/shared';

@Injectable()
export class GameDaysService {
  constructor(
    @InjectRepository(GameDay) private gameDayRepo: Repository<GameDay>,
    @InjectRepository(Player) private playerRepo: Repository<Player>,
  ) {}

  async getCurrent() {
    const gameDay = await this.gameDayRepo.findOne({
      where: { status: 'active' },
      relations: ['games'],
      order: { date: 'DESC' },
    });
    if (!gameDay) {
      throw new NotFoundException('No active game day found');
    }
    return this.mapGameDay(gameDay);
  }

  async findOne(id: number) {
    const gameDay = await this.gameDayRepo.findOne({
      where: { id },
      relations: ['games'],
    });
    if (!gameDay) throw new NotFoundException(`Game day ${id} not found`);
    return this.mapGameDay(gameDay);
  }

  async findAll() {
    const gameDays = await this.gameDayRepo.find({
      relations: ['games'],
      order: { date: 'DESC' },
    });
    return gameDays.map((gd) => this.mapGameDay(gd));
  }

  async getEligiblePlayers(gameDayId: number) {
    const gameDay = await this.gameDayRepo.findOne({ where: { id: gameDayId } });
    if (!gameDay) throw new NotFoundException(`Game day ${gameDayId} not found`);

    const players = await this.playerRepo
      .createQueryBuilder('p')
      .innerJoin('p.gameStats', 'gps')
      .innerJoin('gps.game', 'g')
      .where('g.gameDayId = :gameDayId', { gameDayId })
      .leftJoinAndSelect(
        'p.seasonStats',
        'ss',
        'ss.season = :season',
        { season: CURRENT_SEASON },
      )
      .orderBy('ss.cost', 'DESC')
      .getMany();

    return players.map((p) => {
      const stats = p.seasonStats?.[0];
      return {
        id: p.id,
        name: p.name,
        position: p.position,
        team: p.team,
        jerseyNumber: p.jerseyNumber,
        isActive: p.isActive,
        cost: stats ? stats.cost : 0,
        seasonStats: stats
          ? {
              ppg: Number(stats.ppg),
              rpg: Number(stats.rpg),
              apg: Number(stats.apg),
              spg: Number(stats.spg),
              bpg: Number(stats.bpg),
              topg: Number(stats.topg),
              mpg: Number(stats.mpg),
              fantasyScore: Number(stats.fantasyScore),
              cost: stats.cost,
            }
          : undefined,
      };
    });
  }

  private mapGameDay(gd: GameDay) {
    return {
      id: gd.id,
      date: gd.date,
      status: gd.status,
      salaryCap: gd.salaryCap,
      games: (gd.games ?? []).map((g) => ({
        id: g.id,
        homeTeam: g.homeTeam,
        awayTeam: g.awayTeam,
        status: g.status,
      })),
    };
  }
}
