import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import {
  SinaApiEnvelope,
  SinaAllTeamsData,
  SinaTeamRosterData,
  SinaTeamSeasonStatsData,
  SinaScheduleData,
  SinaGamePlayerData,
} from './sina.types';

/**
 * Thin HTTP client for Sina Sports radar API.
 *
 * Keeping all raw HTTP calls isolated here means swapping the data source
 * only requires implementing a new client — not touching any sync logic.
 */
@Injectable()
export class SinaClientService {
  private readonly logger = new Logger(SinaClientService.name);
  private readonly http: AxiosInstance;
  readonly season: number;

  constructor(private readonly config: ConfigService) {
    const baseURL = config.get<string>(
      'SINA_BASE_URL',
      'https://slamdunk.sports.sina.com.cn/api',
    );
    this.season = config.get<number>('NBA_SEASON', 2025);

    this.http = axios.create({
      baseURL,
      timeout: 10_000,
      params: { p: 'radar' }, // every Sina radar endpoint shares p=radar
    });
  }

  // ── All teams + brief player list ─────────────────────────────────────────

  async getAllTeams(): Promise<SinaAllTeamsData> {
    const res = await this.get<SinaAllTeamsData>({ s: 'team', a: 'rosters' });
    return res;
  }

  // ── Detailed roster for one team ─────────────────────────────────────────

  async getTeamRoster(tid: string): Promise<SinaTeamRosterData> {
    return this.get<SinaTeamRosterData>({
      s: 'team',
      a: 'roster',
      tid,
      season: String(this.season - 1), // Sina uses previous-year as season key (2025 season → '2024')
    });
  }

  // ── Season-average stats per player ──────────────────────────────────────

  async getTeamSeasonStats(tid: string): Promise<SinaTeamSeasonStatsData> {
    return this.get<SinaTeamSeasonStatsData>({
      s: 'stats',
      a: 'players',
      tid,
      season_type: 'reg',
      split: 'average',
    });
  }

  // ── Game schedule for a date window ─────────────────────────────────────

  async getSchedule(date: string, span = 1): Promise<SinaScheduleData> {
    return this.get<SinaScheduleData>({
      s: 'schedule',
      a: 'date_span',
      date,
      span,
    });
  }

  // ── Live per-player box score for one game ────────────────────────────────

  async getGamePlayerStats(mid: string): Promise<SinaGamePlayerData> {
    return this.get<SinaGamePlayerData>({
      s: 'summary',
      a: 'game_player',
      mid,
    });
  }

  // ── Internal helper ──────────────────────────────────────────────────────

  private async get<T>(params: Record<string, unknown>): Promise<T> {
    const ts = Date.now();
    try {
      const response = await this.http.get<SinaApiEnvelope<T>>('', {
        params: { ...params, _: ts },
      });
      const envelope = response.data;
      if (envelope.result.status.code !== 0) {
        throw new Error(`Sina API error: ${envelope.result.status.msg}`);
      }
      return envelope.result.data;
    } catch (err) {
      this.logger.error(`Sina API call failed (${JSON.stringify(params)}): ${(err as Error).message}`);
      throw err;
    }
  }
}
