import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as authController from '../controllers/authController';
import { getToken, setToken, clearToken } from '../services/token';
import api from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // ref, jotta interseptori voi kutsua aina tuoretta setUseria
  const setUserRef = useRef(setUser);
  setUserRef.current = setUser;

  // Käynnistyksessä: yritä uusia token & hae käyttäjä
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const refreshed = await authController.refresh?.();
        if (refreshed?.accessToken) setToken(refreshed.accessToken);
      } catch {
        clearToken();
      }
      try {
        const me = await authController.me();
        if (!cancelled) setUser(me?.user || null);
      } catch {
        clearToken();
        if (!cancelled) setUser(null);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Vastainterseptori: nollaa vain jos 401 + Bearer-otsikko (= vanhentunut/virheellinen token)
  useEffect(() => {
    const respInterceptor = api.interceptors.response.use(
      (res) => res,
      (err) => {
        const status = err?.response?.status;
        const cfg = err?.config || {};
        const url = (cfg.baseURL || '') + (cfg.url || '');
        const authHeader = cfg.headers?.Authorization || cfg.headers?.authorization;

        // Huom! Ei kosketa 403:iin (resurssikohtainen kieltovirhe).
        // Nollataan vain, jos pyyntö lähti meidän API:lle ja siinä oli Bearer-token.
        const hasBearer = typeof authHeader === 'string' && authHeader.toLowerCase().startsWith('bearer ');
        const isOurApi = true; // api-instanssia käytetään teillä backendille — riittää tämä ehto

        if (status === 401 && hasBearer && isOurApi) {
          try { clearToken(); } catch {}
          setUserRef.current?.(null);
        }
        return Promise.reject(err);
      }
    );
    return () => api.interceptors.response.eject(respInterceptor);
  }, []);

  const normalizeError = (e) => {
    const msg = e?.response?.data?.error || e?.response?.data?.message || e?.message || '';
    if (/sähköposti.*käytössä/i.test(msg)) return 'Email is already in use.';
    if (/virheellinen.*sähköposti|salasana/i.test(msg)) return 'Invalid email or password.';
    if (/invalid refresh/i.test(msg)) return 'Session expired. Please sign in again.';
    return 'Something went wrong. Please try again.';
  };

  const login = async (email, password) => {
    setLoading(true); setError(null); setSuccess(null);
    try {
      const { accessToken, user } = await authController.login(email, password);
      if (!accessToken) throw new Error('Token missing from server response');
      setToken(accessToken);
      setUser(user || null);
      setAuthOpen(false);
      return { ok: true };
    } catch (e) {
      setError(normalizeError(e) || 'Invalid email or password.');
      return { ok: false };
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password) => {
    setLoading(true); setError(null); setSuccess(null);
    try {
      const { accessToken, user } = await authController.register(email, password);
      if (!accessToken) throw new Error('Token missing from server response');
      setToken(accessToken);
      setUser(user || null);
      setSuccess('Registration successful.');
      return { ok: true };
    } catch (e) {
      setError(normalizeError(e));
      return { ok: false };
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
    loading, error, success, setSuccess, setError
  }), [user, authOpen, loading, error, success]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
