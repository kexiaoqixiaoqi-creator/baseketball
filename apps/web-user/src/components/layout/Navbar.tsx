import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';

export function Navbar() {
  const { user, logout, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={{ background: '#1a1a2e', color: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', height: 60, gap: 24 }}>
      <Link to="/" style={{ color: '#e94560', fontWeight: 700, fontSize: 20, textDecoration: 'none' }}>
        Fantasy NBA
      </Link>
      <Link to="/" style={{ color: '#fff', textDecoration: 'none' }}>Home</Link>
      <Link to="/rooms" style={{ color: '#fff', textDecoration: 'none' }}>Rooms</Link>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
        {isAuthenticated() ? (
          <>
            <span style={{ color: '#aaa' }}>Hi, {user?.username}</span>
            <Link to="/profile" style={{ color: '#fff', textDecoration: 'none' }}>Profile</Link>
            <button onClick={handleLogout} style={{ background: '#e94560', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: 4, cursor: 'pointer' }}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" style={{ color: '#fff', textDecoration: 'none' }}>Login</Link>
            <Link to="/register" style={{ color: '#e94560', fontWeight: 600, textDecoration: 'none' }}>Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}
