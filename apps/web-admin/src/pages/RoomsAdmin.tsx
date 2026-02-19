import { useEffect, useState } from 'react';
import { adminClient } from '../api/client';

interface Room {
  id: number;
  name: string;
  isOfficial: boolean;
  salaryCap: number;
  members: { id: number }[];
}

export function RoomsAdmin() {
  const [rooms, setRooms] = useState<Room[]>([]);

  useEffect(() => {
    adminClient.get('/rooms').then((r) => setRooms(r.data));
  }, []);

  return (
    <div>
      <h2 style={{ color: '#fff', marginBottom: 20 }}>Rooms ({rooms.length})</h2>
      <div style={{ background: '#16213e', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#0f3460' }}>
              {['ID', 'Name', 'Type', 'Cap', 'Members'].map((h) => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#aaa', fontSize: 13 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rooms.map((r) => (
              <tr key={r.id} style={{ borderBottom: '1px solid #1a1a2e' }}>
                <td style={{ padding: '10px 16px', color: '#888' }}>{r.id}</td>
                <td style={{ padding: '10px 16px', color: '#fff' }}>{r.name}</td>
                <td style={{ padding: '10px 16px' }}>
                  <span style={{ background: r.isOfficial ? '#e94560' : '#0f3460', color: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>
                    {r.isOfficial ? 'OFFICIAL' : 'CUSTOM'}
                  </span>
                </td>
                <td style={{ padding: '10px 16px', color: '#ccc' }}>${r.salaryCap?.toLocaleString()}</td>
                <td style={{ padding: '10px 16px', color: '#ccc' }}>{r.members?.length ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
