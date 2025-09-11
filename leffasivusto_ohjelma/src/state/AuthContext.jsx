// src/state/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as authController from '../controllers/authController';
import { getToken, setToken, clearToken } from '../services/token';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // AINA sivun latauksessa: yritä uusia access-token (refresh-cookie kulkee automaattisesti).
  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        console.log('[Auth] bootstrap → /auth/refresh');
        const refreshed = await authController.refresh?.();
        if (refreshed?.accessToken) {
          setToken(refreshed.accessToken);
          console.log('[Auth] refreshed access OK');
        } else {
          console.log('[Auth] refresh returned no token');
        }
      } catch (e) {
        console.log('[Auth] refresh failed', e?.response?.status);
        clearToken();
      }

      // Hae käyttäjä uudella/olemassa olevalla accessilla
      try {
        const me = await authController.me();
        if (!cancelled) setUser(me?.user || null);
      } catch {
        clearToken();
        if (!cancelled) setUser(null);
      }
    };

    bootstrap();
    return () => { cancelled = true; };
  }, []);

  const login = async (email, password) => {
    setLoading(true); setError(null);
    try {
      const { accessToken, user } = await authController.login(email, password);
      if (!accessToken) throw new Error('Token puuttuu palvelimen vastauksesta');
      setUser(user || null);
      setAuthOpen(false);
      return { ok: true };
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Kirjautuminen epäonnistui');
      return { ok: false, error: e };
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password) => {
    setLoading(true); setError(null);
    try {
      const { accessToken, user } = await authController.register(email, password);
      if (!accessToken) throw new Error('Token puuttuu palvelimen vastauksesta');
      setUser(user || null);
      setAuthOpen(false);
      return { ok: true };
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Rekisteröityminen epäonnistui');
      return { ok: false, error: e };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try { await authController.logout(); } finally {
      clearToken();
      setUser(null);
    }
  };

  const value = useMemo(() => ({
    user,
    isAuthenticated: !!user && !!getToken(),
    login, register, logout,
    authOpen, setAuthOpen,
    loading, error
  }), [user, authOpen, loading, error]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
