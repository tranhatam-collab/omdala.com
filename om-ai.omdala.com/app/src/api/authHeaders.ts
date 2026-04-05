let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken() {
  return authToken;
}

export function withAuthHeaders(headers?: Record<string, string>) {
  if (authToken) {
    return { ...(headers ?? {}), Authorization: `Bearer ${authToken}` };
  }
  return headers ?? {};
}
