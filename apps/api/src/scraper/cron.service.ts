import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CronExpressionParser } from 'cron-parser';
import { ScraperService } from './scraper.service';
import { GameDaysService } from '../game-days/game-days.service';

/** 6-field: second minute hour day month weekday (cron-parser format) */
const CRON_JOBS = [
  { name: 'activate-game-days', cron: '0 0 0 * * *', tz: 'Asia/Shanghai', desc: '当日 prepare 赛日 → playing' },
  { name: 'finish-game-days', cron: '0 30 15 * * *', tz: 'Asia/Shanghai', desc: '当日 playing 赛日 → finish 结算' },
  { name: 'sync-season-stats', cron: '0 45 15 * * *', tz: 'Asia/Shanghai', desc: '赛季场均、薪资重算' },
  { name: 'create-game-day', cron: '0 0 16 * * *', tz: 'Asia/Shanghai', desc: '自动创建下一日赛日' },
  { name: 'sync-active-game-days', cron: '0 */5 * * * *', tz: 'Asia/Shanghai', desc: '同步激活赛日球员数据（每 5 分钟）' },
] as const;

export interface CronJobStatus {
  name: string;
  cron: string;
  timezone: string;
  description: string;
  lastRunAt: string | null;
  lastStatus: 'success' | 'error' | 'running' | null;
  lastError: string | null;
  nextRunAt: string | null;
  nextRunInMs: number | null;
}

/**
 * 定时任务
 * - activate-game-days: 每天 00:00 将当日 prepare 赛日激活为 playing
 * - finish-game-days: 每天 15:30 将当日 playing 赛日结算为 finish
 * - sync-season-stats: 每天 15:45 同步球员赛季场均数据，重算薪资
 * - create-game-day: 每天 16:00 自动创建下一日赛日
 * - sync-active-game-days: 每 5 分钟检查并更新激活比赛日的球员数据
 */
@Injectable()
export class CronService implements OnModuleInit {
  private readonly logger = new Logger(CronService.name);
  private readonly execState = new Map<string, { lastRunAt: Date; lastStatus: 'success' | 'error' | 'running'; lastError?: string }>();

  onModuleInit() {
    this.logger.log('[CRON] 定时任务已注册: activate-game-days(00:00), finish-game-days(15:30), sync-season-stats(15:45), create-game-day(16:00), sync-active-game-days(*/5min)');
    this.logger.log('[CRON] 调试提示: 修改系统时间后需重启 API 进程才会触发，因 node-cron 用 setInterval 按真实流逝时间轮询');
  }

  constructor(
    private readonly scraperService: ScraperService,
    private readonly gameDaysService: GameDaysService,
  ) {}

  getCronStatus(): CronJobStatus[] {
    const now = new Date();
    return CRON_JOBS.map((job) => {
      const state = this.execState.get(job.name);
      let nextRunAt: string | null = null;
      let nextRunInMs: number | null = null;
      try {
        const interval = CronExpressionParser.parse(job.cron, { currentDate: now, tz: job.tz });
        const next = interval.next().toDate();
        nextRunAt = next.toISOString();
        nextRunInMs = next.getTime() - now.getTime();
      } catch {
        // ignore parse errors
      }
      return {
        name: job.name,
        cron: job.cron,
        timezone: job.tz,
        description: job.desc,
        lastRunAt: state ? state.lastRunAt.toISOString() : null,
        lastStatus: state?.lastStatus ?? null,
        lastError: state?.lastError ?? null,
        nextRunAt,
        nextRunInMs,
      };
    });
  }

  private recordStart(name: string) {
    this.execState.set(name, { lastRunAt: new Date(), lastStatus: 'running' });
  }
  private recordSuccess(name: string) {
    const s = this.execState.get(name);
    if (s) this.execState.set(name, { ...s, lastStatus: 'success' });
  }
  private recordError(name: string, err: Error) {
    const s = this.execState.get(name);
    if (s) this.execState.set(name, { ...s, lastStatus: 'error', lastError: err.message });
  }

