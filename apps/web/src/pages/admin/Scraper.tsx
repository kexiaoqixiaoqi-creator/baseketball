import { useEffect, useState } from 'react';
import { adminClient } from '../../api/admin-client';

interface CronJobStatus {
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

function formatNextRun(ms: number | null): string {
  if (ms == null || ms < 0) return '-';
  if (ms < 60_000) return `${Math.round(ms / 1000)} 秒`;
  if (ms < 3600_000) return `${Math.round(ms / 60000)} 分钟`;
  return `${(ms / 3600000).toFixed(1)} 小时`;
}

function CronJobCard({ job, fetchedAt, now }: { job: CronJobStatus; fetchedAt: number; now: number }) {
  const elapsed = fetchedAt ? now - fetchedAt : 0;
  const nextIn = job.nextRunInMs != null && fetchedAt ? Math.max(0, job.nextRunInMs - elapsed) : job.nextRunInMs;
  const statusColor = job.lastStatus === 'success' ? '#27ae60' : job.lastStatus === 'error' ? '#e94560' : job.lastStatus === 'running' ? '#f39c12' : '#4a6380';
  return (
    <div style={{ background: '#131f2e', borderRadius: 10, padding: 16, borderLeft: `3px solid ${statusColor}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{job.name}</div>
          <div style={{ color: '#4a6380', fontSize: 12, marginTop: 4 }}>{job.description}</div>
          <div style={{ color: '#6b7a8a', fontSize: 11, marginTop: 6, fontFamily: 'monospace' }}>{job.cron} ({job.timezone})</div>
          {job.lastRunAt && (
            <div style={{ color: '#8899aa', fontSize: 12, marginTop: 6 }}>
              上次执行: {new Date(job.lastRunAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })} —{' '}
              <span style={{ color: statusColor }}>
                {job.lastStatus === 'success' ? '成功' : job.lastStatus === 'error' ? '失败' : '执行中'}
              </span>
            </div>
          )}
          {job.lastError && <div style={{ color: '#e94560', fontSize: 11, marginTop: 4 }}>{job.lastError}</div>}
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ color: '#3498db', fontSize: 13, fontWeight: 600 }}>下次触发</div>
          <div style={{ color: '#fff', fontSize: 15, marginTop: 2 }}>{formatNextRun(nextIn)}</div>
          {job.nextRunAt && <div style={{ color: '#4a6380', fontSize: 11, marginTop: 4 }}>{new Date(job.nextRunAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</div>}
        </div>
      </div>
    </div>
  );
}

interface SyncCardProps {
  label: string;
  desc: string;
  action: () => Promise<unknown>;
  children?: React.ReactNode;
}

function SyncCard({ label, desc, action, children }: SyncCardProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await action();
      setResult(typeof res === 'object' ? JSON.stringify(res, null, 2) : String(res));
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } }; message?: string };
      setError(ax.response?.data?.message ?? ax.message ?? '请求失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#131f2e', borderRadius: 10, padding: 16, borderLeft: '3px solid #3498db' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{label}</div>
          <div style={{ color: '#4a6380', fontSize: 12, marginTop: 4 }}>{desc}</div>
          {children && <div style={{ marginTop: 10 }}>{children}</div>}
          {result && <pre style={{ background: '#0f1923', color: '#27ae60', padding: 10, borderRadius: 6, fontSize: 11, marginTop: 10, overflow: 'auto', maxHeight: 140 }}>{result}</pre>}
          {error && <div style={{ color: '#e94560', fontSize: 12, marginTop: 8 }}>{error}</div>}
        </div>
        <button onClick={run} disabled={loading}
          style={{ background: loading ? '#2d3f55' : '#3498db', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: 6, fontWeight: 600, cursor: loading ? 'default' : 'pointer', fontSize: 13, flexShrink: 0 }}>
          {loading ? '执行中…' : '执行'}
        </button>
      </div>
    </div>
  );
}

export function Scraper() {
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().slice(0, 10));
  const [aggregateDate, setAggregateDate] = useState(new Date().toISOString().slice(0, 10));
  const [finishDate, setFinishDate] = useState(new Date().toISOString().slice(0, 10));
  const [cronJobs, setCronJobs] = useState<CronJobStatus[]>([]);
  const [cronTick, setCronTick] = useState(Date.now());
  const [cronFetchedAt, setCronFetchedAt] = useState(0);

  useEffect(() => {
    const fetchCronStatus = () => {
      adminClient.get<CronJobStatus[]>('scraper/cron-status').then((r) => {
        setCronJobs(r.data ?? []);
        setCronFetchedAt(Date.now());
      });
    };
    fetchCronStatus();
    const id = setInterval(fetchCronStatus, 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setCronTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 700 }}>数据同步</h1>
        <p style={{ color: '#4a6380', fontSize: 13, marginTop: 4 }}>手动触发新浪体育数据同步</p>
      </div>

      <div style={{ marginBottom: 32 }}>
        <h2 style={{ color: '#fff', fontSize: 16, fontWeight: 600, marginBottom: 12 }}>⏱ 定时任务监控</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {cronJobs.length ? cronJobs.map((j) => <CronJobCard key={j.name} job={j} fetchedAt={cronFetchedAt} now={cronTick} />) : <div style={{ color: '#4a6380' }}>加载中…</div>}
        </div>
      </div>

      <h2 style={{ color: '#fff', fontSize: 16, fontWeight: 600, marginBottom: 12 }}>🔄 手动同步</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 600 }}>
        <SyncCard
          label="同步名单"
          desc="同步 30 支球队及球员名单"
          action={() => adminClient.post('scraper/sync/rosters')}
        />
        <SyncCard
          label="同步赛季数据"
          desc="同步球员赛季均值，重算薪资"
          action={() => adminClient.post('scraper/sync/season-stats')}
        />
        <SyncCard
          label="同步赛程"
          desc="同步指定日期起 1 天赛程"
          action={() => adminClient.post(`scraper/sync/schedule?date=${scheduleDate}&span=1`)}
        >
          <input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #2d3f55', background: '#0f1923', color: '#e0e0e0', fontSize: 13 }} />
        </SyncCard>
        <SyncCard
          label="同步进行中赛日"
          desc="若存在 status=playing 的赛日，则更新其球员数据（定时任务每 5 分钟执行）"
          action={() => adminClient.post('scraper/sync/active')}
        />
        <SyncCard
          label="赛日结算"
          desc="将指定日期的 playing 赛日完成结算：标记比赛、计算 lineup 分数（定时任务每天 15:30 执行）"
          action={() => adminClient.post(`scraper/finish-game-days?date=${finishDate}`)}
        >
          <input type="date" value={finishDate} onChange={(e) => setFinishDate(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #2d3f55', background: '#0f1923', color: '#e0e0e0', fontSize: 13 }} />
        </SyncCard>
        <SyncCard
          label="聚合赛日数据"
          desc="聚合：同步某日赛程、比赛数据、赛季数据，返回 game_day 和 games"
          action={() => adminClient.post(`scraper/aggregate/game-day?date=${aggregateDate}`)}
        >
          <input type="date" value={aggregateDate} onChange={(e) => setAggregateDate(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #2d3f55', background: '#0f1923', color: '#e0e0e0', fontSize: 13 }} />
        </SyncCard>
      </div>
    </div>
  );
}
