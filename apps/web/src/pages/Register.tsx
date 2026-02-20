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
      setError(e.response?.data?.message ?? '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-narrow">
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 48, marginBottom: 10 }}>🏀</div>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>创建账号</h1>
        <p className="text-muted mt-4" style={{ fontSize: 14 }}>加入 Fantasy NBA 联赛</p>
      </div>

      <div className="card">
        {error && <div className="alert alert-error" style={{ marginBottom: 14 }}>{error}</div>}
        <form onSubmit={handleSubmit} className="form-stack">
          <div className="form-group">
            <label className="form-label">用户名</label>
            <input
              type="text"
              placeholder="johndoe"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="input"
              required
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label className="form-label">邮箱</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input"
              required
              autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label className="form-label">密码</label>
            <input
              type="password"
              placeholder="至少 6 个字符"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="input"
              required
              autoComplete="new-password"
            />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary btn-full" style={{ marginTop: 4 }}>
            {loading ? '创建中…' : '创建账号'}
          </button>
        </form>
        <p className="text-muted mt-16" style={{ textAlign: 'center', fontSize: 14 }}>
          已有账号？{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>立即登录</Link>
        </p>
      </div>
    </div>
  );
}
