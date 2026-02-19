import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameDay, Game } from '@fantasy-nba/db';
import { SinaClientService } from '../sina/sina.client.service';
import { MappingService } from '../mapping/mapping.service';

const SOURCE = 'sina';

function mapGameStatus(statusEn: string): 'scheduled' | 'in_progress' | 'completed' {
  switch (statusEn?.toLowerCase()) {
    case 'inprogress':
    case 'in_progress':
      return 'in_progress';
    case 'complete':
    case 'completed':
      return 'completed';
    default:
      return 'scheduled';
  }
}

@Injectable()
export class ScheduleSyncService {
  private readonly logger = new Logger(ScheduleSyncService.name);

  constructor(
    private readonly sina: SinaClientService,
    private readonly mapping: MappingService,
    @InjectRepository(GameDay) private readonly gameDayRepo: Repository<GameDay>,
    @InjectRepository(Game) private readonly gameRepo: Repository<Game>,
  ) {}

  async syncSchedule(date: string, span = 1): Promise<{ games: number }> {
    this.logger.log(`Syncing schedule date=${date} span=${span}…`);

    const allTeamsData = await this.sina.getAllTeams();
    const tidToEnglishName = new Map<string, string>(
      allTeamsData.teams.map((t) => [t.team.tid, t.team.name]),
    );

    const data = await this.sina.getSchedule(date, span);
    const matches = data.matchs ?? [];

    const byDate = new Map<string, typeof matches>();
    for (const m of matches) {
      const arr = byDate.get(m.date) ?? [];
      arr.push(m);
      byDate.set(m.date, arr);
    }

    let totalGames = 0;

    for (const [matchDate, dayMatches] of byDate.entries()) {
      let gameDay = await this.gameDayRepo.findOne({ where: { date: matchDate } });
      if (!gameDay) {
        gameDay = await this.gameDayRepo.save(
          this.gameDayRepo.create({
            date: matchDate,
            status: 'pending',
            salaryCap: 50_000,
          }),
        );
        this.logger.debug(`Created game_day for ${matchDate} (id=${gameDay.id})`);
      }

      for (const match of dayMatches) {
        const mid = match.mid;
        const homeTeam = tidToEnglishName.get(match.home_tid) ?? match.home_name;
        const awayTeam = tidToEnglishName.get(match.away_tid) ?? match.away_name;
        const status = mapGameStatus(match.status_en);

        let internalGameId = await this.mapping.getInternalId(SOURCE, 'game', mid);

        if (internalGameId === null) {
          const game = await this.gameRepo.save(
            this.gameRepo.create({
              gameDayId: gameDay.id,
              homeTeam,
              awayTeam,
              status,
            }),
          );
          internalGameId = game.id;
          await this.mapping.upsert(SOURCE, 'game', mid, internalGameId);
          this.logger.debug(`Created game ${homeTeam} vs ${awayTeam} id=${internalGameId}`);
        } else {
          await this.gameRepo.update(internalGameId, { homeTeam, awayTeam, status });
        }

        totalGames++;
      }
    }

    this.logger.log(`Schedule sync complete: ${totalGames} games in ${byDate.size} game days`);
    return { games: totalGames };
  }

  async syncToday(): Promise<{ games: number }> {
    const today = new Date().toISOString().slice(0, 10);
    return this.syncSchedule(today, 1);
  }
}
