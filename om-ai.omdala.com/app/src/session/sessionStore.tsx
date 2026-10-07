import { createContext, useContext, useMemo } from 'react';

type SessionState = {
  authenticated: boolean;
  status: 'canonical_session_bridge_unavailable';
  reason: string;
};

type SessionContextValue = {
  session: SessionState;
  logout: () => Promise<void>;
  hydrated: boolean;
};

const SessionContext = createContext<SessionContextValue | undefined>(undefined);
export const NATIVE_SESSION_BRIDGE_ERROR = 'canonical_session_bridge_unavailable';
export const NATIVE_SESSION_BRIDGE_REASON =
  'Protected native access is disabled until OMDALA provides a verified platform session bridge.';

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo(
    () => ({
      session: {
        authenticated: false,
        status: NATIVE_SESSION_BRIDGE_ERROR,
        reason: NATIVE_SESSION_BRIDGE_REASON,
      } as SessionState,
      logout: async () => {},
      hydrated: true,
    }),
    [],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession must be used within SessionProvider');
  return context;
}
