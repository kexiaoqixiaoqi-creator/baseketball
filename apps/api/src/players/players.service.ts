import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Player, PlayerSeasonStats } from '@fantasy-nba/db';
import { computeCostFromSeasonStatsRaw, computeFantasyScoreFromSeasonStats, SCORE_WEIGHTS_DEFAULT, CURRENT_SEASON } from '@fantasy-nba/shared';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';

export interface PlayerFilter {
  search?: string;
  position?: string;
  team?: string;
}

@Injectable()
export class PlayersService {
  constructor(
    @InjectRepository(Player) private playerRepo: Repository<Player>,
    @InjectRepository(PlayerSeasonStats) private statsRepo: Repository<PlayerSeasonStats>,
  ) {}

  async findAll(filter: PlayerFilter = {}) {
    const qb = this.playerRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect(
        'p.seasonStats',
        'ss',
        'ss.season = :season',
        { season: CURRENT_SEASON },
      )
      .orderBy('p.name', 'ASC');

    if (filter.search) {
      qb.andWhere('(p.name LIKE :s OR p.name_cn LIKE :s)', { s: `%${filter.search}%` });
    }
    if (filter.position) {
      qb.andWhere('p.position = :position', { position: filter.position });
    }
    if (filter.team) {
      qb.andWhere('p.team LIKE :team', { team: `%${filter.team}%` });
    }

    const players = await qb.getMany();
    return players.map((p) => this.mapPlayerForUser(p));
  }

  async findOne(id: number) {
    const player = await this.playerRepo.findOne({ where: { id }, relations: ['seasonStats'] });
    if (!player) throw new NotFoundException('Player not found');
    return player;
  }

  async create(dto: CreatePlayerDto) {
    const player = this.playerRepo.create({ ...dto, isActive: dto.isActive ?? true });
    return this.playerRepo.save(player);
  }

  async update(id: number, dto: UpdatePlayerDto) {
    await this.playerRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.playerRepo.update(id, { isActive: false });
    return { message: 'Player deactivated' };
  }

  async findAllForUser(position?: string, team?: string) {
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

    const players = await qb.getMany();
    const mapped = players.map((p) => this.mapPlayerForUser(p));
    mapped.sort((a, b) => b.cost - a.cost);
    return mapped;
  }

  async findOneForUser(id: number) {
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
    return this.mapPlayerForUser(p);
  }

  private mapPlayerForUser(p: Player) {
    const stats = p.seasonStats?.[0];
    const cost = computeCostFromSeasonStatsRaw(stats, SCORE_WEIGHTS_DEFAULT);
    const fantasyScore = computeFantasyScoreFromSeasonStats(stats, SCORE_WEIGHTS_DEFAULT);
    return {
      id: p.id,
      name: p.name,
      nameCn: p.nameCn ?? null,
      position: p.position,
      team: p.team,
      jerseyNumber: p.jerseyNumber,
      isActive: p.isActive,
      cost,
      seasonStats: stats ? [{ ppg: Number(stats.ppg), rpg: Number(stats.rpg), apg: Number(stats.apg), spg: Number(stats.spg), bpg: Number(stats.bpg), topg: Number(stats.topg), mpg: Number(stats.mpg), fantasyScore, cost }] : [],
    };
  }
}
