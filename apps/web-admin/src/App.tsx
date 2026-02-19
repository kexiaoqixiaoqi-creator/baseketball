import { BrowserRouter, Routes, Route, NavLink, Navigate, Outlet } from 'react-router-dom';
import { useAdminAuthStore } from './stores/admin-auth.store';
import { AdminLogin } from './pages/AdminLogin';
import { Dashboard } from './pages/Dashboard';
import { Players } from './pages/Players';
import { Teams } from './pages/Teams';
import { GameDays } from './pages/GameDays';
import { GameDayDetail } from './pages/GameDayDetail';
import { RoomsAdmin } from './pages/RoomsAdmin';
import { Users } from './pages/Users';
import { Scraper } from './pages/Scraper';

const S = {
  layout: { display: 'flex', minHeight: '100vh' } as React.CSSProperties,
  sidebar: {
    width: 220, background: '#131f2e', display: 'flex', flexDirection: 'column',
    borderRight: '1px solid #1e2d3d', flexShrink: 0,
  } as React.CSSProperties,
  logo: { padding: '24px 20px 20px', borderBottom: '1px solid #1e2d3d' },
  nav: { padding: '12px 0', flex: 1 },
  content: { flex: 1, padding: 28, background: '#0f1923', overflowY: 'auto', minHeight: '100vh' } as React.CSSProperties,
  footer: { padding: '16px 20px', borderTop: '1px solid #1e2d3d' },
};

function AdminLayout() {
  const { user, logout, isAuthenticated } = useAdminAuthStore();
  if (!isAuthenticated()) return <Navigate to="/login" replace />;

  const navLinks = [
    { to: '/', label: '📊 Dashboard', end: true },
    { to: '/players', label: '🏀 Players' },
    { to: '/teams', label: '🏆 Teams' },
    { to: '/game-days', label: '📅 Game Days' },
    { to: '/rooms', label: '🏠 Rooms' },
    { to: '/users', label: '👥 Users' },
    { to: '/scraper', label: '🔄 Data Sync', end: true },
  ];

  return (
    <div style={S.layout}>
      <div style={S.sidebar}>
        <div style={S.logo}>
          <div style={{ color: '#e94560', fontWeight: 700, fontSize: 17, letterSpacing: 0.5 }}>Fantasy NBA</div>
          <div style={{ color: '#4a6380', fontSize: 11, marginTop: 3, textTransform: 'uppercase', letterSpacing: 1 }}>Admin Panel</div>
        </div>
        <nav style={S.nav}>
          {navLinks.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end}
              style={({ isActive }) => ({
                display: 'block', padding: '9px 20px', fontSize: 14,
                color: isActive ? '#e94560' : '#8899aa',
                textDecoration: 'none', fontWeight: isActive ? 600 : 400,
                background: isActive ? 'rgba(233,69,96,0.08)' : 'transparent',
                borderLeft: isActive ? '3px solid #e94560' : '3px solid transparent',
                transition: 'all 0.15s',
              })}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div style={S.footer}>
          <div style={{ color: '#4a6380', fontSize: 12, marginBottom: 8 }}>{user?.username}</div>
          <button onClick={logout} style={{
            background: '#1e2d3d', color: '#8899aa', border: '1px solid #2d3f55',
            padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 12, width: '100%',
          }}>
            Logout
          </button>
        </div>
      </div>
      <div style={S.content}>
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
          <Route path="/teams" element={<Teams />} />
          <Route path="/game-days" element={<GameDays />} />
          <Route path="/game-days/:id" element={<GameDayDetail />} />
          <Route path="/rooms" element={<RoomsAdmin />} />
          <Route path="/users" element={<Users />} />
          <Route path="/scraper" element={<Scraper />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
