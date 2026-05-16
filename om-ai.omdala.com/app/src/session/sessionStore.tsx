import { createContext, useContext, useMemo, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { setAuthToken } from '../api/authHeaders';
import { logoutSession, refreshSession } from '../api/auth';

type SessionState = {
  token: string | null;
  refreshToken: string | null;
  expiresAt: string | null;
};

type SessionContextValue = {
  session: SessionState;
  setToken: (token: string | null) => Promise<void>;
  setSession: (accessToken: string, refreshToken?: string, expiresAt?: string) => Promise<void>;
  refreshNow: () => Promise<boolean>;
  logout: () => Promise<void>;
  hydrated: boolean;
};

const SessionContext = createContext<SessionContextValue | undefined>(undefined);
const TOKEN_KEY = 'session_token';
const REFRESH_TOKEN_KEY = 'session_refresh_token';
const EXPIRES_AT_KEY = 'session_expires_at';

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      const stored = await SecureStore.getItemAsync(TOKEN_KEY);
      const storedRefresh = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      const storedExpiresAt = await SecureStore.getItemAsync(EXPIRES_AT_KEY);
      if (!active) return;
      setToken(stored ?? null);
      setRefreshToken(storedRefresh ?? null);
      setExpiresAt(storedExpiresAt ?? null);
      setAuthToken(stored ?? null);
      setHydrated(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  const updateToken = async (next: string | null) => {
    setToken(next);
    setAuthToken(next);
    if (next) {
      await SecureStore.setItemAsync(TOKEN_KEY, next);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  };

  const setSession = async (accessToken: string, nextRefreshToken?: string, nextExpiresAt?: string) => {
    await updateToken(accessToken);
    const rt = nextRefreshToken ?? null;
    const exp = nextExpiresAt ?? null;
    setRefreshToken(rt);
    setExpiresAt(exp);
    if (rt) {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, rt);
    } else {
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    }
    if (exp) {
      await SecureStore.setItemAsync(EXPIRES_AT_KEY, exp);
    } else {
      await SecureStore.deleteItemAsync(EXPIRES_AT_KEY);
    }
  };

  const clearSession = async () => {
    await updateToken(null);
    setRefreshToken(null);
    setExpiresAt(null);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(EXPIRES_AT_KEY);
  };

  const refreshNow = async () => {
    if (!refreshToken) return false;
    const refreshed = await refreshSession(refreshToken);
    if (refreshed.error || !refreshed.value) {
      await clearSession();
      return false;
    }
    await setSession(
      refreshed.value.access_token,
      refreshed.value.refresh_token ?? refreshToken,
      refreshed.value.expires_at ?? expiresAt ?? undefined,
    );
    return true;
  };

  const logout = async () => {
    await logoutSession();
    await clearSession();
  };

  useEffect(() => {
    if (!hydrated) return;
    const timer = setInterval(() => {
      if (!refreshToken || !expiresAt) return;
      const ms = new Date(expiresAt).getTime() - Date.now();
      if (Number.isFinite(ms) && ms <= 5 * 60 * 1000) {
        void refreshNow();
      }
    }, 60_000);
    return () => clearInterval(timer);
  }, [hydrated, refreshToken, expiresAt]);

  const value = useMemo(
    () => ({ session: { token, refreshToken, expiresAt }, setToken: updateToken, setSession, refreshNow, logout, hydrated }),
    [token, refreshToken, expiresAt, hydrated],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession must be used within SessionProvider');
  return context;
}
