import { describe, expect, it, vi } from "vitest";
import app from "./index";

const env = {
  ENVIRONMENT: "test",
  GOOGLE_CLIENT_ID: "test_client_id.apps.googleusercontent.com",
  GOOGLE_CLIENT_SECRET: "test_client_secret",
  GOOGLE_REDIRECT_URI: "http://localhost:8787/v1/auth/google/callback",
  GOOGLE_OAUTH_STATE_SECRET: "test_state_secret_32bytes_long_string",
  MAGIC_LINK_SECRET: "test_magic_secret_for_oauth_tests",
  APP_BASE_URL: "https://app.omdala.com",
};

describe("v1/auth/google OAuth flow", () => {
  it("GET /v1/auth/google/start returns 302 redirect to Google", async () => {
    const response = await app.request(
      "http://localhost/v1/auth/google/start",
      {},
      env,
    );

    expect(response.status).toBe(302);
    const location = response.headers.get("Location");
    expect(location).toBeTruthy();
    expect(location).toMatch(/^https:\/\/accounts\.google\.com/);
    expect(location).toContain("client_id=test_client_id");
    expect(location).toContain("state=");
  });

  it("GET /v1/auth/google/callback — happy path creates session and redirects", async () => {
    // 1. Obtain a valid state from the start endpoint
    const startResponse = await app.request(
      "http://localhost/v1/auth/google/start",
      {},
      env,
    );
    expect(startResponse.status).toBe(302);
    const startLocation = startResponse.headers.get("Location")!;
    const state = new URL(startLocation).searchParams.get("state")!;
    expect(state).toBeTruthy();

    // 2. Mock Google token + userinfo endpoints
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(
      async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("oauth2.googleapis.com/token")) {
          return new Response(
            JSON.stringify({ access_token: "mock_access_token", token_type: "Bearer" }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        }
        if (url.includes("openidconnect.googleapis.com/v1/userinfo")) {
          return new Response(
            JSON.stringify({
              email: "oauth.happy@omdala.com",
              email_verified: true,
              name: "OAuth Happy",
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        }
        return new Response("Not mocked", { status: 501 });
      },
    );

    try {
      const callbackResponse = await app.request(
        `http://localhost/v1/auth/google/callback?code=mock_auth_code&state=${encodeURIComponent(state)}`,
        {},
        env,
      );

      expect(callbackResponse.status).toBe(302);
      const location = callbackResponse.headers.get("Location");
      expect(location).toBe("https://app.omdala.com/");

      // Verify session cookies are set
      const setCookie = callbackResponse.headers.get("Set-Cookie") || "";
      expect(setCookie).toContain("omdala_access_token=");
      expect(setCookie).toContain("omdala_refresh_token=");
      expect(setCookie).toContain("HttpOnly");
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it("GET /v1/auth/google/callback — invalid state returns 302 with invalid_oauth_state", async () => {
    const response = await app.request(
      "http://localhost/v1/auth/google/callback?code=mock_code&state=invalid_state_value",
      {},
      env,
    );

    expect(response.status).toBe(302);
    const location = response.headers.get("Location");
    expect(location).toContain("error=invalid_oauth_state");
  });

  it("GET /v1/auth/google/callback — unverified email returns 302 with oauth_email_unverified", async () => {
    // 1. Obtain a valid state
    const startResponse = await app.request(
      "http://localhost/v1/auth/google/start",
      {},
      env,
    );
    expect(startResponse.status).toBe(302);
    const startLocation = startResponse.headers.get("Location")!;
    const state = new URL(startLocation).searchParams.get("state")!;

    // 2. Mock Google endpoints: token OK, but email unverified
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(
      async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("oauth2.googleapis.com/token")) {
          return new Response(
            JSON.stringify({ access_token: "mock_access_token", token_type: "Bearer" }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        }
        if (url.includes("openidconnect.googleapis.com/v1/userinfo")) {
          return new Response(
            JSON.stringify({
              email: "unverified@omdala.com",
              email_verified: false,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        }
        return new Response("Not mocked", { status: 501 });
      },
    );

    try {
      const response = await app.request(
        `http://localhost/v1/auth/google/callback?code=mock_auth_code&state=${encodeURIComponent(state)}`,
        {},
        env,
      );

      expect(response.status).toBe(302);
      const location = response.headers.get("Location");
      expect(location).toContain("error=oauth_email_unverified");
    } finally {
      fetchSpy.mockRestore();
    }
  });
});
