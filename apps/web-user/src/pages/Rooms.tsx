import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { roomsApi } from '../api/rooms.api';

interface Room {
  id: number;
  name: string;
  isOfficial: boolean;
  salaryCap: number;
  memberCount: number;
}

export function Rooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: '', salaryCap: 50000 });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    roomsApi.list().then(setRooms).catch(() => {});
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const created = await roomsApi.create(newRoom);
      setRooms([...rooms, created]);
      setShowCreate(false);
      setNewRoom({ name: '', salaryCap: 50000 });
    } catch {
      alert('Failed to create room');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ color: '#fff', margin: 0 }}>Rooms</h2>
        <button onClick={() => setShowCreate(!showCreate)}
          style={{ background: '#e94560', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
          {showCreate ? 'Cancel' : '+ Create Room'}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} style={{ background: '#16213e', borderRadius: 12, padding: 24, marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 style={{ color: '#fff', margin: 0 }}>Create Custom Room</h3>
          <input type="text" placeholder="Room name" value={newRoom.name} onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
            style={{ padding: '10px 14px', borderRadius: 6, border: '1px solid #333', background: '#0f3460', color: '#fff', fontSize: 15 }} required />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <label style={{ color: '#aaa' }}>Salary Cap: $</label>
            <input type="number" value={newRoom.salaryCap} onChange={(e) => setNewRoom({ ...newRoom, salaryCap: Number(e.target.value) })}
              style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #333', background: '#0f3460', color: '#fff', width: 120 }} />
          </div>
          <button type="submit" disabled={creating}
            style={{ background: '#27ae60', color: '#fff', border: 'none', padding: '10px', borderRadius: 6, fontWeight: 700, cursor: 'pointer', width: 160 }}>
            {creating ? 'Creating...' : 'Create Room'}
          </button>
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {rooms.map((room) => (
          <Link key={room.id} to={`/rooms/${room.id}`} style={{ textDecoration: 'none' }}>
            <div style={{ background: '#16213e', borderRadius: 10, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: '#fff', fontWeight: 600 }}>
                  {room.name}
                  {room.isOfficial && <span style={{ background: '#e94560', color: '#fff', fontSize: 11, padding: '2px 8px', borderRadius: 10, marginLeft: 8 }}>OFFICIAL</span>}
                </div>
                <div style={{ color: '#888', fontSize: 13, marginTop: 4 }}>
                  Cap: ${room.salaryCap.toLocaleString()} · {room.memberCount} members
                </div>
              </div>
              <span style={{ color: '#e94560', fontSize: 20 }}>›</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
