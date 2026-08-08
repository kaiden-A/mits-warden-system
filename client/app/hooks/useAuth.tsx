'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { apiGet, apiPost } from '@/app/lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  is_admin: boolean;
  hostel: string | null;
  status: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isWarden: boolean;
}

const defaultLogin = async (_email: string, _password: string): Promise<User> => {
  throw new Error('not ready');
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: defaultLogin,
  logout: async () => {},
  isAdmin: false,
  isWarden: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet('/api/auth/me')
      .then(u => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiPost('/api/auth/login', { email, password });
    const u = await apiGet('/api/auth/me');
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    try { await apiPost('/api/auth/logout'); } catch {}
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      isAdmin: user?.role === 'admin' || user?.is_admin === true,
      isWarden: user?.role === 'warden',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
