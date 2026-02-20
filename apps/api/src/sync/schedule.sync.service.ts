import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Game } from '@fantasy-nba/db';
import { SinaClientService } from '../sina/sina.client.service';
import { MappingService } from '../mapping/mapping.service';

const SOURCE = 'sina';

async function resolveTeamIds(
  mapping: { getInternalId: (src: string, type: string, extId: string) => Promise<number | null> },
  homeTid: string,
  awayTid: string,
): Promise<{ homeTeamId: number | null; awayTeamId: number | null }> {
  const [homeTeamId, awayTeamId] = await Promise.all([
    mapping.getInternalId(SOURCE, 'team', homeTid),
    mapping.getInternalId(SOURCE, 'team', awayTid),
  ]);
  return { homeTeamId, awayTeamId };
}

function mapGameStatus(statusEn: string): 'prepare' | 'playing' | 'finish' {
  switch (statusEn?.toLowerCase()) {
    case 'inprogress':
    case 'in_progress':
      return 'playing';
    case 'complete':
    case 'completed':
      return 'finish';
    default:
      return 'prepare';
  }
}

@Injectable()
export class ScheduleSyncService {
  private readonly logger = new Logger(ScheduleSyncService.name);

  constructor(
    private readonly sina: SinaClientService,
    private readonly mapping: MappingService,
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
      for (const match of dayMatches) {
        const mid = match.mid;
        const homeTeam = tidToEnglishName.get(match.home_tid) ?? match.home_name;
        const awayTeam = tidToEnglishName.get(match.away_tid) ?? match.away_name;
        const status = mapGameStatus(match.status_en);
        const { homeTeamId, awayTeamId } = await resolveTeamIds(
          this.mapping,
          match.home_tid,
          match.away_tid,
        );

        let internalGameId = await this.mapping.getInternalId(SOURCE, 'game', mid);

        if (internalGameId === null) {
          const game = await this.gameRepo.save(
            this.gameRepo.create({
              date: matchDate,
              homeTeam,
              awayTeam,
              homeTeamId,
              awayTeamId,
              status,
            }),
          );
          internalGameId = game.id;
          await this.mapping.upsert(SOURCE, 'game', mid, internalGameId);
          this.logger.debug(`Created game ${homeTeam} vs ${awayTeam} id=${internalGameId}`);
        } else {
          await this.gameRepo.update(internalGameId, {
            date: matchDate,
            homeTeam,
            awayTeam,
            homeTeamId,
            awayTeamId,
            status,
          });
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
