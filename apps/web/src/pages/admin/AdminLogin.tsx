import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminClient } from '../../api/admin-client';
import { useAdminAuthStore } from '../../stores/admin-auth.store';

export function AdminLogin() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAdminAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await adminClient.post('/auth/login', form);
      login(res.data.accessToken, res.data.user);
      navigate('/admin');
    } catch (err: unknown) {
      const ax = err as { response?: { status?: number; data?: { message?: string } }; message?: string };
      if (ax.response?.status === 401) {
        setError('邮箱或密码错误，请确认已创建管理员账号');
      } else if (ax.response?.data?.message) {
        setError(ax.response.data.message);
      } else if (ax.message?.includes('Network Error')) {
        setError('无法连接后端，请确认 API 已启动（端口 3001）');
      } else {
        setError('登录失败，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#16213e', borderRadius: 12, padding: 40, width: 380 }}>
        <h2 style={{ color: '#fff', marginBottom: 8 }}>管理后台</h2>
        <p style={{ color: '#888', marginBottom: 24 }}>Fantasy NBA 管理</p>
        <p style={{ color: '#666', fontSize: 12, marginBottom: 16 }}>管理员账号需在数据库中手动创建并设置 isAdmin=true</p>
        {error && <div style={{ background: '#e94560', color: '#fff', padding: '10px 16px', borderRadius: 4, marginBottom: 16 }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input type="email" placeholder="管理员邮箱" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
            style={{ padding: '10px 14px', borderRadius: 6, border: '1px solid #333', background: '#0f3460', color: '#fff', fontSize: 15 }} required />
          <input type="password" placeholder="密码" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
            style={{ padding: '10px 14px', borderRadius: 6, border: '1px solid #333', background: '#0f3460', color: '#fff', fontSize: 15 }} required />
          <button type="submit" disabled={loading}
            style={{ background: '#e94560', color: '#fff', border: 'none', padding: '12px', borderRadius: 6, fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>
            {loading ? '登录中…' : '登录'}
          </button>
        </form>
      </div>
    </div>
  );
}
