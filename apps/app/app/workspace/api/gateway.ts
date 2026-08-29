// ─── AI Gateway API Client — aiagent.iai.one ──────────────────────────────

const DEFAULT_TIMEOUT = 15000;
const MAX_RETRIES = 2;

export interface GatewayAccount {
  email: string;
  token: string;
  plan: "free" | "pro" | "enterprise";
  apiGatewayUrl: string;
  expiresAt: number;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload extends LoginPayload {
  confirmPassword?: string;
}

export interface GatewayResponse {
  success: boolean;
  account?: GatewayAccount;
  error?: string;
}

class GatewayError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "GatewayError";
  }
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout = DEFAULT_TIMEOUT,
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

async function request(
  url: string,
  payload: unknown,
  retries = MAX_RETRIES,
): Promise<GatewayResponse> {
  let lastError: Error | undefined;

  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetchWithTimeout(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "Unknown error");
        throw new GatewayError(`HTTP ${res.status}: ${text}`, res.status);
      }

      const data = await res.json().catch(() => null);
      if (!data) {
        throw new GatewayError("Invalid JSON response");
      }

      if (data.error) {
        throw new GatewayError(data.error);
      }

      const accountPayload = payload as {
        apiGatewayUrl?: string;
        email?: string;
      };

      return {
        success: true,
        account: {
          email: data.email || accountPayload.email || "",
          token: data.token || data.accessToken || "",
          plan: data.plan || "free",
          apiGatewayUrl: data.apiGatewayUrl || accountPayload.apiGatewayUrl || "",
          expiresAt: data.expiresAt || Date.now() + 30 * 86400000,
        },
      };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (i < retries) {
        await new Promise((r) => setTimeout(r, 500 * (i + 1)));
      }
    }
  }

  return {
    success: false,
    error: lastError?.message || "Network error",
  };
}

export async function loginToGateway(
  baseUrl: string,
  payload: LoginPayload,
): Promise<GatewayResponse> {
  const url = `${baseUrl.replace(/\/$/, "")}/auth/login`;
  return request(url, payload);
}

export async function registerOnGateway(
  baseUrl: string,
  payload: RegisterPayload,
): Promise<GatewayResponse> {
  const url = `${baseUrl.replace(/\/$/, "")}/auth/register`;
  return request(url, payload);
}

export async function verifyGatewayToken(
  baseUrl: string,
  token: string,
): Promise<GatewayResponse> {
  try {
    const url = `${baseUrl.replace(/\/$/, "")}/auth/verify`;
    const res = await fetchWithTimeout(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });

    if (!res.ok) {
      return { success: false, error: `Token invalid (HTTP ${res.status})` };
    }

    const data = await res.json().catch(() => null);
    if (!data) return { success: false, error: "Invalid verify response" };

    return {
      success: true,
      account: {
        email: data.email || "",
        token,
        plan: data.plan || "free",
        apiGatewayUrl: baseUrl,
        expiresAt: data.expiresAt || Date.now() + 30 * 86400000,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Verify failed",
    };
  }
}
