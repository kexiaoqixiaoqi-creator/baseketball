import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Player, PlayerSeasonStats } from '@fantasy-nba/db';
import { computePlayerCosts, CURRENT_SEASON } from '@fantasy-nba/shared';
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
      .leftJoinAndSelect('p.seasonStats', 'ss')
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

    return qb.getMany();
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

  async recalculateCosts() {
    const allStats = await this.statsRepo.find({
      where: { season: CURRENT_SEASON },
      relations: ['player'],
    });

    const input = allStats.map((s) => ({
      id: s.playerId,
      stats: {
        pts: Number(s.ppg),
        reb: Number(s.rpg),
        ast: Number(s.apg),
        stl: Number(s.spg),
        blk: Number(s.bpg),
        to: Number(s.topg),
      },
    }));

    const costMap = computePlayerCosts(input);

    for (const [playerId, cost] of costMap.entries()) {
      await this.statsRepo.update({ playerId, season: CURRENT_SEASON }, { cost });
    }

    return { message: `Recalculated costs for ${costMap.size} players` };
  }
}
