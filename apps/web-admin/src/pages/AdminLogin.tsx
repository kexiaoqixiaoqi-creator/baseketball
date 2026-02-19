import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminClient } from '../api/client';
import { useAdminAuthStore } from '../stores/admin-auth.store';

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
      navigate('/');
    } catch {
      setError('Invalid admin credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#16213e', borderRadius: 12, padding: 40, width: 380 }}>
        <h2 style={{ color: '#fff', marginBottom: 8 }}>Admin Panel</h2>
        <p style={{ color: '#888', marginBottom: 24 }}>Fantasy NBA Management</p>
        {error && <div style={{ background: '#e94560', color: '#fff', padding: '10px 16px', borderRadius: 4, marginBottom: 16 }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input type="email" placeholder="Admin Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
            style={{ padding: '10px 14px', borderRadius: 6, border: '1px solid #333', background: '#0f3460', color: '#fff', fontSize: 15 }} required />
          <input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
            style={{ padding: '10px 14px', borderRadius: 6, border: '1px solid #333', background: '#0f3460', color: '#fff', fontSize: 15 }} required />
          <button type="submit" disabled={loading}
            style={{ background: '#e94560', color: '#fff', border: 'none', padding: '12px', borderRadius: 6, fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
