import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Game, GamePlayerStats } from '@fantasy-nba/db';
import { SinaClientService } from '../sina/sina.client.service';
import { MappingService } from '../mapping/mapping.service';
import { computeFantasyScore, SCORE_WEIGHTS_DEFAULT } from '@fantasy-nba/shared';
import { parseMinutes } from '../common/position.util';
import { SinaGamePlayer } from '../sina/sina.types';

const SOURCE = 'sina';

@Injectable()
export class GameStatsSyncService {
  private readonly logger = new Logger(GameStatsSyncService.name);

  constructor(
    private readonly sina: SinaClientService,
    private readonly mapping: MappingService,
    @InjectRepository(Game) private readonly gameRepo: Repository<Game>,
    @InjectRepository(GamePlayerStats)
    private readonly statsRepo: Repository<GamePlayerStats>,
  ) {}

  async syncActiveGames(): Promise<{ synced: number }> {
    const activeGames = await this.gameRepo.find({
      where: { status: 'in_progress' },
      relations: ['gameDay'],
    });

    const scheduledGames = await this.gameRepo.find({
      where: { status: 'scheduled' },
      relations: ['gameDay'],
    });

    const candidates = [...activeGames, ...scheduledGames].filter(
      (g) => g.gameDay?.status === 'active',
    );

    let synced = 0;
    for (const game of candidates) {
      try {
        await this.syncOneGame(game);
        synced++;
      } catch (err) {
        this.logger.warn(`Failed to sync game id=${game.id}: ${(err as Error).message}`);
      }
    }

    return { synced };
  }

  async syncByInternalId(gameId: number): Promise<void> {
    const game = await this.gameRepo.findOneOrFail({ where: { id: gameId } });
    await this.syncOneGame(game);
  }

  async syncByMid(mid: string): Promise<void> {
    const internalId = await this.mapping.getInternalId(SOURCE, 'game', mid);
    if (internalId === null) throw new Error(`No mapping for mid=${mid}`);
    await this.syncByInternalId(internalId);
  }

  private async syncOneGame(game: Game): Promise<void> {
    const mid = await this.mapping.getExtId(SOURCE, 'game', game.id);
    if (!mid) {
      this.logger.warn(`No ext_id_map entry for game id=${game.id} source=${SOURCE}`);
      return;
    }

    const data = await this.sina.getGamePlayerStats(mid);

    const allPlayers: SinaGamePlayer[] = [
      ...(data.home?.players ?? []),
      ...(data.away?.players ?? []),
    ];

    for (const sp of allPlayers) {
      if (!sp.played) continue;

      const internalPlayerId = await this.mapping.getInternalId(SOURCE, 'player', sp.pid);
      if (internalPlayerId === null) {
        this.logger.debug(`Unknown player pid=${sp.pid} — not yet in roster mapping`);
        continue;
      }

      const min = parseMinutes(sp.minutes);
      const fantasyScore = computeFantasyScore(
        {
          pts: sp.points,
          reb: sp.rebounds,
          ast: sp.assists,
          stl: sp.steals,
          blk: sp.blocks,
          to: sp.turnovers,
        },
        SCORE_WEIGHTS_DEFAULT,
      );

      const existing = await this.statsRepo.findOne({
        where: { gameId: game.id, playerId: internalPlayerId },
      });

      const statsPayload = {
        gameId: game.id,
        playerId: internalPlayerId,
        pts: sp.points,
        reb: sp.rebounds,
        ast: sp.assists,
        stl: sp.steals,
        blk: sp.blocks,
        toVal: sp.turnovers,
        min,
        fantasyScore,
      };

      if (existing) {
        await this.statsRepo.update(existing.id, statsPayload);
      } else {
        await this.statsRepo.save(this.statsRepo.create(statsPayload));
      }
    }

    const anyOnCourt = allPlayers.some((p) => p.on_court);
    const hasStats = allPlayers.some((p) => p.played && (p.points > 0 || p.minutes !== '0:00'));

    if (!anyOnCourt && hasStats && game.status === 'in_progress') {
      await this.gameRepo.update(game.id, { status: 'completed' });
      this.logger.log(`Game id=${game.id} marked completed`);
    } else if (game.status === 'scheduled' && hasStats) {
      await this.gameRepo.update(game.id, { status: 'in_progress' });
    }
  }
}
