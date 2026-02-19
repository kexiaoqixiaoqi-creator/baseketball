import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Player, PlayerSeasonStats } from '@fantasy-nba/db';
import { CURRENT_SEASON } from '@fantasy-nba/shared';

@Injectable()
export class PlayersService {
  constructor(
    @InjectRepository(Player) private playerRepo: Repository<Player>,
    @InjectRepository(PlayerSeasonStats)
    private statsRepo: Repository<PlayerSeasonStats>,
  ) {}

  async findAll(position?: string, team?: string) {
    const qb = this.playerRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect(
        'p.seasonStats',
        'ss',
        'ss.season = :season',
        { season: CURRENT_SEASON },
      )
      .where('p.isActive = true');

    if (position) qb.andWhere('p.position = :position', { position });
    if (team) qb.andWhere('p.team = :team', { team });
    qb.orderBy('ss.cost', 'DESC');

    const players = await qb.getMany();
    return players.map((p) => this.mapPlayer(p));
  }

  async findOne(id: number) {
    const p = await this.playerRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect(
        'p.seasonStats',
        'ss',
        'ss.season = :season',
        { season: CURRENT_SEASON },
      )
      .where('p.id = :id', { id })
      .getOneOrFail();
    return this.mapPlayer(p);
  }

  private mapPlayer(p: Player) {
    const stats = p.seasonStats?.[0];
    return {
      id: p.id,
      name: p.name,
      nameCn: p.nameCn ?? null,
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
  }
}
