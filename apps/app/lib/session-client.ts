export type ClientSession = {
  email: string;
  expiresAt: string;
  issuedAt: string;
};

const SESSION_KEY = "omdala_app_session_v1";

function nowIso() {
  return new Date().toISOString();
}

export function persistClientSession(email: string, expiresAt: string) {
  if (typeof window === "undefined") {
    return;
  }

  const payload: ClientSession = {
    email,
    expiresAt,
    issuedAt: nowIso(),
  };
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
}

export function clearClientSession() {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(SESSION_KEY);
}

export function getClientSession(): ClientSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ClientSession>;
    if (!parsed.email || !parsed.expiresAt || !parsed.issuedAt) {
      return null;
    }
    return {
      email: parsed.email,
      expiresAt: parsed.expiresAt,
      issuedAt: parsed.issuedAt,
    };
  } catch {
    return null;
  }
}

export function hasValidClientSession() {
  const session = getClientSession();
  if (!session) {
    return false;
  }

  return new Date(session.expiresAt).getTime() > Date.now();
}
