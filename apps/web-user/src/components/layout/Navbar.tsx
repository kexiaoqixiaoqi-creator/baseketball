import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';

export function Navbar() {
  const { user, logout, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  return (
    <nav className="top-nav">
      <Link to="/" className="top-nav-brand">🏀 Fantasy NBA</Link>

      <div className="top-nav-links">
        <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>Home</NavLink>
        <NavLink to="/rooms" className={({ isActive }) => isActive ? 'active' : ''}>Rooms</NavLink>
        {isAuthenticated() && (
          <NavLink to="/profile" className={({ isActive }) => isActive ? 'active' : ''}>Profile</NavLink>
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
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-ghost btn-sm">Login</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}
