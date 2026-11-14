import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { api } from '../api/client';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (data: { email: string; password: string; full_name: string; role?: string; organization?: string }) => Promise<void>;
  launchDemo: () => Promise<void>;
  logout: () => void;
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('aegisflow_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('aegisflow_token');
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await api.auth.getMe();
          setUser(res.user);
          localStorage.setItem('aegisflow_user', JSON.stringify(res.user));
        } catch {
          // Keep existing cached user or logout if token expired
        }
      } else {
        // Automatically launch demo user for seamless zero-barrier experience
        try {
          const res = await api.auth.demo();
          setUser(res.user);
          setToken(res.token);
          localStorage.setItem('aegisflow_user', JSON.stringify(res.user));
          localStorage.setItem('aegisflow_token', res.token);
        } catch (err) {
          console.warn('Initial demo bootstrap offline', err);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await api.auth.login(email, pass);
    setUser(res.user);
    setToken(res.token);
    localStorage.setItem('aegisflow_user', JSON.stringify(res.user));
    localStorage.setItem('aegisflow_token', res.token);
    await api.seed.bootstrap();
  };

  const register = async (data: { email: string; password: string; full_name: string; role?: string; organization?: string }) => {
    const res = await api.auth.register(data);
    setUser(res.user);
    setToken(res.token);
    localStorage.setItem('aegisflow_user', JSON.stringify(res.user));
    localStorage.setItem('aegisflow_token', res.token);
    await api.seed.bootstrap();
  };

  const launchDemo = async () => {
    const res = await api.auth.demo();
    setUser(res.user);
    setToken(res.token);
    localStorage.setItem('aegisflow_user', JSON.stringify(res.user));
    localStorage.setItem('aegisflow_token', res.token);
    await api.seed.bootstrap();
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('aegisflow_user');
    localStorage.removeItem('aegisflow_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, launchDemo, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
