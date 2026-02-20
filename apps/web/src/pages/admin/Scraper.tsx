import { useState } from 'react';
import { adminClient } from '../../api/admin-client';

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

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 700 }}>数据同步</h1>
        <p style={{ color: '#4a6380', fontSize: 13, marginTop: 4 }}>手动触发新浪体育数据同步</p>
      </div>

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
