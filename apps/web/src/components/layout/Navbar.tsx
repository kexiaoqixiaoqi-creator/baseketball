import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';

export function Navbar() {
  const { user, logout, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  return (
    <nav className="top-nav">
      <Link to="/" className="top-nav-brand">🏀 Fantasy NBA</Link>

      <div className="top-nav-links">
        <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>首页</NavLink>
        <Link to="/admin" className="top-nav-admin">管理</Link>
        {isAuthenticated() && (
          <NavLink to="/profile" className={({ isActive }) => isActive ? 'active' : ''}>个人</NavLink>
        )}
      </div>

      <div className="top-nav-spacer" />

      <div className="top-nav-right">
        {isAuthenticated() ? (
          <>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{user?.username}</span>
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="btn btn-outline btn-sm"
            >
              退出
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-ghost btn-sm">登录</Link>
            <Link to="/register" className="btn btn-primary btn-sm">注册</Link>
          </>
        )}
      </div>
    </nav>
  );
}
