import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { roomsApi } from '../api/rooms.api';
import { useAuthStore } from '../stores/auth.store';

interface Room {
  id: number;
  name: string;
  isOfficial: boolean;
  salaryCapCoefficient: number;
  memberCount: number;
}

export function Rooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: '', salaryCapCoefficient: 0.33 });
  const [creating, setCreating] = useState(false);
  const { isAuthenticated } = useAuthStore();

  const load = () => roomsApi.list().then(setRooms).catch(() => {});

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await roomsApi.create(newRoom);
      await load();
      setShowCreate(false);
      setNewRoom({ name: '', salaryCapCoefficient: 0.33 });
    } catch {
      alert('Failed to create room');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800 }}>Rooms</h2>
          <p className="text-muted mt-4" style={{ fontSize: 13 }}>{rooms.length} rooms</p>
        </div>
        {isAuthenticated() && (
          <button
            onClick={() => setShowCreate((v) => !v)}
            className={`btn btn-sm ${showCreate ? 'btn-ghost' : 'btn-primary'}`}
          >
            {showCreate ? 'Cancel' : '+ Create'}
          </button>
        )}
      </div>

      {showCreate && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>New Custom Room</h3>
          <form onSubmit={handleCreate} className="form-stack">
            <div className="form-group">
              <label className="form-label">Room Name</label>
              <input
                type="text"
                className="input"
                placeholder="My Custom Room"
                value={newRoom.name}
                onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">薪资帽系数 (salaryCapCoefficient)</label>
              <input
                type="number"
                className="input"
                step="0.01"
                min="0.1"
                value={newRoom.salaryCapCoefficient}
                onChange={(e) => setNewRoom({ ...newRoom, salaryCapCoefficient: Number(e.target.value) })}
              />
              <small className="text-muted" style={{ fontSize: 12 }}>salaryCap = avgCost × 5 × 系数</small>
            </div>
            <button type="submit" disabled={creating} className="btn btn-success">
              {creating ? 'Creating…' : 'Create Room'}
            </button>
          </form>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {rooms.map((room) => (
          <Link key={room.id} to={`/rooms/${room.id}`} style={{ textDecoration: 'none' }}>
            <div
              className="card"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderLeft: `3px solid ${room.isOfficial ? 'var(--primary)' : 'var(--border)'}`,
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {room.name}
                  {room.isOfficial && <span className="badge badge-official">Official</span>}
                </div>
                <div className="text-muted mt-4" style={{ fontSize: 13 }}>
                  系数: {room.salaryCapCoefficient} · {room.memberCount ?? 0} members
                </div>
              </div>
              <span style={{ color: 'var(--primary)', fontSize: 22, marginLeft: 8 }}>›</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
