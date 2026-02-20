import { BrowserRouter, Routes, Route, NavLink, Navigate, Outlet } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { useAuthStore } from './stores/auth.store';
import { useAdminAuthStore } from './stores/admin-auth.store';
import { Home } from './pages/Home';
import { Rankings } from './pages/Rankings';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Profile } from './pages/Profile';
import { AdminLogin } from './pages/admin/AdminLogin';
import { Dashboard } from './pages/admin/Dashboard';
import { Players } from './pages/admin/Players';
import { Teams } from './pages/admin/Teams';
import { GameDays } from './pages/admin/GameDays';
import { GameDayDetail } from './pages/admin/GameDayDetail';
import { RoomsAdmin } from './pages/admin/RoomsAdmin';
import { Users } from './pages/admin/Users';
import { Scraper } from './pages/admin/Scraper';

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
  if (!isAuthenticated()) return <Navigate to="/admin/login" replace />;

  const navLinks = [
    { to: '/admin', label: '📊 Dashboard', end: true },
    { to: '/admin/players', label: '🏀 Players' },
    { to: '/admin/teams', label: '🏆 Teams' },
    { to: '/admin/game-days', label: '📅 Game Days' },
    { to: '/admin/rooms', label: '🏠 Rooms' },
    { to: '/admin/users', label: '👥 Users' },
    { to: '/admin/scraper', label: '🔄 Data Sync', end: true },
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

function UserLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
      <BottomNav />
    </>
  );
}

function BottomNav() {
  const { isAuthenticated } = useAuthStore();
  return (
    <nav className="bottom-nav">
      <NavLink to="/" end className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}>
        <span className="bottom-nav-icon">⌂</span>
        <span>Home</span>
      </NavLink>
      <NavLink to="/rankings" className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}>
        <span className="bottom-nav-icon">🏆</span>
        <span>榜单</span>
      </NavLink>
      {isAuthenticated() ? (
        <NavLink to="/profile" className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}>
          <span className="bottom-nav-icon">👤</span>
          <span>Profile</span>
        </NavLink>
      ) : (
        <NavLink to="/login" className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}>
          <span className="bottom-nav-icon">🔑</span>
          <span>Login</span>
        </NavLink>
      )}
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Admin routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/admin/players" element={<Players />} />
          <Route path="/admin/teams" element={<Teams />} />
          <Route path="/admin/game-days" element={<GameDays />} />
          <Route path="/admin/game-days/:id" element={<GameDayDetail />} />
          <Route path="/admin/rooms" element={<RoomsAdmin />} />
          <Route path="/admin/users" element={<Users />} />
          <Route path="/admin/scraper" element={<Scraper />} />
        </Route>

        {/* User routes */}
        <Route element={<UserLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/rankings" element={<Rankings />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/rooms" element={<Navigate to="/" replace />} />
          <Route path="/rooms/:id" element={<Navigate to="/" replace />} />
          <Route path="/lineup/:gameDayId" element={<Navigate to="/" replace />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
