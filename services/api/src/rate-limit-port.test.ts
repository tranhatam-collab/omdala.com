// WO-T2-27: the limiter sits behind one function. With a configured database (outside test and
// development) the window is counted in PostgreSQL so every isolate shares it; otherwise, and
// when the shared store fails, the per-isolate limiter answers.
// PREP_UNDER_ASSUMPTION(CTL-03, PostgreSQL via Hyperdrive for the main API)
import { beforeEach, describe, expect, it, vi } from "vitest";

const shared = vi.hoisted(() => ({
  counts: new Map<string, number>(),
  calls: [] as { key: string; limit: number; windowSeconds: number }[],
  fail: false,
}));
vi.mock("./db/rate-limit-repository", () => ({
  hitRateLimit: vi.fn(async (_env: unknown, input: { key: string; limit: number; windowSeconds: number }) => {
    shared.calls.push(input);
    if (shared.fail) throw new Error("connection refused");
    const next = (shared.counts.get(input.key) ?? 0) + 1;
    if (next > input.limit) return true;
    shared.counts.set(input.key, next);
    return false;
  }),
  purgeRateLimitWindows: vi.fn(async () => undefined),
}));

const base = { MAGIC_LINK_SECRET: "test_rate_limit_port_secret_0123456789" };
const shared_env = { ...base, ENVIRONMENT: "production", DATABASE_URL: "postgres://example.local/db" };

// A fresh module graph = a fresh Worker isolate with its own in-memory limiter.
async function isolate() {
  vi.resetModules();
  return (await import("./index")).default;
}
const contact = (app: { request: (...args: never[]) => Promise<Response> | Response }, i: number, ip = "198.51.100.7", env: Record<string, unknown> = shared_env) =>
  (app as unknown as { request: (u: string, init: RequestInit, env: unknown) => Promise<Response> }).request(
    "http://localhost/v1/contact",
    {
      method: "POST",
      headers: { "content-type": "application/json", "cf-connecting-ip": ip },
      body: JSON.stringify({ name: "", email: `user${i}@example.test`, message: "" }), // invalid: 422 when allowed
    },
    env,
  );

beforeEach(() => {
  shared.counts.clear();
  shared.calls.length = 0;
  shared.fail = false;
});

describe("shared limiter across isolates", () => {
  it("never lets two isolates exceed the limit between them", async () => {
    const a = await isolate();
    const b = await isolate();
    const statuses: number[] = [];
    for (let i = 0; i < 12; i++) statuses.push((await contact(i % 2 ? a : b, i)).status);
    expect(statuses.filter((s) => s === 422)).toHaveLength(10); // limit is 10 per IP, split over both isolates
    expect(statuses.filter((s) => s === 429)).toHaveLength(2);
  });

  it("a per-isolate limiter alone would have allowed twice as many (the defect this fixes)", async () => {
    const a = await isolate();
    const b = await isolate();
    const dev = { ...base, ENVIRONMENT: "development" };
    const statuses: number[] = [];
    for (let i = 0; i < 20; i++) statuses.push((await contact(i % 2 ? a : b, i, "198.51.100.8", dev)).status);
    expect(statuses.filter((s) => s === 429)).toHaveLength(0);
    expect(shared.calls).toHaveLength(0);
  });

  it("passes the key, limit and whole-second window to the store", async () => {
    const a = await isolate();
    await contact(a, 1);
    expect(shared.calls).toContainEqual({ key: "contact:ip:198.51.100.7", limit: 10, windowSeconds: 900 });
    expect(shared.calls).toContainEqual({ key: "contact:email:user1@example.test", limit: 5, windowSeconds: 900 });
  });

  it("keeps clients apart", async () => {
    const a = await isolate();
    for (let i = 0; i < 10; i++) await contact(a, i);
    expect((await contact(a, 99)).status).toBe(429);
    expect((await contact(a, 100, "198.51.100.9")).status).toBe(422);
  });
});

describe("environments and failure", () => {
  it.each(["test", "development"])("%s never touches the shared store", async (environment) => {
    const a = await isolate();
    await contact(a, 1, "198.51.100.10", { ...base, ENVIRONMENT: environment, DATABASE_URL: "postgres://example.local/db" });
    expect(shared.calls).toHaveLength(0);
  });

  it("without a database the per-isolate limiter is used", async () => {
    const a = await isolate();
    const env = { ...base, ENVIRONMENT: "production" };
    const statuses: number[] = [];
    for (let i = 0; i < 12; i++) statuses.push((await contact(a, i, "198.51.100.11", env)).status);
    expect(shared.calls).toHaveLength(0);
    expect(statuses.filter((s) => s === 429)).toHaveLength(2);
  });

  it("falls back to the per-isolate limiter when the store fails, and backs off instead of retrying every request", async () => {
    const a = await isolate();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    shared.fail = true;
    const statuses: number[] = [];
    for (let i = 0; i < 12; i++) statuses.push((await contact(a, i, "198.51.100.12")).status);
    expect(statuses.filter((s) => s === 422)).toHaveLength(10); // still limited, in memory
    expect(statuses.filter((s) => s === 429)).toHaveLength(2);
    expect(shared.calls).toHaveLength(1); // one failed attempt, then skipped for the backoff window
  });
});
