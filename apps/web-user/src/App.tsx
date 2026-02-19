import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { LineupBuilder } from './pages/LineupBuilder';
import { Rooms } from './pages/Rooms';
import { RoomDetail } from './pages/RoomDetail';
import { Profile } from './pages/Profile';
import { useAuthStore } from './stores/auth.store';

function BottomNav() {
  const { isAuthenticated } = useAuthStore();
  return (
    <nav className="bottom-nav">
      <NavLink to="/" end className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}>
        <span className="bottom-nav-icon">⌂</span>
        <span>Home</span>
      </NavLink>
      <NavLink to="/rooms" className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}>
        <span className="bottom-nav-icon">🏆</span>
        <span>Rooms</span>
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
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/rooms" element={<Rooms />} />
        <Route path="/rooms/:id" element={<RoomDetail />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/lineup/:gameDayId" element={<LineupBuilder />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Routes>
      <BottomNav />
    </BrowserRouter>
  );
}
