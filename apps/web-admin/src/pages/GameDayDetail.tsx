import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { adminClient } from '../api/client';

interface GameDay {
  id: number;
  date: string;
  status: string;
  salaryCap: number;
  games: { id: number; homeTeam: string; awayTeam: string; status: string }[];
}

export function GameDayDetail() {
  const { id } = useParams<{ id: string }>();
  const [gameDay, setGameDay] = useState<GameDay | null>(null);
  const [completing, setCompleting] = useState(false);
  const [result, setResult] = useState('');

  const load = () => {
    if (!id) return;
    adminClient.get(`/game-days/${id}`).then((r) => setGameDay(r.data));
  };
  useEffect(load, [id]);

  const handleComplete = async () => {
    if (!confirm('Complete this game day? This will calculate all lineup scores.')) return;
    setCompleting(true);
    setResult('');
    try {
      const res = await adminClient.post(`/game-days/${id}/complete`);
      setResult(res.data.message);
      load();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setResult('Error: ' + (e.response?.data?.message ?? 'Unknown error'));
    } finally {
      setCompleting(false);
    }
  };

  if (!gameDay) return <div style={{ color: '#fff' }}>Loading...</div>;

  const statusColor: Record<string, string> = { pending: '#f39c12', active: '#27ae60', completed: '#888' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h2 style={{ color: '#fff', margin: 0 }}>Game Day — {gameDay.date}</h2>
          <div style={{ marginTop: 8 }}>
            <span style={{ background: statusColor[gameDay.status] ?? '#888', color: '#fff', padding: '4px 12px', borderRadius: 20, fontSize: 13 }}>
              {gameDay.status.toUpperCase()}
            </span>
          </div>
        </div>
        {gameDay.status === 'active' && (
          <button onClick={handleComplete} disabled={completing}
            style={{ background: '#e94560', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 15 }}>
            {completing ? 'Calculating...' : 'Complete Game Day (Calculate Scores)'}
          </button>
        )}
      </div>

      {result && (
        <div style={{ background: result.startsWith('Error') ? '#e94560' : '#27ae60', color: '#fff', padding: '12px 16px', borderRadius: 8, marginBottom: 20 }}>
          {result}
        </div>
      )}

      <div style={{ background: '#16213e', borderRadius: 10, padding: 20 }}>
        <h3 style={{ color: '#fff', marginBottom: 12 }}>Games ({gameDay.games?.length ?? 0})</h3>
        {(gameDay.games ?? []).map((g) => (
          <div key={g.id} style={{ padding: '10px 0', borderBottom: '1px solid #1a1a2e', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#fff' }}>{g.homeTeam} vs {g.awayTeam}</span>
            <span style={{ color: statusColor[g.status] ?? '#888', fontSize: 13 }}>{g.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
