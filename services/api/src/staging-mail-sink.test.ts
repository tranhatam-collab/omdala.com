import http from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import app from "./index";

// A real HTTP stub plays the mail provider on loopback. The API under test makes
// genuine fetch calls to it, so what the stub records is exactly what would
// have left the Worker. Nothing reaches a real provider.

type Received = { path: string; auth: string | undefined; workspaceHeader: string | undefined; body: Record<string, unknown> };
let received: Received[] = [];
let respond: (req: http.IncomingMessage, res: http.ServerResponse) => void;
let server: http.Server;
let baseUrl = "";

const SINK = "staging-sink@omdala.com";
const okResponder: typeof respond = (_req, res) => {
  res.writeHead(202, { "content-type": "application/json", "x-message-id": `stub-${received.length}` });
  res.end('{"status":"queued"}');
};

beforeAll(async () => {
  server = http.createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      received.push({
        path: req.url ?? "",
        auth: req.headers.authorization,
        workspaceHeader: req.headers["x-workspace-id"] as string | undefined,
        body: JSON.parse(Buffer.concat(chunks).toString() || "{}"),
      });
      respond(req, res);
    });
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(() => new Promise<void>((r) => server.close(() => r())));
beforeEach(() => {
  received = [];
  respond = okResponder;
});

const stagingEnv = (extra: Record<string, string | undefined> = {}) => ({
  ENVIRONMENT: "staging",
  MAGIC_LINK_SECRET: "test_staging_sink_secret_at_least_32_chars",
  MAIL_API_KEY: "stub-key-not-a-secret",
  MAIL_API_URL: baseUrl,
  MAIL_API_WORKSPACE_ID: "omdala.com-staging",
  MAIL_DELIVERY_MODE: "sink",
  MAIL_STAGING_SINK_ADDRESS: SINK,
  ...extra,
});

// Late sibling requests from an earlier test must never be counted, so every test
// looks only at mails that carry its own unique token in the free-text fields.
const mailsFor = (token: string) =>
  received.filter((mail) => JSON.stringify(mail.body).includes(token));

let n = 0;
const submit = (kind: "contact" | "access", env: object, extraBody: object = {}) => {
  n += 1;
  const submitter = `person-${n}@example.org`;
  const token = `tok${n}x${Math.random().toString(36).slice(2, 8)}`;
  const path = kind === "contact" ? "/v1/contact" : "/v1/auth/access-request";
  const body =
    kind === "contact"
      ? { name: `Person ${token}`, email: submitter, message: `hello ${token}`, ...extraBody }
      : { email: submitter, role: `owner ${token}`, nodeName: `Node ${token}`, ...extraBody };
  return {
    submitter,
    token,
    response: app.request(
      `http://localhost${path}`,
      {
        method: "POST",
        headers: { "content-type": "application/json", "x-forwarded-for": `203.0.113.${n}` },
        body: JSON.stringify(body),
      },
      env,
    ),
  };
};

describe.each(["contact", "access"] as const)("%s endpoint with the staging sink policy", (kind) => {
  it("hands the provider only the sink address in the isolated workspace", async () => {
    const { submitter, token, response } = submit(kind, stagingEnv());
    const res = await response;
    expect(res.status).toBe(kind === "contact" ? 200 : 201);
    const mails = mailsFor(token);
    expect(mails).toHaveLength(2); // internal notice + acknowledgement
    for (const mail of mails) {
      expect(mail.path).toBe("/emails");
      expect(mail.auth).toBe("Bearer stub-key-not-a-secret");
      expect(mail.workspaceHeader).toBe("omdala.com-staging");
      expect(mail.body.to).toBe(SINK);
      expect(mail.body.workspace_id).toBe("omdala.com-staging");
      expect(JSON.stringify(mail.body.to)).not.toContain(submitter);
    }
  });

  it("returns a sink receipt for every mail and not the raw recipient hash input", async () => {
    const { response } = submit(kind, stagingEnv());
    const body = (await (await response).json()) as { data: { deliveryReceipts: Array<Record<string, unknown>> } };
    expect(body.data.deliveryReceipts).toHaveLength(2);
    const expectedHash = Buffer.from(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(SINK)),
    ).toString("hex");
    for (const receipt of body.data.deliveryReceipts) {
      expect(receipt).toMatchObject({
        transport: "mail-api",
        deliveryMode: "sink",
        sinkEnforced: true,
        workspaceId: "omdala.com-staging",
        deliveredRecipientCount: 1,
        recipientSetSha256: expectedHash,
      });
      expect(String(receipt.providerMessageId)).toMatch(/^stub-/);
    }
  });

  it("ignores recipient and workspace overrides in the request body", async () => {
    const { token, response } = submit(kind, stagingEnv(), {
      to: "victim@example.org",
      cc: ["victim@example.org"],
      workspace_id: "omdala.com",
      MAIL_STAGING_SINK_ADDRESS: "victim@example.org",
    });
    expect((await response).status).toBeLessThan(300);
    const mails = mailsFor(token);
    expect(mails.length).toBeGreaterThan(0);
    for (const mail of mails) {
      expect(mail.body.to).toBe(SINK);
      expect(mail.body.workspace_id).toBe("omdala.com-staging");
      expect(JSON.stringify(mail.body)).not.toContain("victim@example.org");
    }
  });

  it.each([
    ["no sink configured", { MAIL_STAGING_SINK_ADDRESS: undefined }],
    ["an invalid sink address", { MAIL_STAGING_SINK_ADDRESS: "not-an-address" }],
    ["direct delivery mode", { MAIL_DELIVERY_MODE: "direct" }],
    ["the production workspace", { MAIL_API_WORKSPACE_ID: "omdala.com" }],
    ["no workspace", { MAIL_API_WORKSPACE_ID: undefined }],
  ])("sends nothing and answers 502 with %s", async (_label, override) => {
    const { token, response } = submit(kind, stagingEnv(override));
    const res = await response;
    expect(res.status).toBe(502);
    expect(((await res.json()) as { ok: boolean }).ok).toBe(false);
    expect(mailsFor(token)).toHaveLength(0);
  });

  it("does not report success when the provider returns no message id", async () => {
    respond = (_req, res) => {
      res.writeHead(202, { "content-type": "application/json" });
      res.end("{}");
    };
    const res = await submit(kind, stagingEnv()).response;
    expect(res.status).toBe(502);
    const body = (await res.json()) as { ok: boolean; data?: unknown };
    expect(body.ok).toBe(false);
    expect(body.data).toBeUndefined();
  });

  it("does not report success when the provider rejects the mail", async () => {
    respond = (_req, res) => {
      res.writeHead(403, { "content-type": "application/json" });
      res.end('{"error":"workspace denied"}');
    };
    const res = await submit(kind, stagingEnv()).response;
    expect(res.status).toBe(502);
    expect(((await res.json()) as { ok: boolean }).ok).toBe(false);
  });
});
