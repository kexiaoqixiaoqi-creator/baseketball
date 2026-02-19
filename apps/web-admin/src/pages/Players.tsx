import { useEffect, useState } from 'react';
import { adminClient } from '../api/client';

interface Player {
  id: number;
  name: string;
  position: string;
  team: string;
  jerseyNumber: string;
  isActive: boolean;
}

export function Players() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);

  const load = () => {
    adminClient.get('/players').then((r) => setPlayers(r.data)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      const res = await adminClient.post('/players/recalculate-costs');
      alert(res.data.message);
    } catch {
      alert('Failed to recalculate costs');
    } finally {
      setRecalculating(false);
    }
  };

  const handleDeactivate = async (id: number) => {
    if (!confirm('Deactivate this player?')) return;
    await adminClient.delete(`/players/${id}`);
    load();
  };

  if (loading) return <div style={{ color: '#fff' }}>Loading...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ color: '#fff', margin: 0 }}>Players ({players.length})</h2>
        <button onClick={handleRecalculate} disabled={recalculating}
          style={{ background: '#f39c12', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
          {recalculating ? 'Recalculating...' : 'Recalculate All Costs'}
        </button>
      </div>

      <div style={{ background: '#16213e', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#0f3460' }}>
              {['ID', 'Name', 'Position', 'Team', 'Jersey', 'Active', 'Actions'].map((h) => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#aaa', fontSize: 13, fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {players.map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid #1a1a2e' }}>
                <td style={{ padding: '10px 16px', color: '#888', fontSize: 13 }}>{p.id}</td>
                <td style={{ padding: '10px 16px', color: '#fff' }}>{p.name}</td>
                <td style={{ padding: '10px 16px' }}>
                  <span style={{ background: '#e94560', color: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>{p.position}</span>
                </td>
                <td style={{ padding: '10px 16px', color: '#ccc' }}>{p.team}</td>
                <td style={{ padding: '10px 16px', color: '#ccc' }}>{p.jerseyNumber}</td>
                <td style={{ padding: '10px 16px', color: p.isActive ? '#27ae60' : '#e94560' }}>{p.isActive ? 'Yes' : 'No'}</td>
                <td style={{ padding: '10px 16px' }}>
                  <button onClick={() => handleDeactivate(p.id)}
                    style={{ background: '#333', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>
                    Deactivate
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
