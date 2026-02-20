import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { roomsApi } from '../api/rooms.api';
import { gameDaysApi } from '../api/game-days.api';
import { useAuthStore } from '../stores/auth.store';

interface Room {
  id: number;
  name: string;
  isOfficial: boolean;
  salaryCapCoefficient: number;
  memberCount: number;
}

interface GameDay {
  id: number;
  date: string;
  status: string;
}

interface RankEntry {
  rank: number;
  username: string;
  totalScore: number | null;
  lineupId: number;
}

export function RoomDetail() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuthStore();
  const [room, setRoom] = useState<Room | null>(null);
  const [gameDays, setGameDays] = useState<GameDay[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [rankings, setRankings] = useState<RankEntry[] | null>(null);
  const [rankLoading, setRankLoading] = useState(false);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([roomsApi.get(Number(id)), gameDaysApi.list()]).then(([r, gds]) => {
      setRoom(r);
      setGameDays(gds);
      const completed = gds.find((d: GameDay) => d.status === 'finish');
      if (completed) setSelectedDay(completed.id);
    });
  }, [id]);

  useEffect(() => {
    if (!id || !selectedDay) return;
    setRankLoading(true);
    roomsApi
      .rankings(Number(id), selectedDay)
      .then((data) => setRankings(data))
      .catch(() => setRankings([]))
      .finally(() => setRankLoading(false));
  }, [id, selectedDay]);

  const handleJoin = async () => {
    if (!id) return;
    setJoining(true);
    try {
      await roomsApi.join(Number(id));
      const updated = await roomsApi.get(Number(id));
      setRoom(updated);
    } catch {
      alert('Could not join room');
    } finally {
      setJoining(false);
    }
  };

  if (!room) return <div className="loading">Loading…</div>;

  const completedDays = gameDays.filter((gd) => gd.status === 'finish');

  return (
    <div className="page">
      {/* Room header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {room.name}
              {room.isOfficial && <span className="badge badge-official">Official</span>}
            </h2>
            <p className="text-muted mt-4" style={{ fontSize: 13 }}>
              系数: {room.salaryCapCoefficient} · {room.memberCount ?? 0} members
            </p>
          </div>
          {!room.isOfficial && isAuthenticated() && (
            <button onClick={handleJoin} disabled={joining} className="btn btn-success btn-sm">
              {joining ? 'Joining…' : 'Join'}
            </button>
          )}
        </div>
      </div>

      {/* Game day selector */}
      {completedDays.length > 0 && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="form-group">
            <label className="form-label">Show rankings for</label>
            <select
              className="input"
              value={selectedDay ?? ''}
              onChange={(e) => setSelectedDay(Number(e.target.value))}
            >
              {completedDays.map((gd) => (
                <option key={gd.id} value={gd.id}>{gd.date}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Rankings */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700 }}>Rankings</h3>
        </div>
        {rankLoading ? (
          <div className="loading">Loading rankings…</div>
        ) : rankings === null ? (
          <div className="empty">Select a game day to see rankings</div>
        ) : completedDays.length === 0 ? (
          <div className="empty">No completed game days yet</div>
        ) : rankings.length === 0 ? (
          <div className="empty">No lineups for this game day</div>
        ) : (
          rankings.map((r) => (
            <div key={r.lineupId} className="rank-item">
              <span className={`rank-num rank-${r.rank <= 3 ? r.rank : 'other'}`}>#{r.rank}</span>
              <span style={{ flex: 1, fontWeight: 500 }}>{r.username}</span>
              <span
                style={{
                  color: r.totalScore !== null ? 'var(--success)' : 'var(--text-muted)',
                  fontWeight: 700,
                  fontSize: 16,
                }}
              >
                {r.totalScore !== null ? (r.totalScore as number).toFixed(1) : '—'}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
