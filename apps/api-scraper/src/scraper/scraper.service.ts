import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameDay, Game, GamePlayerStats, Player } from '@fantasy-nba/db';
import { computeFantasyScore, SCORE_WEIGHTS_DEFAULT } from '@fantasy-nba/shared';

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);

  constructor(
    @InjectRepository(GameDay) private gameDayRepo: Repository<GameDay>,
    @InjectRepository(Game) private gameRepo: Repository<Game>,
    @InjectRepository(GamePlayerStats) private statsRepo: Repository<GamePlayerStats>,
    @InjectRepository(Player) private playerRepo: Repository<Player>,
  ) {}

  async syncActiveGameDay(): Promise<void> {
    const activeDay = await this.gameDayRepo.findOne({
      where: { status: 'active' },
      relations: ['games'],
    });
    if (!activeDay) {
      this.logger.log('No active game day found, skipping sync');
      return;
    }
    await this.syncGameDayById(activeDay.id);
  }

  async syncGameDayById(gameDayId: number): Promise<{ synced: number }> {
    const gameDay = await this.gameDayRepo.findOne({
      where: { id: gameDayId },
      relations: ['games'],
    });
    if (!gameDay) throw new NotFoundException(`Game day ${gameDayId} not found`);

    let synced = 0;
    for (const game of gameDay.games) {
      if (game.status === 'completed') continue;
      await this.syncGame(game);
      // Mark game as in_progress after first sync
      if (game.status === 'scheduled') {
        await this.gameRepo.update(game.id, { status: 'in_progress' });
      }
      synced++;
    }

    this.logger.log(`Synced ${synced} games for game day ${gameDayId}`);
    return { synced };
  }

  private async syncGame(game: Game): Promise<void> {
    // Load players who should have stats in this game (from existing game_player_stats rows
    // created during seeding, or generate for all active players on both teams)
    const existingStats = await this.statsRepo.find({ where: { gameId: game.id } });

    if (existingStats.length === 0) {
      // Generate mock box scores for all active players on these teams
      await this.generateMockBoxScore(game);
    } else {
      // Simulate live update: randomly adjust stats for in-progress games
      for (const stat of existingStats) {
        const delta = this.generateRandomStatDelta();
        await this.statsRepo.update(stat.id, {
          pts: Math.max(0, stat.pts + delta.pts),
          reb: Math.max(0, stat.reb + delta.reb),
          ast: Math.max(0, stat.ast + delta.ast),
          stl: Math.max(0, stat.stl + delta.stl),
          blk: Math.max(0, stat.blk + delta.blk),
          toVal: Math.max(0, stat.toVal + delta.to),
          fantasyScore: computeFantasyScore(
            {
              pts: Math.max(0, stat.pts + delta.pts),
              reb: Math.max(0, stat.reb + delta.reb),
              ast: Math.max(0, stat.ast + delta.ast),
              stl: Math.max(0, stat.stl + delta.stl),
              blk: Math.max(0, stat.blk + delta.blk),
              to: Math.max(0, stat.toVal + delta.to),
            },
            SCORE_WEIGHTS_DEFAULT,
          ),
        });
      }
    }
  }

  private async generateMockBoxScore(game: Game): Promise<void> {
    const players = await this.playerRepo.find({
      where: [{ team: game.homeTeam, isActive: true }, { team: game.awayTeam, isActive: true }],
    });

    for (const player of players) {
      const stats = this.generatePlayerStats(player.position);
      const fantasyScore = computeFantasyScore(
        { pts: stats.pts, reb: stats.reb, ast: stats.ast, stl: stats.stl, blk: stats.blk, to: stats.to },
        SCORE_WEIGHTS_DEFAULT,
      );

      const existing = await this.statsRepo.findOne({
        where: { gameId: game.id, playerId: player.id },
      });

      if (existing) {
        await this.statsRepo.update(existing.id, {
          pts: stats.pts, reb: stats.reb, ast: stats.ast,
          stl: stats.stl, blk: stats.blk, toVal: stats.to,
          min: stats.min, fantasyScore,
        });
      } else {
        await this.statsRepo.save(
          this.statsRepo.create({
            gameId: game.id, playerId: player.id,
            pts: stats.pts, reb: stats.reb, ast: stats.ast,
            stl: stats.stl, blk: stats.blk, toVal: stats.to,
            min: stats.min, fantasyScore,
          }),
        );
      }
    }
  }

  private generatePlayerStats(position: string) {
    const base: Record<string, { pts: number[]; reb: number[]; ast: number[]; stl: number[]; blk: number[]; min: number[] }> = {
      PG: { pts: [8, 32], reb: [2, 7], ast: [4, 12], stl: [0, 3], blk: [0, 1], min: [20, 38] },
      SG: { pts: [8, 30], reb: [2, 7], ast: [2, 8], stl: [0, 3], blk: [0, 1], min: [20, 38] },
      SF: { pts: [8, 28], reb: [3, 9], ast: [1, 6], stl: [0, 3], blk: [0, 2], min: [20, 38] },
      PF: { pts: [6, 24], reb: [4, 12], ast: [1, 4], stl: [0, 2], blk: [0, 3], min: [18, 36] },
      C:  { pts: [6, 22], reb: [5, 14], ast: [0, 4], stl: [0, 2], blk: [0, 4], min: [18, 36] },
    };
    const b = base[position] ?? base['SF'];
    const rand = (min: number, max: number) =>
      Math.floor(Math.random() * (max - min + 1)) + min;
    return {
      pts: rand(b.pts[0], b.pts[1]),
      reb: rand(b.reb[0], b.reb[1]),
      ast: rand(b.ast[0], b.ast[1]),
      stl: rand(b.stl[0], b.stl[1]),
      blk: rand(b.blk[0], b.blk[1]),
      to: rand(0, 5),
      min: rand(b.min[0], b.min[1]),
    };
  }

  private generateRandomStatDelta() {
    const rand = (max: number) => Math.floor(Math.random() * max);
    const sign = () => (Math.random() > 0.5 ? 1 : -1);
    return {
      pts: sign() * rand(3),
      reb: sign() * rand(2),
      ast: sign() * rand(2),
      stl: sign() * rand(1),
      blk: sign() * rand(1),
      to: rand(1),
    };
  }
}
