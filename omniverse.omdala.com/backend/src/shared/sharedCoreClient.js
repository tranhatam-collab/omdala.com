import { HttpError } from "../core/errors.js";

function normalizeUser(data) {
  const raw = data?.user || data;
  if (!raw?.id || !raw?.email) {
    throw new HttpError(
      502,
      "AUTH_INVALID_RESPONSE",
      "Invalid shared-core user payload",
    );
  }

  return {
    id: String(raw.id),
    email: String(raw.email),
    displayName: String(raw.displayName || raw.name || raw.email),
  };
}

function buildHttpClient({
  baseUrl = "https://api.omdala.com",
  fetchImpl = fetch,
} = {}) {
  async function call(pathname, { method = "GET", token, body } = {}) {
    const response = await fetchImpl(`${baseUrl}${pathname}`, {
      method,
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    let payload = null;
    try {
      payload = await response.json();
    } catch {
      throw new HttpError(
        502,
        "SHARED_CORE_INVALID_JSON",
        "Shared-core returned invalid JSON",
      );
    }

    if (!response.ok || payload?.ok === false) {
      const code = payload?.error?.code || "SHARED_CORE_REQUEST_FAILED";
      const message =
        payload?.error?.message || `Shared-core request failed for ${pathname}`;
      const status =
        response.status >= 400 && response.status < 600 ? response.status : 502;
      throw new HttpError(status, code, message);
    }

    return payload?.data ?? payload;
  }

  return {
    call,
  };
}

export function createSharedCoreClient(options = {}) {
  const httpClient = buildHttpClient(options);

  return {
    async login({ email, password }) {
      const authData = await httpClient.call("/v1/auth/login", {
        method: "POST",
        body: { email, password },
      });

      const sharedSessionToken =
        authData?.accessToken ||
        authData?.jwt ||
        authData?.token ||
        authData?.sessionToken;

      if (!sharedSessionToken) {
        throw new HttpError(
          502,
          "AUTH_MISSING_TOKEN",
          "Shared-core auth did not return a token",
        );
      }

      const sessionData = await httpClient.call("/v1/auth/session", {
        token: sharedSessionToken,
      });
      const profileData = await httpClient.call("/v1/account/profile", {
        token: sharedSessionToken,
      });

      const user = normalizeUser(
        profileData?.user
          ? profileData
          : sessionData?.user
            ? sessionData
            : authData,
      );

      return {
        user,
        sharedSessionToken,
        accountProfile: profileData,
      };
    },

    async getSession(token) {
      if (!token) {
        throw new HttpError(
          401,
          "AUTH_INVALID_SESSION",
          "Missing shared-core session token",
        );
      }

      const sessionData = await httpClient.call("/v1/auth/session", { token });

      return {
        user: normalizeUser(sessionData),
      };
    },

    async getAccountProfile(token) {
      if (!token) {
        throw new HttpError(
          401,
          "AUTH_INVALID_SESSION",
          "Missing shared-core session token",
        );
      }

      return httpClient.call("/v1/account/profile", { token });
    },

    async listWorkspaces(token) {
      if (!token) {
        throw new HttpError(
          401,
          "AUTH_INVALID_SESSION",
          "Missing shared-core session token",
        );
      }

      const data = await httpClient.call("/v1/workspaces", { token });
      return Array.isArray(data) ? data : (data?.workspaces ?? []);
    },

    async getWorkspace(token, workspaceId) {
      if (!token) {
        throw new HttpError(
          401,
          "AUTH_INVALID_SESSION",
          "Missing shared-core session token",
        );
      }

      return httpClient.call(
        `/v1/workspaces/${encodeURIComponent(workspaceId)}`,
        {
          token,
        },
      );
    },

    async hasWorkspaceMembership(token, { workspaceId, userId }) {
      if (!token) {
        return false;
      }

      try {
        const workspaces = await this.listWorkspaces(token);
        return workspaces.some(
          (ws) =>
            (ws.id === workspaceId || ws.workspaceId === workspaceId) &&
            ws.members?.some((m) => m.userId === userId || m.id === userId),
        );
      } catch {
        return false;
      }
    },
  };
}
