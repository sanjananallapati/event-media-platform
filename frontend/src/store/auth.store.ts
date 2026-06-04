import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { api } from '@/lib/api';

// Import socket lazily to avoid SSR issues
let initSocketFn: ((token: string) => any) | null = null;
let disconnectSocketFn: (() => void) | null = null;

if (typeof window !== 'undefined') {
  import('@/lib/socket').then((mod) => {
    initSocketFn = mod.initSocket;
    disconnectSocketFn = mod.disconnectSocket;
  });
}

interface User {
  id: string;
  userId: string;
  email: string;
  username: string;
  fullName: string;
  role: string;
  avatar?: string;
  bio?: string;
  selfieUrl?: string;
  rekognitionIndexed?: boolean;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    username: string;
    fullName: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setUser: (user: User | null) => void;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      loading: false,

      login: async (email: string, password: string) => {
        set({ loading: true });
        try {
          const response = await api.post('/auth/login', { email, password });
          const { user, accessToken, refreshToken } = response.data.data;

          // Store tokens in localStorage for the axios interceptor
          if (typeof window !== 'undefined') {
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
          }

          set({
            user: { ...user, userId: user.id },
            accessToken,
            refreshToken,
            isAuthenticated: true,
            loading: false,
          });

          // Init socket (non-blocking)
          try {
            if (initSocketFn) initSocketFn(accessToken);
          } catch {}
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },

      register: async (data) => {
        set({ loading: true });
        try {
          const response = await api.post('/auth/register', {
            email: data.email,
            username: data.username,
            fullName: data.fullName,
            password: data.password,
          });
          const { user, accessToken, refreshToken } = response.data.data;

          if (typeof window !== 'undefined') {
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
          }

          set({
            user: { ...user, userId: user.id },
            accessToken,
            refreshToken,
            isAuthenticated: true,
            loading: false,
          });

          try {
            if (initSocketFn) initSocketFn(accessToken);
          } catch {}
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },

      logout: async () => {
        const { refreshToken } = get();
        try {
          // Use refreshToken in body; endpoint does NOT require Bearer auth
          await api.post('/auth/logout', { refreshToken });
        } catch {}

        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }

        try {
          if (disconnectSocketFn) disconnectSocketFn();
        } catch {}

        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      checkAuth: async () => {
        // Try localStorage token first (set by axios interceptor layer)
        const storedToken =
          typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
        const stateToken = get().accessToken;
        const token = storedToken || stateToken;

        if (!token) {
          set({ isAuthenticated: false, user: null });
          return;
        }

        try {
          // Temporarily set the token so the axios interceptor picks it up
          if (typeof window !== 'undefined' && !storedToken && stateToken) {
            localStorage.setItem('accessToken', stateToken);
          }

          const response = await api.get('/auth/me');
          const user = response.data.data;

          set({
            user: { ...user, userId: user.id },
            accessToken: token,
            isAuthenticated: true,
          });

          try {
            if (initSocketFn) initSocketFn(token);
          } catch {}
        } catch (error: any) {
          // If 401, try to refresh
          if (error?.response?.status === 401) {
            const refreshToken =
              typeof window !== 'undefined'
                ? localStorage.getItem('refreshToken')
                : get().refreshToken;

            if (refreshToken) {
              try {
                const { default: axios } = await import('axios');
                const API_URL =
                  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
                const refreshRes = await axios.post(`${API_URL}/auth/refresh`, {
                  refreshToken,
                });
                const { accessToken: newToken } = refreshRes.data.data;

                if (typeof window !== 'undefined') {
                  localStorage.setItem('accessToken', newToken);
                }

                const meRes = await api.get('/auth/me', {
                  headers: { Authorization: `Bearer ${newToken}` },
                });
                const user = meRes.data.data;

                set({
                  user: { ...user, userId: user.id },
                  accessToken: newToken,
                  isAuthenticated: true,
                });
                return;
              } catch {}
            }
          }

          // All attempts failed — clear auth
          if (typeof window !== 'undefined') {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
          }
          set({
            isAuthenticated: false,
            user: null,
            accessToken: null,
            refreshToken: null,
          });
        }
      },

      refreshUser: async () => {
        try {
          const response = await api.get('/auth/me');
          const user = response.data.data;
          set({ user: { ...user, userId: user.id } });
        } catch {}
      },

      setUser: (user) => set({ user }),
    }),
    {
      name: 'cig-auth-storage',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? localStorage : (undefined as any)
      ),
      // Persist ALL auth fields so rehydration restores isAuthenticated
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
