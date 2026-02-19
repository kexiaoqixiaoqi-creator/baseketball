import { useEffect, useState } from 'react';
import { adminClient } from '../api/client';

interface User {
  id: number;
  username: string;
  email: string;
  isAdmin: boolean;
  createdAt: string;
}

export function Users() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    adminClient.get('/users').then((r) => setUsers(r.data));
  }, []);

  return (
    <div>
      <h2 style={{ color: '#fff', marginBottom: 20 }}>Users ({users.length})</h2>
      <div style={{ background: '#16213e', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#0f3460' }}>
              {['ID', 'Username', 'Email', 'Admin', 'Joined'].map((h) => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#aaa', fontSize: 13 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={{ borderBottom: '1px solid #1a1a2e' }}>
                <td style={{ padding: '10px 16px', color: '#888' }}>{u.id}</td>
                <td style={{ padding: '10px 16px', color: '#fff' }}>{u.username}</td>
                <td style={{ padding: '10px 16px', color: '#ccc' }}>{u.email}</td>
                <td style={{ padding: '10px 16px', color: u.isAdmin ? '#e94560' : '#888' }}>{u.isAdmin ? 'Yes' : 'No'}</td>
                <td style={{ padding: '10px 16px', color: '#888', fontSize: 13 }}>{new Date(u.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
