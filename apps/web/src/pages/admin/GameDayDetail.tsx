import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminClient } from '../../api/admin-client';

interface Game { id: number; homeTeam: string; awayTeam: string; status: string }
interface GameDay { id: number; date: string; status: string; salaryCap: number; games: Game[] }
interface PlayerStatRow {
  id: number;
  playerId: number;
  gameId: number;
  playerName: string;
  playerNameCn: string | null;
  position: string;
  team: string;
  avatarUrl?: string | null;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  to: number;
  min: number;
  fantasyScore: number | null;
  game: { id: number; homeTeam: string; awayTeam: string; status: string };
}
interface LineupRow {
  id: number;
  user: { id: number; username: string };
  room: { id: number; name: string };
  totalCost: number;
  totalScore: number | null;
  createdAt: string;
}

const STATUS_COLOR: Record<string, string> = { prepare: '#f39c12', playing: '#27ae60', finish: '#4a6380' };
const STATUS_LABEL: Record<string, string> = { prepare: '准备中', playing: '进行中', finish: '已结束' };

export function GameDayDetail() {
  const { id } = useParams<{ id: string }>();
  const [gameDay, setGameDay] = useState<GameDay | null>(null);
  const [lineups, setLineups] = useState<LineupRow[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStatRow[]>([]);
  const [completing, setCompleting] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [tab, setTab] = useState<'games' | 'lineups' | 'players'>('games');

  const load = () => {
    if (!id) return;
    adminClient.get(`/game-days/${id}`).then((r) => setGameDay(r.data));
    adminClient.get(`/game-days/${id}/lineups`).then((r) => setLineups(r.data)).catch(() => {});
    adminClient.get(`/game-days/${id}/player-stats`).then((r) => setPlayerStats(r.data)).catch(() => setPlayerStats([]));
  };
  useEffect(load, [id]);

  const handleStatusChange = async (status: string) => {
    await adminClient.patch(`/game-days/${id}/status`, { status });
    load();
  };

  const handleRecalculateCap = async () => {
    setRecalculating(true);
    setMessage(null);
    try {
      const res = await adminClient.post(`/game-days/${id}/recalculate-salary-cap`);
      setGameDay(res.data);
      setMessage({ text: `薪资帽已更新：$${res.data.salaryCap?.toLocaleString()}`, ok: true });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setMessage({ text: '错误：' + (e.response?.data?.message ?? '重算失败'), ok: false });
    } finally {
      setRecalculating(false);
    }
  };

  const handleComplete = async () => {
    if (!confirm('确认结算此赛日？将计算所有阵容得分。')) return;
    setCompleting(true);
    setMessage(null);
    try {
      const res = await adminClient.post(`/game-days/${id}/complete`);
      setMessage({ text: res.data.message, ok: true });
      load();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setMessage({ text: '错误：' + (e.response?.data?.message ?? '未知错误'), ok: false });
    } finally { setCompleting(false); }
  };

  if (!gameDay) return <div style={{ color: '#4a6380', padding: 20 }}>加载中…</div>;

  const thStyle: React.CSSProperties = { padding: '10px 14px', textAlign: 'left', color: '#4a6380', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 };
  const tdBase: React.CSSProperties = { padding: '9px 14px', fontSize: 13, borderBottom: '1px solid #1a2332' };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <Link to="/admin/game-days" style={{ color: '#4a6380', fontSize: 12, textDecoration: 'none' }}>← 赛日管理</Link>
          <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 700, marginTop: 6 }}>赛日 — {gameDay.date}</h1>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ background: STATUS_COLOR[gameDay.status] + '22', color: STATUS_COLOR[gameDay.status], border: `1px solid ${STATUS_COLOR[gameDay.status]}55`, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
              {STATUS_LABEL[gameDay.status] ?? gameDay.status}
            </span>
            <span style={{ color: '#4a6380', fontSize: 12 }}>薪资帽: ${gameDay.salaryCap?.toLocaleString()}</span>
            <button
              onClick={handleRecalculateCap}
              disabled={recalculating}
              style={{
                background: '#1e2d3d',
                color: '#8899aa',
                border: '1px solid #2d3f55',
                padding: '4px 10px',
                borderRadius: 6,
                cursor: recalculating ? 'default' : 'pointer',
                fontSize: 11,
                opacity: recalculating ? 0.7 : 1,
              }}
            >
              {recalculating ? '计算中…' : '重算薪资帽'}
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {gameDay.status === 'prepare' && (
            <button onClick={() => handleStatusChange('playing')}
              style={{ background: '#27ae60', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
              激活
            </button>
          )}
          {gameDay.status === 'playing' && (
            <button onClick={handleComplete} disabled={completing}
              style={{ background: '#e94560', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 700, cursor: completing ? 'default' : 'pointer', fontSize: 14, opacity: completing ? 0.7 : 1 }}>
              {completing ? '结算中…' : '✓ 结算并计分'}
            </button>
          )}
        </div>
      </div>

      {message && (
        <div style={{ background: message.ok ? '#27ae6022' : '#e9456022', color: message.ok ? '#27ae60' : '#e94560', border: `1px solid ${message.ok ? '#27ae6044' : '#e9456044'}`, padding: '12px 16px', borderRadius: 8, marginBottom: 20 }}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderBottom: '1px solid #1e2d3d' }}>
        {(['games', 'players', 'lineups'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ background: 'transparent', border: 'none', borderBottom: tab === t ? '2px solid #e94560' : '2px solid transparent', color: tab === t ? '#e94560' : '#4a6380', padding: '8px 20px', cursor: 'pointer', fontSize: 14, fontWeight: tab === t ? 600 : 400, marginBottom: -1 }}>
            {t === 'games' ? `比赛 (${gameDay.games?.length ?? 0})` : t === 'players' ? `球员 (${playerStats.length})` : `阵容 (${lineups.length})`}
          </button>
        ))}
      </div>

      {tab === 'games' && (
        <div style={{ background: '#131f2e', borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0d1820' }}>
                {['#', '主队', '客队', '状态'].map((h) => <th key={h} style={thStyle}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {(gameDay.games ?? []).map((g) => (
                <tr key={g.id}>
                  <td style={{ ...tdBase, color: '#2d3f55' }}>{g.id}</td>
                  <td style={{ ...tdBase, color: '#fff', fontWeight: 500 }}>{g.homeTeam}</td>
                  <td style={{ ...tdBase, color: '#8899aa' }}>{g.awayTeam}</td>
                  <td style={{ ...tdBase }}>
                    <span style={{ background: (STATUS_COLOR[g.status] ?? '#888') + '22', color: STATUS_COLOR[g.status] ?? '#888', border: `1px solid ${(STATUS_COLOR[g.status] ?? '#888')}44`, padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                      {STATUS_LABEL[g.status] ?? g.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'players' && (
        <div style={{ background: '#131f2e', borderRadius: 10, overflow: 'hidden' }}>
          {playerStats.length === 0 ? (
            <div style={{ padding: 24, color: '#4a6380', textAlign: 'center' }}>暂无本赛日球员数据，比赛进行中会同步更新。</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: 700, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#0d1820' }}>
                    {['球员', '位置', '球队', '比赛', 'PTS', 'REB', 'AST', 'STL', 'BLK', 'TO', 'MIN', 'FS'].map((h) => <th key={h} style={thStyle}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {playerStats.map((s) => (
                    <tr key={s.id}>
                      <td style={{ ...tdBase, color: '#fff', fontWeight: 500 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {s.avatarUrl && (
                            <img src={s.avatarUrl} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                          )}
                          {s.playerName}
                        </div>
                      </td>
                      <td style={{ ...tdBase, color: '#4a6380', fontSize: 12 }}>{s.position}</td>
                      <td style={{ ...tdBase, color: '#8899aa' }}>{s.team}</td>
                      <td style={{ ...tdBase, color: '#4a6380', fontSize: 12 }}>
                        {s.game?.homeTeam} vs {s.game?.awayTeam}
                      </td>
                      <td style={{ ...tdBase, color: '#fff', fontWeight: 600 }}>{s.pts}</td>
                      <td style={{ ...tdBase, color: '#8899aa' }}>{s.reb}</td>
                      <td style={{ ...tdBase, color: '#8899aa' }}>{s.ast}</td>
                      <td style={{ ...tdBase, color: '#8899aa' }}>{s.stl}</td>
                      <td style={{ ...tdBase, color: '#8899aa' }}>{s.blk}</td>
                      <td style={{ ...tdBase, color: '#e94560' }}>{s.to}</td>
                      <td style={{ ...tdBase, color: '#4a6380' }}>{s.min}</td>
                      <td style={{ ...tdBase, color: s.fantasyScore != null ? '#27ae60' : '#2d3f55', fontWeight: 600 }}>
                        {s.fantasyScore != null ? s.fantasyScore.toFixed(1) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'lineups' && (
        <div style={{ background: '#131f2e', borderRadius: 10, overflow: 'hidden' }}>
          {lineups.length === 0 ? (
            <div style={{ padding: 24, color: '#4a6380', textAlign: 'center' }}>暂无提交的阵容。</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#0d1820' }}>
                  {['排名', '用户', '房间', '薪资', '得分', '提交时间'].map((h) => <th key={h} style={thStyle}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {lineups.map((l, i) => (
                  <tr key={l.id}>
                    <td style={{ ...tdBase, color: i < 3 ? ['#f39c12', '#8899aa', '#cd7f32'][i] : '#4a6380', fontWeight: 700, fontSize: 14 }}>#{i + 1}</td>
                    <td style={{ ...tdBase, color: '#fff', fontWeight: 500 }}>{l.user.username}</td>
                    <td style={{ ...tdBase, color: '#8899aa' }}>{l.room.name}</td>
                    <td style={{ ...tdBase, color: '#f39c12' }}>${l.totalCost.toLocaleString()}</td>
                    <td style={{ ...tdBase, color: l.totalScore !== null ? '#27ae60' : '#2d3f55', fontWeight: 600 }}>
                      {l.totalScore !== null ? l.totalScore.toFixed(2) : '—'}
                    </td>
                    <td style={{ ...tdBase, color: '#4a6380' }}>{new Date(l.createdAt).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
