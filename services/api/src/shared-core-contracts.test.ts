import { describe, expect, it } from "vitest";
import app from "./index";

const env = {
  ENVIRONMENT: "test",
  MAGIC_LINK_SECRET: "test_magic_secret_for_shared_core_contracts",
};

async function createAccessToken(email = "team2@omdala.com") {
  const payload = {
    email,
    type: "access" as const,
    exp: Date.now() + 60 * 60 * 1000,
  };

  const payloadPart = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(env.MAGIC_LINK_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payloadPart),
  );
  const signaturePart = Buffer.from(new Uint8Array(signature)).toString(
    "base64url",
  );

  return `${payloadPart}.${signaturePart}`;
}

async function withBearerHeaders(email = "team2@omdala.com") {
  const token = await createAccessToken(email);
  return {
    authorization: `Bearer ${token}`,
  };
}

describe("v1 shared-core contracts", () => {
  it("returns workspaces for authenticated bearer session", async () => {
    const headers = await withBearerHeaders();
    const response = await app.request(
      "http://localhost/v1/workspaces",
      { headers },
      env,
    );

    expect(response.status).toBe(200);
    const json = (await response.json()) as {
      ok: boolean;
      data: {
        schemaVersion: string;
        workspaces: Array<{ id: string }>;
      };
    };

    expect(json.ok).toBe(true);
    expect(json.data.schemaVersion).toBe("2026-04-10");
    expect(Array.isArray(json.data.workspaces)).toBe(true);
    expect(json.data.workspaces.length).toBeGreaterThan(0);
  });

  it("creates a workspace and fetches it by id", async () => {
    const headers = await withBearerHeaders("team2.workspace@omdala.com");
    const createResponse = await app.request(
      "http://localhost/v1/workspaces",
      {
        method: "POST",
        headers: {
          ...headers,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          name: "Omniverse Operations",
          type: "organization",
          locale: "en",
        }),
      },
      env,
    );

    expect(createResponse.status).toBe(201);
    const createJson = (await createResponse.json()) as {
      ok: boolean;
      data: { workspace: { id: string; name: string } };
    };
    expect(createJson.ok).toBe(true);
    expect(createJson.data.workspace.name).toBe("Omniverse Operations");

    const workspaceId = createJson.data.workspace.id;
    const getResponse = await app.request(
      `http://localhost/v1/workspaces/${workspaceId}`,
      { headers },
      env,
    );

    expect(getResponse.status).toBe(200);
    const getJson = (await getResponse.json()) as {
      ok: boolean;
      data: { workspace: { id: string } };
    };
    expect(getJson.ok).toBe(true);
    expect(getJson.data.workspace.id).toBe(workspaceId);
  });

  it("marks a notification as read", async () => {
    const headers = await withBearerHeaders("team2.notify@omdala.com");
    const listResponse = await app.request(
      "http://localhost/v1/notifications",
      { headers },
      env,
    );

    expect(listResponse.status).toBe(200);
    const listJson = (await listResponse.json()) as {
      ok: boolean;
      data: {
        items: Array<{ id: string; readAt?: string }>;
      };
    };
    expect(listJson.ok).toBe(true);

    const unread = listJson.data.items.find((item) => !item.readAt);
    expect(unread).toBeDefined();

    const markReadResponse = await app.request(
      `http://localhost/v1/notifications/mark-read/${unread?.id}`,
      {
        method: "POST",
        headers,
      },
      env,
    );
    expect(markReadResponse.status).toBe(200);
    const markReadJson = (await markReadResponse.json()) as {
      ok: boolean;
      data: { notification: { readAt?: string } };
    };
    expect(markReadJson.ok).toBe(true);
    expect(markReadJson.data.notification.readAt).toBeTruthy();
  });

  it("tracks analytics event and exposes dashboard summary", async () => {
    const headers = await withBearerHeaders("team2.analytics@omdala.com");
    const trackResponse = await app.request(
      "http://localhost/v1/analytics/track",
      {
        method: "POST",
        headers: {
          ...headers,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          appId: "omniverse",
          eventName: "omniverse.device.state.changed",
          source: "api",
          properties: { state: "on", roomId: "room-1" },
        }),
      },
      env,
    );

    expect(trackResponse.status).toBe(201);
    const trackJson = (await trackResponse.json()) as {
      ok: boolean;
      data: { accepted: boolean; eventId: string };
    };
    expect(trackJson.ok).toBe(true);
    expect(trackJson.data.accepted).toBe(true);
    expect(trackJson.data.eventId).toBeTruthy();

    const dashboardResponse = await app.request(
      "http://localhost/v1/analytics/dashboard?app=omniverse",
      { headers },
      env,
    );
    expect(dashboardResponse.status).toBe(200);
    const dashboardJson = (await dashboardResponse.json()) as {
      ok: boolean;
      data: {
        summary: { totalEvents: number };
      };
    };
    expect(dashboardJson.ok).toBe(true);
    expect(dashboardJson.data.summary.totalEvents).toBeGreaterThan(0);
  });
});
