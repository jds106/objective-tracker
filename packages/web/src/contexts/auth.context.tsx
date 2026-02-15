import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { User } from '@objective-tracker/shared';
import { apiClient } from '../services/api-client.js';
import * as authApi from '../services/auth.api.js';
import type { RegisterFormData } from '../services/auth.api.js';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterFormData) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) {
      apiClient.setToken(token);
      authApi.getMe()
        .then(({ data }) => setUser(data))
        .catch(() => {
          setToken(null);
          localStorage.removeItem('token');
          apiClient.setToken(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await authApi.login(email, password);
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('token', data.token);
    apiClient.setToken(data.token);
  }, []);

  const register = useCallback(async (input: RegisterFormData) => {
    const { data } = await authApi.register(input);
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('token', data.token);
    apiClient.setToken(data.token);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Best effort
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    apiClient.setToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin',
      isLoading,
      login,
      register,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
