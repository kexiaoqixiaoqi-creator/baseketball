import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminClient } from '../api/client';

interface GameDay {
  id: number;
  date: string;
  status: string;
  salaryCap: number;
  games: { id: number; homeTeam: string; awayTeam: string; status: string }[];
}

export function GameDays() {
  const [gameDays, setGameDays] = useState<GameDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newDate, setNewDate] = useState('');

  const load = () => {
    adminClient.get('/game-days').then((r) => setGameDays(r.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await adminClient.post('/game-days', { date: newDate });
      setNewDate('');
      load();
    } catch {
      alert('Failed to create game day');
    } finally {
      setCreating(false);
    }
  };

  const handleActivate = async (id: number) => {
    await adminClient.patch(`/game-days/${id}/status`, { status: 'active' });
    load();
  };

  const statusColor: Record<string, string> = {
    pending: '#f39c12',
    active: '#27ae60',
    completed: '#888',
  };

  if (loading) return <div style={{ color: '#fff' }}>Loading...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ color: '#fff', margin: 0 }}>Game Days</h2>
      </div>

      <form onSubmit={handleCreate} style={{ background: '#16213e', borderRadius: 10, padding: 20, marginBottom: 24, display: 'flex', gap: 12, alignItems: 'center' }}>
        <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #333', background: '#0f3460', color: '#fff' }} required />
        <button type="submit" disabled={creating}
          style={{ background: '#27ae60', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>
          {creating ? 'Creating...' : '+ Add Game Day'}
        </button>
      </form>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {gameDays.map((gd) => (
          <div key={gd.id} style={{ background: '#16213e', borderRadius: 10, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: '#fff', fontWeight: 600 }}>{gd.date}</div>
              <div style={{ color: '#888', fontSize: 13 }}>
                {gd.games?.length ?? 0} games · Cap: ${gd.salaryCap?.toLocaleString()}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ background: statusColor[gd.status] ?? '#888', color: '#fff', padding: '3px 10px', borderRadius: 20, fontSize: 12 }}>
                {gd.status}
              </span>
              {gd.status === 'pending' && (
                <button onClick={() => handleActivate(gd.id)}
                  style={{ background: '#27ae60', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>
                  Activate
                </button>
              )}
              <Link to={`/game-days/${gd.id}`}
                style={{ background: '#0f3460', color: '#fff', padding: '4px 12px', borderRadius: 4, textDecoration: 'none', fontSize: 12 }}>
                Manage
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
