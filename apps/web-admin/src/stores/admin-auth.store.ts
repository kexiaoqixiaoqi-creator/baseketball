import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AdminUser {
  id: number;
  username: string;
  email: string;
  isAdmin: boolean;
}

interface AdminAuthState {
  token: string | null;
  user: AdminUser | null;
  login: (token: string, user: AdminUser) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      login: (token, user) => {
        localStorage.setItem('admin_token', token);
        set({ token, user });
      },
      logout: () => {
        localStorage.removeItem('admin_token');
        set({ token: null, user: null });
      },
      isAuthenticated: () => get().token !== null,
    }),
    { name: 'admin-auth-storage' },
  ),
);
