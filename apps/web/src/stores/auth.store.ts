import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  username: string;
  email: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      login: (token, user) => {
        localStorage.setItem('access_token', token);
        set({ token, user });
      },
      logout: () => {
        localStorage.removeItem('access_token');
        set({ token: null, user: null });
      },
      isAuthenticated: () => get().token !== null,
    }),
    { name: 'auth-storage' },
  ),
);
