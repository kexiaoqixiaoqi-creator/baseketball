import { useEffect, useState } from 'react';
import { adminClient } from '../../api/admin-client';
import { useAdminAuthStore } from '../../stores/admin-auth.store';

interface User { id: number; username: string; email: string; isAdmin: boolean; createdAt: string }

export function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { user: me } = useAdminAuthStore();

  const load = () => {
    adminClient.get('/users').then((r) => setUsers(r.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleToggleAdmin = async (u: User) => {
    const action = u.isAdmin ? '取消' : '授予';
    if (!confirm(`确认${action} ${u.username} 管理员权限？`)) return;
    await adminClient.patch(`/users/${u.id}/toggle-admin`);
    load();
  };

  const handleDelete = async (u: User) => {
    if (!confirm(`确认删除用户 "${u.username}"？此操作不可恢复。`)) return;
    await adminClient.delete(`/users/${u.id}`);
    load();
  };

  const thStyle: React.CSSProperties = { padding: '10px 14px', textAlign: 'left', color: '#4a6380', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 };
  const tdBase: React.CSSProperties = { padding: '9px 14px', fontSize: 13, borderBottom: '1px solid #1a2332' };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>用户管理</h1>
        <p style={{ color: '#4a6380', fontSize: 12, marginTop: 2 }}>共 {users.length} 个注册账号</p>
      </div>

      {loading ? <div style={{ color: '#4a6380' }}>加载中…</div> : (
        <div style={{ background: '#131f2e', borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0d1820' }}>
                {['#', '用户名', '邮箱', '角色', '注册时间', '操作'].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td style={{ ...tdBase, color: '#2d3f55' }}>{u.id}</td>
                  <td style={{ ...tdBase, color: '#fff', fontWeight: 500 }}>
                    {u.username}
                    {u.id === me?.id && <span style={{ color: '#4a6380', fontSize: 11, marginLeft: 6 }}>(当前)</span>}
                  </td>
                  <td style={{ ...tdBase, color: '#8899aa' }}>{u.email}</td>
                  <td style={{ ...tdBase }}>
                    <span style={{
                      background: u.isAdmin ? '#e9456022' : '#2d3f55',
                      color: u.isAdmin ? '#e94560' : '#8899aa',
                      border: `1px solid ${u.isAdmin ? '#e9456055' : '#2d3f55'}`,
                      padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                    }}>
                      {u.isAdmin ? '管理员' : '用户'}
                    </span>
                  </td>
                  <td style={{ ...tdBase, color: '#4a6380' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td style={{ ...tdBase }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {u.id !== me?.id && (
                        <>
                          <button onClick={() => handleToggleAdmin(u)}
                            style={{ background: 'transparent', color: u.isAdmin ? '#f39c12' : '#27ae60', border: `1px solid ${u.isAdmin ? '#f39c1244' : '#27ae6044'}`, padding: '3px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>
                            {u.isAdmin ? '↓ 取消管理员' : '↑ 设为管理员'}
                          </button>
                          <button onClick={() => handleDelete(u)}
                            style={{ background: 'transparent', color: '#e94560', border: '1px solid #e9456044', padding: '3px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>
                            删除
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
