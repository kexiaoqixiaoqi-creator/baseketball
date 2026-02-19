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
      params: { p: 'radar' },
    });
  }

  async getAllTeams(): Promise<SinaAllTeamsData> {
    return this.get<SinaAllTeamsData>({ s: 'team', a: 'rosters' });
  }

  async getTeamRoster(tid: string): Promise<SinaTeamRosterData> {
    return this.get<SinaTeamRosterData>({
      s: 'team',
      a: 'roster',
      tid,
      season: String(this.season - 1),
    });
  }

  async getTeamSeasonStats(tid: string): Promise<SinaTeamSeasonStatsData> {
    return this.get<SinaTeamSeasonStatsData>({
      s: 'stats',
      a: 'players',
      tid,
      season_type: 'reg',
      split: 'average',
    });
  }

  async getSchedule(date: string, span = 1): Promise<SinaScheduleData> {
    return this.get<SinaScheduleData>({
      s: 'schedule',
      a: 'date_span',
      date,
      span,
    });
  }

  async getGamePlayerStats(mid: string): Promise<SinaGamePlayerData> {
    return this.get<SinaGamePlayerData>({
      s: 'summary',
      a: 'game_player',
      mid,
    });
  }

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
