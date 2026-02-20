import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminClient } from '../../api/admin-client';

interface GameDay { id: number; date: string; status: string; games: unknown[] }

export function Dashboard() {
  const [counts, setCounts] = useState({ players: 0, teams: 0, gameDays: 0, rooms: 0, users: 0 });
  const [activeDay, setActiveDay] = useState<GameDay | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminClient.get('/players'),
      adminClient.get('/teams'),
      adminClient.get('/game-days'),
      adminClient.get('/rooms'),
      adminClient.get('/users'),
    ]).then(([p, t, gd, r, u]) => {
      const gameDays: GameDay[] = gd.data;
      setCounts({ players: p.data.length, teams: t.data.length, gameDays: gameDays.length, rooms: r.data.length, users: u.data.length });
      setActiveDay(gameDays.find((d) => d.status === 'playing') ?? null);
    }).finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: 'Players', value: counts.players, link: '/admin/players', color: '#e94560', icon: '🏀' },
    { label: 'Teams', value: counts.teams, link: '/admin/teams', color: '#9b59b6', icon: '🏆' },
    { label: 'Game Days', value: counts.gameDays, link: '/admin/game-days', color: '#27ae60', icon: '📅' },
    { label: 'Rooms', value: counts.rooms, link: '/admin/rooms', color: '#f39c12', icon: '🏠' },
    { label: 'Users', value: counts.users, link: '/admin/users', color: '#3498db', icon: '👥' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 700 }}>Dashboard</h1>
        <p style={{ color: '#4a6380', fontSize: 13, marginTop: 4 }}>Fantasy NBA Admin Overview</p>
      </div>

      {loading ? <div style={{ color: '#4a6380' }}>Loading...</div> : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 24 }}>
            {cards.map((c) => (
              <Link key={c.label} to={c.link} style={{ textDecoration: 'none' }}>
                <div style={{ background: '#131f2e', borderRadius: 10, padding: '18px 16px', borderLeft: `3px solid ${c.color}` }}>
                  <div style={{ fontSize: 18, marginBottom: 6 }}>{c.icon}</div>
                  <div style={{ color: '#4a6380', fontSize: 11, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{c.label}</div>
                  <div style={{ color: '#fff', fontSize: 26, fontWeight: 700 }}>{c.value}</div>
                </div>
              </Link>
            ))}
          </div>

          {activeDay ? (
            <div style={{ background: '#131f2e', borderRadius: 10, padding: 20, borderLeft: '3px solid #27ae60' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ color: '#27ae60', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Active Game Day</div>
                  <div style={{ color: '#fff', fontSize: 18, fontWeight: 600 }}>{activeDay.date}</div>
                  <div style={{ color: '#4a6380', fontSize: 13, marginTop: 3 }}>{(activeDay.games as unknown[]).length} games scheduled</div>
                </div>
                <Link to={`/admin/game-days/${activeDay.id}`} style={{ background: '#27ae60', color: '#fff', padding: '10px 20px', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
                  Manage →
                </Link>
              </div>
            </div>
          ) : (
            <div style={{ background: '#131f2e', borderRadius: 10, padding: 20, borderLeft: '3px solid #2d3f55' }}>
              <div style={{ color: '#4a6380', fontSize: 14 }}>No active game day. Go to Game Days to activate one.</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
