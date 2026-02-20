import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminClient } from '../../api/admin-client';

interface GameDay {
  id: number; date: string; status: string; salaryCap: number;
  games: { id: number; homeTeam: string; awayTeam: string; status: string }[];
}

const STATUS_COLOR: Record<string, string> = { prepare: '#f39c12', playing: '#27ae60', finish: '#4a6380' };
const STATUS_LABEL: Record<string, string> = { prepare: '准备中', playing: '进行中', finish: '已结束' };

export function GameDays() {
  const [gameDays, setGameDays] = useState<GameDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newDate, setNewDate] = useState('');

  const load = () => { adminClient.get('/game-days').then((r) => setGameDays(r.data)).finally(() => setLoading(false)); };
  useEffect(load, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try { await adminClient.post('/game-days', { date: newDate }); setNewDate(''); load(); }
    catch { alert('创建赛日失败'); }
    finally { setCreating(false); }
  };

  const handleActivate = async (id: number) => {
    await adminClient.patch(`/game-days/${id}/status`, { status: 'playing' });
    load();
  };

  const [recalcId, setRecalcId] = useState<number | null>(null);
  const handleRecalcCap = async (id: number) => {
    setRecalcId(id);
    try {
      await adminClient.post(`/game-days/${id}/recalculate-salary-cap`);
      load();
    } catch {
      alert('重新计算薪资帽失败');
    } finally {
      setRecalcId(null);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>赛日管理</h1>
        <p style={{ color: '#4a6380', fontSize: 12, marginTop: 2 }}>共 {gameDays.length} 个赛日</p>
      </div>

      <form onSubmit={handleCreate} style={{ background: '#131f2e', borderRadius: 10, padding: '14px 16px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
        <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} required
          style={{ padding: '7px 12px', borderRadius: 6, border: '1px solid #2d3f55', background: '#0f1923', color: '#e0e0e0', fontSize: 13 }} />
        <button type="submit" disabled={creating}
          style={{ background: '#27ae60', color: '#fff', border: 'none', padding: '7px 18px', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
          {creating ? '创建中…' : '+ 添加赛日'}
        </button>
      </form>

      {loading ? <div style={{ color: '#4a6380', padding: 20 }}>加载中…</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {gameDays.map((gd) => (
            <div key={gd.id} style={{ background: '#131f2e', borderRadius: 10, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: `3px solid ${STATUS_COLOR[gd.status] ?? '#2d3f55'}` }}>
              <div>
                <div style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>{gd.date}</div>
                <div style={{ color: '#4a6380', fontSize: 12, marginTop: 2 }}>
                  {gd.games?.length ?? 0} 场比赛 · 薪资帽: ${gd.salaryCap?.toLocaleString()}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ background: (STATUS_COLOR[gd.status] ?? '#888') + '22', color: STATUS_COLOR[gd.status] ?? '#888', border: `1px solid ${(STATUS_COLOR[gd.status] ?? '#888')}44`, padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                  {STATUS_LABEL[gd.status] ?? gd.status}
                </span>
                {gd.status === 'prepare' && (
                  <button onClick={() => handleActivate(gd.id)}
                    style={{ background: '#27ae6022', color: '#27ae60', border: '1px solid #27ae6044', padding: '4px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                    激活
                  </button>
                )}
                <button
                  onClick={() => handleRecalcCap(gd.id)}
                  disabled={recalcId === gd.id}
                  style={{
                    background: '#1e2d3d',
                    color: '#8899aa',
                    border: '1px solid #2d3f55',
                    padding: '4px 10px',
                    borderRadius: 6,
                    cursor: recalcId === gd.id ? 'default' : 'pointer',
                    fontSize: 11,
                    opacity: recalcId === gd.id ? 0.7 : 1,
                  }}
                >
                  {recalcId === gd.id ? '计算中…' : '重算薪资帽'}
                </button>
                <Link to={`/admin/game-days/${gd.id}`}
                  style={{ background: '#1e2d3d', color: '#8899aa', padding: '4px 12px', borderRadius: 6, textDecoration: 'none', fontSize: 12 }}>
                  管理 →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
