/**
 * Smoke tests for the Omniverse API client.
 * These tests mock fetch and verify the correct URLs + methods are called.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Set env so BASE_URL resolves correctly in test
process.env.NEXT_PUBLIC_API_URL = "http://localhost:8787";

// We import dynamically after setting env vars so the module picks them up.
const mockFetch = vi.fn();
global.fetch = mockFetch;

function mockOk(body: unknown) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => body,
  });
}

function mockError(status: number, message: string) {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    statusText: String(status),
    json: async () => ({ message }),
  });
}

describe("API client", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("login — calls POST /v2/omniverse/auth/login with credentials", async () => {
    const { login } = await import("@/lib/api");
    mockOk({ accessToken: "tok", user: { id: "1", email: "a@b.com" } });
    const result = await login("a@b.com", "pass");
    expect(result.accessToken).toBe("tok");
    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain("/v2/omniverse/auth/login");
    expect(opts.method).toBe("POST");
    expect(JSON.parse(opts.body)).toMatchObject({
      email: "a@b.com",
      password: "pass",
    });
  });

  it("login — throws on API error", async () => {
    const { login } = await import("@/lib/api");
    mockError(401, "Invalid credentials");
    await expect(login("a@b.com", "wrong")).rejects.toThrow(
      "Invalid credentials",
    );
  });

  it("getProperties — calls GET /v2/omniverse/properties with token", async () => {
    const { getProperties } = await import("@/lib/api");
    mockOk({ properties: [] });
    await getProperties("my-token", "user-1");
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain("/v2/omniverse/properties");
    expect(url).toContain("ownerUserId=user-1");
    expect(opts.headers["Authorization"]).toBe("Bearer my-token");
    expect(opts.method).toBe("GET");
  });

  it("getDevices — calls GET /v2/omniverse/workspaces/:id/devices", async () => {
    const { getDevices } = await import("@/lib/api");
    mockOk({
      devices: [{ id: "d1", name: "Light", type: "light", workspaceId: "ws1" }],
    });
    const result = await getDevices("tok", "ws1");
    expect(result.devices).toHaveLength(1);
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain("/workspaces/ws1/devices");
  });

  it("setDeviceState — calls PUT /v2/omniverse/workspaces/:id/devices/:id/state", async () => {
    const { setDeviceState } = await import("@/lib/api");
    mockOk({ state: { power: true, brightness: 80 } });
    const result = await setDeviceState("tok", "ws1", "dev1", {
      power: true,
      brightness: 80,
    });
    expect(result.state.power).toBe(true);
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain("/workspaces/ws1/devices/dev1/state");
    expect(opts.method).toBe("PUT");
  });

  it("activateScene — calls POST /v2/omniverse/workspaces/:id/scenes/:id/activate", async () => {
    const { activateScene } = await import("@/lib/api");
    mockOk({ success: true });
    await activateScene("tok", "ws1", "scene1");
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain("/workspaces/ws1/scenes/scene1/activate");
    expect(opts.method).toBe("POST");
  });

  it("runAutomation — calls POST /v2/omniverse/workspaces/:id/automations/:id/run", async () => {
    const { runAutomation } = await import("@/lib/api");
    mockOk({ success: true });
    await runAutomation("tok", "ws1", "auto1");
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain("/workspaces/ws1/automations/auto1/run");
    expect(opts.method).toBe("POST");
  });

  it("getEvents — calls GET /v2/omniverse/workspaces/:id/events", async () => {
    const { getEvents } = await import("@/lib/api");
    mockOk({ events: [] });
    await getEvents("tok", "ws1");
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain("/workspaces/ws1/events");
  });
});
