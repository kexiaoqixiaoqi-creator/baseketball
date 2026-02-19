import { BrowserRouter, Routes, Route, NavLink, Navigate, Outlet } from 'react-router-dom';
import { useAdminAuthStore } from './stores/admin-auth.store';
import { AdminLogin } from './pages/AdminLogin';
import { Dashboard } from './pages/Dashboard';
import { Players } from './pages/Players';
import { GameDays } from './pages/GameDays';
import { GameDayDetail } from './pages/GameDayDetail';
import { RoomsAdmin } from './pages/RoomsAdmin';
import { Users } from './pages/Users';

function AdminLayout() {
  const { user, logout, isAuthenticated } = useAdminAuthStore();

  if (!isAuthenticated()) return <Navigate to="/login" replace />;

  const navLinks = [
    { to: '/', label: 'Dashboard', end: true },
    { to: '/players', label: 'Players' },
    { to: '/game-days', label: 'Game Days' },
    { to: '/rooms', label: 'Rooms' },
    { to: '/users', label: 'Users' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <div style={{ width: 220, background: '#16213e', padding: '24px 0', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #1a1a2e' }}>
          <div style={{ color: '#e94560', fontWeight: 700, fontSize: 18 }}>Fantasy NBA</div>
          <div style={{ color: '#888', fontSize: 12, marginTop: 4 }}>Admin Panel</div>
        </div>
        <nav style={{ padding: '16px 0', flex: 1 }}>
          {navLinks.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end}
              style={({ isActive }) => ({
                display: 'block', padding: '10px 20px', color: isActive ? '#e94560' : '#ccc',
                textDecoration: 'none', fontWeight: isActive ? 600 : 400,
                borderLeft: isActive ? '3px solid #e94560' : '3px solid transparent',
              })}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div style={{ padding: '16px 20px', borderTop: '1px solid #1a1a2e' }}>
          <div style={{ color: '#aaa', fontSize: 13, marginBottom: 8 }}>{user?.username}</div>
          <button onClick={logout} style={{ background: '#333', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>
            Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: 32, background: '#0f3460', overflowY: 'auto' }}>
        <Outlet />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AdminLogin />} />
        <Route element={<AdminLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/players" element={<Players />} />
          <Route path="/game-days" element={<GameDays />} />
          <Route path="/game-days/:id" element={<GameDayDetail />} />
          <Route path="/rooms" element={<RoomsAdmin />} />
          <Route path="/users" element={<Users />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
