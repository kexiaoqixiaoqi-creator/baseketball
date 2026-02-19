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
  totalScore: number | null;
}

export function Home() {
  const [currentDay, setCurrentDay] = useState<GameDay | null>(null);
  const [noActiveDay, setNoActiveDay] = useState(false);
  const [rankings, setRankings] = useState<RankEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let allDaysPromise: Promise<GameDay[]>;

    gameDaysApi
      .current()
      .then((gd: GameDay) => {
        setCurrentDay(gd);
        allDaysPromise = gameDaysApi.list();
        return allDaysPromise;
      })
      .catch(() => {
        setNoActiveDay(true);
        allDaysPromise = gameDaysApi.list();
        return allDaysPromise;
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

  if (loading) return <div className="loading">Loading…</div>;

  return (
    <div className="page">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Fantasy NBA</h1>
        <p className="text-muted mt-4" style={{ fontSize: 14 }}>Build your dream lineup and compete</p>
      </div>

      {/* Active game day card */}
      {currentDay ? (
        <div
          className="card"
          style={{ marginBottom: 16, borderLeft: '3px solid var(--success)' }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 12,
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: 17 }}>{currentDay.date}</div>
              <div className="text-muted mt-4" style={{ fontSize: 13 }}>
                Salary cap:{' '}
                <span style={{ color: 'var(--warning)', fontWeight: 600 }}>
                  ${currentDay.salaryCap.toLocaleString()}
                </span>
              </div>
            </div>
            <span className={`badge badge-${currentDay.status}`}>{currentDay.status}</span>
          </div>

          <div style={{ marginBottom: 14 }}>
            {currentDay.games.map((g) => (
              <div key={g.id} className="game-row">
                <span style={{ fontWeight: 500 }}>
                  {g.homeTeam} <span className="text-muted">vs</span> {g.awayTeam}
                </span>
                <span className="text-muted" style={{ fontSize: 13 }}>{g.status}</span>
              </div>
            ))}
          </div>

          <Link to={`/lineup/${currentDay.id}`} className="btn btn-primary btn-full">
            Build My Lineup →
          </Link>
        </div>
      ) : noActiveDay ? (
        <div className="card" style={{ textAlign: 'center', marginBottom: 16, padding: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>⏳</div>
          <p className="text-muted">No active game day. Check back soon!</p>
        </div>
      ) : null}

      {/* Latest rankings */}
      {rankings.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Latest Rankings</h3>
            <p className="text-muted mt-4" style={{ fontSize: 12 }}>Official room · Most recent scored game day</p>
          </div>
          {rankings.slice(0, 10).map((r) => (
            <div key={r.rank} className="rank-item">
              <span className={`rank-num rank-${r.rank <= 3 ? r.rank : 'other'}`}>#{r.rank}</span>
              <span style={{ flex: 1, fontWeight: 500 }}>{r.username}</span>
              <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: 16 }}>
                {r.totalScore !== null ? (r.totalScore as number).toFixed(1) : '—'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