  @Cron('0 0 * * *', { name: 'activate-game-days', timeZone: 'Asia/Shanghai' })
  async handleActivateGameDays(): Promise<void> {
    this.recordStart('activate-game-days');
    try {
      const dateStr = new Date().toLocaleDateString('en-CA', {
        timeZone: 'Asia/Shanghai',
      });
      this.logger.log(`[CRON] activate-game-days 开始: dateStr=${dateStr}, serverNow=${new Date().toISOString()}`);
      const result = await this.gameDaysService.activateGameDaysForDate(dateStr);
      this.logger.log(`[CRON] activate-game-days 结束: dateStr=${dateStr}, updated=${result.updated}`);
      if (result.updated > 0) {
        this.logger.log(`[CRON] 赛日激活完成: ${dateStr}, 更新 ${result.updated} 个`);
      }
      this.recordSuccess('activate-game-days');
    } catch (err) {
      this.recordError('activate-game-days', err as Error);
      this.logger.error('[CRON] 赛日激活失败', (err as Error).stack);
    }
  }

  @Cron('30 15 * * *', { name: 'finish-game-days', timeZone: 'Asia/Shanghai' })
  async handleFinishGameDays(): Promise<void> {
    this.recordStart('finish-game-days');
    try {
      const dateStr = new Date().toLocaleDateString('en-CA', {
        timeZone: 'Asia/Shanghai',
      });
      this.logger.log(`[CRON] finish-game-days 开始: dateStr=${dateStr}, serverNow=${new Date().toISOString()}`);
      const result = await this.gameDaysService.finishGameDaysForDate(dateStr);
      this.logger.log(`[CRON] finish-game-days 结束: dateStr=${dateStr}, updated=${result.updated}`);
      if (result.updated > 0) {
        this.logger.log(`[CRON] 赛日结算完成: ${dateStr}, 更新 ${result.updated} 个`);
      }
      this.recordSuccess('finish-game-days');
    } catch (err) {
      this.recordError('finish-game-days', err as Error);
      this.logger.error('[CRON] 赛日结算失败', (err as Error).stack);
    }
  }

  @Cron('45 15 * * *', { name: 'sync-season-stats', timeZone: 'Asia/Shanghai' })
  async handleSyncSeasonStats(): Promise<void> {
    this.recordStart('sync-season-stats');
    try {
      this.logger.log(`[CRON] sync-season-stats 开始: serverNow=${new Date().toISOString()}`);
      await this.scraperService.syncSeasonStats();
      this.logger.log('[CRON] sync-season-stats 结束: 赛季场均数据同步完成');
      this.recordSuccess('sync-season-stats');
    } catch (err) {
      this.recordError('sync-season-stats', err as Error);
      this.logger.error('[CRON] 赛季场均数据同步失败', (err as Error).stack);
    }
  }

  @Cron('0 16 * * *', { name: 'create-game-day', timeZone: 'Asia/Shanghai' })
  async handleCreateGameDay(): Promise<void> {
    this.recordStart('create-game-day');
    try {
      const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' });
      const tomorrow = new Date(todayStr);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().slice(0, 10);
      this.logger.log(`[CRON] create-game-day 开始: 创建下一日 dateStr=${dateStr}, serverNow=${new Date().toISOString()}`);
      await this.gameDaysService.create({ date: dateStr });
      this.logger.log(`[CRON] create-game-day 结束: 赛日创建完成 ${dateStr}（下一日）`);
      this.recordSuccess('create-game-day');
    } catch (err) {
      this.recordError('create-game-day', err as Error);
      this.logger.error('[CRON] 赛日创建失败', (err as Error).stack);
    }
  }

  @Cron('*/5 * * * *', { name: 'sync-active-game-days', timeZone: 'Asia/Shanghai' })
  async handleSyncActiveGameDays(): Promise<void> {
    this.recordStart('sync-active-game-days');
    try {
      this.logger.log(`[CRON] sync-active-game-days 开始: serverNow=${new Date().toISOString()}`);
      const result = await this.scraperService.syncActiveGameDays();
      this.logger.log(`[CRON] sync-active-game-days 结束: gameDays=${result.gameDays}, gamesSynced=${result.gamesSynced}`);
      if (result.gameDays > 0 && result.gamesSynced > 0) {
        this.logger.log(
          `[CRON] 更新比赛日数据: ${result.gameDays} 个激活比赛日, ${result.gamesSynced} 场比赛`,
        );
      }
      this.recordSuccess('sync-active-game-days');
    } catch (err) {
      this.recordError('sync-active-game-days', err as Error);
      this.logger.error('[CRON] 更新比赛日数据失败', (err as Error).stack);
    }
  }
}
