import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminClient } from '../../api/admin-client';

interface Game { id: number; homeTeam: string; awayTeam: string; status: string }
interface GameDay { id: number; date: string; status: string; salaryCap: number; games: Game[] }
interface LineupRow {
  id: number;
  user: { id: number; username: string };
  room: { id: number; name: string };
  totalCost: number;
  totalScore: number | null;
  createdAt: string;
}

const STATUS_COLOR: Record<string, string> = { pending: '#f39c12', active: '#27ae60', completed: '#4a6380', scheduled: '#3498db', in_progress: '#27ae60' };

export function GameDayDetail() {
  const { id } = useParams<{ id: string }>();
  const [gameDay, setGameDay] = useState<GameDay | null>(null);
  const [lineups, setLineups] = useState<LineupRow[]>([]);
  const [completing, setCompleting] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [tab, setTab] = useState<'games' | 'lineups'>('games');

  const load = () => {
    if (!id) return;
    adminClient.get(`/game-days/${id}`).then((r) => setGameDay(r.data));
    adminClient.get(`/game-days/${id}/lineups`).then((r) => setLineups(r.data)).catch(() => {});
  };
  useEffect(load, [id]);

  const handleStatusChange = async (status: string) => {
    await adminClient.patch(`/game-days/${id}/status`, { status });
    load();
  };

  const handleComplete = async () => {
    if (!confirm('Complete this game day? This will calculate all lineup scores.')) return;
    setCompleting(true);
    setMessage(null);
    try {
      const res = await adminClient.post(`/game-days/${id}/complete`);
      setMessage({ text: res.data.message, ok: true });
      load();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setMessage({ text: 'Error: ' + (e.response?.data?.message ?? 'Unknown error'), ok: false });
    } finally { setCompleting(false); }
  };

  if (!gameDay) return <div style={{ color: '#4a6380', padding: 20 }}>Loading...</div>;

  const thStyle: React.CSSProperties = { padding: '10px 14px', textAlign: 'left', color: '#4a6380', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 };
  const tdBase: React.CSSProperties = { padding: '9px 14px', fontSize: 13, borderBottom: '1px solid #1a2332' };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <Link to="/admin/game-days" style={{ color: '#4a6380', fontSize: 12, textDecoration: 'none' }}>← Game Days</Link>
          <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 700, marginTop: 6 }}>Game Day — {gameDay.date}</h1>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
            <span style={{ background: STATUS_COLOR[gameDay.status] + '22', color: STATUS_COLOR[gameDay.status], border: `1px solid ${STATUS_COLOR[gameDay.status]}55`, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
              {gameDay.status.toUpperCase()}
            </span>
            <span style={{ color: '#4a6380', fontSize: 12 }}>Cap: ${gameDay.salaryCap?.toLocaleString()}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {gameDay.status === 'pending' && (
            <button onClick={() => handleStatusChange('active')}
              style={{ background: '#27ae60', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
              Activate
            </button>
          )}
          {gameDay.status === 'active' && (
            <button onClick={handleComplete} disabled={completing}
              style={{ background: '#e94560', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 700, cursor: completing ? 'default' : 'pointer', fontSize: 14, opacity: completing ? 0.7 : 1 }}>
              {completing ? 'Calculating...' : '✓ Complete & Score'}
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
        {(['games', 'lineups'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ background: 'transparent', border: 'none', borderBottom: tab === t ? '2px solid #e94560' : '2px solid transparent', color: tab === t ? '#e94560' : '#4a6380', padding: '8px 20px', cursor: 'pointer', fontSize: 14, fontWeight: tab === t ? 600 : 400, marginBottom: -1 }}>
            {t === 'games' ? `Games (${gameDay.games?.length ?? 0})` : `Lineups (${lineups.length})`}
          </button>
        ))}
      </div>

      {tab === 'games' && (
        <div style={{ background: '#131f2e', borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0d1820' }}>
                {['#', 'Home', 'Away', 'Status'].map((h) => <th key={h} style={thStyle}>{h}</th>)}
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
                      {g.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'lineups' && (
        <div style={{ background: '#131f2e', borderRadius: 10, overflow: 'hidden' }}>
          {lineups.length === 0 ? (
            <div style={{ padding: 24, color: '#4a6380', textAlign: 'center' }}>No lineups submitted yet.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#0d1820' }}>
                  {['Rank', 'User', 'Room', 'Cost', 'Score', 'Submitted'].map((h) => <th key={h} style={thStyle}>{h}</th>)}
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
