import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../stores/auth.store';

export function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await authApi.register(form);
      login(data.accessToken, data.user);
      navigate('/');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message ?? 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: 24 }}>
      <h2 style={{ color: '#fff', marginBottom: 24 }}>Create Account</h2>
      {error && <div style={{ background: '#e94560', color: '#fff', padding: '10px 16px', borderRadius: 4, marginBottom: 16 }}>{error}</div>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <input type="text" placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })}
          style={{ padding: '10px 14px', borderRadius: 6, border: '1px solid #333', background: '#16213e', color: '#fff', fontSize: 15 }} required />
        <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
          style={{ padding: '10px 14px', borderRadius: 6, border: '1px solid #333', background: '#16213e', color: '#fff', fontSize: 15 }} required />
        <input type="password" placeholder="Password (min 6 chars)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
          style={{ padding: '10px 14px', borderRadius: 6, border: '1px solid #333', background: '#16213e', color: '#fff', fontSize: 15 }} required />
        <button type="submit" disabled={loading}
          style={{ background: '#e94560', color: '#fff', border: 'none', padding: '12px', borderRadius: 6, fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>
          {loading ? 'Creating account...' : 'Register'}
        </button>
      </form>
      <p style={{ color: '#aaa', marginTop: 16, textAlign: 'center' }}>
        Already have an account? <Link to="/login" style={{ color: '#e94560' }}>Login</Link>
      </p>
    </div>
  );
}
