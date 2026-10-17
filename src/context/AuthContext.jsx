import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, clearToken, getToken, setToken } from '../lib/api';

const AuthContext = createContext(null);

/**
 * Holds the authenticated user (which carries its petshop/tenant) and exposes
 * login / register / logout. The JWT is persisted in localStorage and replayed
 * on reload via the /api/auth/me endpoint.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // 'loading' | 'authenticated' | 'anonymous'
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      if (!getToken()) {
        setStatus('anonymous');
        return;
      }
      try {
        const profile = await api.me();
        if (!active) {
          return;
        }
        setUser(profile);
        setStatus('authenticated');
      } catch {
        clearToken();
        if (!active) {
          return;
        }
        setUser(null);
        setStatus('anonymous');
      }
    }

    bootstrap();
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const result = await api.login(email, password);
    setToken(result.accessToken);
    setUser(result.user);
    setStatus('authenticated');
    return result.user;
  }, []);

  const register = useCallback(async (payload) => {
    const result = await api.register(payload);
    setToken(result.accessToken);
    setUser(result.user);
    setStatus('authenticated');
    return result.user;
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    setStatus('anonymous');
  }, []);

  const value = useMemo(
    () => ({ user, status, isAuthenticated: status === 'authenticated', login, register, logout }),
    [user, status, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth precisa ser usado dentro de <AuthProvider>.');
  }
  return context;
}
