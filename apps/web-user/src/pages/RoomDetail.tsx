import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { roomsApi } from '../api/rooms.api';
import { gameDaysApi } from '../api/game-days.api';
import { RankingsTable } from '../components/RankingsTable';

interface Room {
  id: number;
  name: string;
  isOfficial: boolean;
  salaryCap: number;
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
  totalScore: number;
  lineupId: number;
}

export function RoomDetail() {
  const { id } = useParams<{ id: string }>();
  const [room, setRoom] = useState<Room | null>(null);
  const [gameDays, setGameDays] = useState<GameDay[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [rankings, setRankings] = useState<RankEntry[]>([]);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([roomsApi.get(Number(id)), gameDaysApi.list()]).then(([r, gds]) => {
      setRoom(r);
      setGameDays(gds);
      const completed = gds.find((d: GameDay) => d.status === 'completed');
      if (completed) setSelectedDay(completed.id);
    });
  }, [id]);

  useEffect(() => {
    if (!id || !selectedDay) return;
    roomsApi.rankings(Number(id), selectedDay).then(setRankings).catch(() => setRankings([]));
  }, [id, selectedDay]);

  const handleJoin = async () => {
    if (!id) return;
    setJoining(true);
    try {
      await roomsApi.join(Number(id));
      alert('Joined room!');
    } catch {
      alert('Could not join room');
    } finally {
      setJoining(false);
    }
  };

  if (!room) return <div style={{ color: '#fff', padding: 32 }}>Loading...</div>;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h2 style={{ color: '#fff', margin: 0 }}>
            {room.name}
            {room.isOfficial && <span style={{ background: '#e94560', color: '#fff', fontSize: 12, padding: '2px 10px', borderRadius: 10, marginLeft: 10 }}>OFFICIAL</span>}
          </h2>
          <p style={{ color: '#888', marginTop: 4 }}>
            Cap: ${room.salaryCap.toLocaleString()} · {room.memberCount} members
          </p>
        </div>
        {!room.isOfficial && (
          <button onClick={handleJoin} disabled={joining}
            style={{ background: '#27ae60', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
            {joining ? 'Joining...' : 'Join Room'}
          </button>
        )}
      </div>

      {/* Game day selector */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ color: '#aaa', fontSize: 14 }}>Show rankings for: </label>
        <select value={selectedDay ?? ''} onChange={(e) => setSelectedDay(Number(e.target.value))}
          style={{ background: '#16213e', color: '#fff', border: '1px solid #333', padding: '6px 12px', borderRadius: 4, marginLeft: 8 }}>
          {gameDays.filter((gd) => gd.status === 'completed').map((gd) => (
            <option key={gd.id} value={gd.id}>{gd.date}</option>
          ))}
        </select>
      </div>

      <div style={{ background: '#16213e', borderRadius: 12, padding: 20 }}>
        <h3 style={{ color: '#fff', marginBottom: 16 }}>Rankings</h3>
        <RankingsTable rankings={rankings} />
      </div>
    </div>
  );
}
