import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminClient } from '../../api/admin-client';

interface GameDay {
  id: number; date: string; status: string; salaryCap: number;
  games: { id: number; homeTeam: string; awayTeam: string; status: string }[];
}

const STATUS_COLOR: Record<string, string> = { pending: '#f39c12', active: '#27ae60', completed: '#4a6380' };

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
    catch { alert('Failed to create game day'); }
    finally { setCreating(false); }
  };

  const handleActivate = async (id: number) => {
    await adminClient.patch(`/game-days/${id}/status`, { status: 'active' });
    load();
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>Game Days</h1>
        <p style={{ color: '#4a6380', fontSize: 12, marginTop: 2 }}>{gameDays.length} total</p>
      </div>

      <form onSubmit={handleCreate} style={{ background: '#131f2e', borderRadius: 10, padding: '14px 16px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
        <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} required
          style={{ padding: '7px 12px', borderRadius: 6, border: '1px solid #2d3f55', background: '#0f1923', color: '#e0e0e0', fontSize: 13 }} />
        <button type="submit" disabled={creating}
          style={{ background: '#27ae60', color: '#fff', border: 'none', padding: '7px 18px', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
          {creating ? 'Creating...' : '+ Add Game Day'}
        </button>
      </form>

      {loading ? <div style={{ color: '#4a6380', padding: 20 }}>Loading...</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {gameDays.map((gd) => (
            <div key={gd.id} style={{ background: '#131f2e', borderRadius: 10, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: `3px solid ${STATUS_COLOR[gd.status] ?? '#2d3f55'}` }}>
              <div>
                <div style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>{gd.date}</div>
                <div style={{ color: '#4a6380', fontSize: 12, marginTop: 2 }}>
                  {gd.games?.length ?? 0} games · Cap: ${gd.salaryCap?.toLocaleString()}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ background: (STATUS_COLOR[gd.status] ?? '#888') + '22', color: STATUS_COLOR[gd.status] ?? '#888', border: `1px solid ${(STATUS_COLOR[gd.status] ?? '#888')}44`, padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                  {gd.status.toUpperCase()}
                </span>
                {gd.status === 'pending' && (
                  <button onClick={() => handleActivate(gd.id)}
                    style={{ background: '#27ae6022', color: '#27ae60', border: '1px solid #27ae6044', padding: '4px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                    Activate
                  </button>
                )}
                <Link to={`/admin/game-days/${gd.id}`}
                  style={{ background: '#1e2d3d', color: '#8899aa', padding: '4px 12px', borderRadius: 6, textDecoration: 'none', fontSize: 12 }}>
                  Manage →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
