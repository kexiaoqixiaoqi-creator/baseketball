import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminClient } from '../api/client';

export function Dashboard() {
  const [stats, setStats] = useState({ players: 0, gameDays: 0, rooms: 0, users: 0 });

  useEffect(() => {
    Promise.all([
      adminClient.get('/players'),
      adminClient.get('/game-days'),
      adminClient.get('/rooms'),
      adminClient.get('/users'),
    ])
      .then(([players, gd, rooms, users]) => {
        setStats({
          players: players.data.length,
          gameDays: gd.data.length,
          rooms: rooms.data.length,
          users: users.data.length,
        });
      })
      .catch(() => {});
  }, []);

  const cards = [
    { label: 'Players', value: stats.players, link: '/players', color: '#e94560' },
    { label: 'Game Days', value: stats.gameDays, link: '/game-days', color: '#27ae60' },
    { label: 'Rooms', value: stats.rooms, link: '/rooms', color: '#f39c12' },
    { label: 'Users', value: stats.users, link: '/users', color: '#3498db' },
  ];

  return (
    <div>
      <h2 style={{ color: '#fff', marginBottom: 24 }}>Dashboard</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {cards.map((c) => (
          <Link key={c.label} to={c.link} style={{ textDecoration: 'none' }}>
            <div style={{ background: '#16213e', borderRadius: 10, padding: '24px 20px', borderLeft: `4px solid ${c.color}` }}>
              <div style={{ color: '#888', fontSize: 14, marginBottom: 8 }}>{c.label}</div>
              <div style={{ color: '#fff', fontSize: 32, fontWeight: 700 }}>{c.value}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
