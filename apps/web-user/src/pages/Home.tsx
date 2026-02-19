import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { gameDaysApi } from '../api/game-days.api';
import { roomsApi } from '../api/rooms.api';

interface GameDay {
  id: number;
  date: string;
  status: string;
  salaryCap: number;
  games: { id: number; homeTeam: string; awayTeam: string; status: string }[];
}

interface RankEntry {
  rank: number;
  username: string;
  totalScore: number;
  lineupId: number;
}

export function Home() {
  const [currentDay, setCurrentDay] = useState<GameDay | null>(null);
  const [rankings, setRankings] = useState<RankEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    gameDaysApi.current()
      .then((gd: GameDay) => {
        setCurrentDay(gd);
        // Load rankings for official room (id=1) for the latest completed day
        return gameDaysApi.list();
      })
      .then(async (allDays: GameDay[]) => {
        const completed = allDays.find((d: GameDay) => d.status === 'completed');
        if (completed) {
          const r = await roomsApi.rankings(1, completed.id).catch(() => []);
          setRankings(r);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: '#fff', padding: 32 }}>Loading...</div>;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
      <h1 style={{ color: '#fff', marginBottom: 8 }}>Fantasy NBA</h1>
      <p style={{ color: '#aaa', marginBottom: 32 }}>Pick your lineup, beat the competition</p>

      {currentDay ? (
        <div style={{ background: '#16213e', borderRadius: 12, padding: 24, marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h2 style={{ color: '#fff', margin: 0 }}>Today's Game Day</h2>
              <p style={{ color: '#aaa', margin: '4px 0 0' }}>{currentDay.date}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ background: currentDay.status === 'active' ? '#27ae60' : '#888', color: '#fff', padding: '4px 12px', borderRadius: 20, fontSize: 13 }}>
                {currentDay.status.toUpperCase()}
              </span>
              <p style={{ color: '#f39c12', margin: '8px 0 0', fontSize: 14 }}>Cap: ${currentDay.salaryCap.toLocaleString()}</p>
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            {currentDay.games.map((g) => (
              <div key={g.id} style={{ color: '#ccc', padding: '6px 0', borderBottom: '1px solid #1a1a2e', fontSize: 14 }}>
                {g.homeTeam} vs {g.awayTeam}
                <span style={{ float: 'right', color: '#888' }}>{g.status}</span>
              </div>
            ))}
          </div>
          <Link to={`/lineup/${currentDay.id}`}
            style={{ display: 'inline-block', background: '#e94560', color: '#fff', padding: '12px 24px', borderRadius: 8, textDecoration: 'none', fontWeight: 700 }}>
            Build My Lineup
          </Link>
        </div>
      ) : (
        <div style={{ background: '#16213e', borderRadius: 12, padding: 32, textAlign: 'center', marginBottom: 32 }}>
          <p style={{ color: '#aaa' }}>No active game day. Check back soon!</p>
        </div>
      )}

      {rankings.length > 0 && (
        <div style={{ background: '#16213e', borderRadius: 12, padding: 24 }}>
          <h3 style={{ color: '#fff', marginBottom: 16 }}>Latest Rankings (Official Room)</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {rankings.slice(0, 10).map((r) => (
                <tr key={r.lineupId} style={{ borderBottom: '1px solid #1a1a2e' }}>
                  <td style={{ padding: '8px 0', color: r.rank <= 3 ? '#f39c12' : '#aaa', width: 40 }}>#{r.rank}</td>
                  <td style={{ padding: '8px 0', color: '#fff' }}>{r.username}</td>
                  <td style={{ padding: '8px 0', textAlign: 'right', color: '#27ae60', fontWeight: 600 }}>{r.totalScore.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
