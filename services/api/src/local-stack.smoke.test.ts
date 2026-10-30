// PREP_UNDER_ASSUMPTION(CTL-03, PostgreSQL via Hyperdrive for the main API)
//
// scripts/local-stack.mjs: the refusal paths always run; the full local stand-up
// (wrangler dev --local against a scratch database) is opt-in through
// OMDALA_TEST_DATABASE_URL and needs openssl for its throwaway CA.
import { execFile, execFileSync, spawn } from "node:child_process";
import { readdirSync } from "node:fs";
import net from "node:net";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { Client } from "pg";
import { describe, expect, it } from "vitest";

const run = promisify(execFile);
const script = resolve(fileURLToPath(new URL(".", import.meta.url)), "../scripts/local-stack.mjs");

async function stack(args: string[], env: Record<string, string | undefined>) {
  try {
    const { stdout, stderr } = await run(process.execPath, [script, ...args], {
      env: { PATH: process.env.PATH, HOME: process.env.HOME, ...env },
      timeout: 150_000,
    });
    return { code: 0, stdout, stderr };
  } catch (error) {
    const e = error as { code?: number; stdout?: string; stderr?: string };
    return { code: e.code ?? 1, stdout: e.stdout ?? "", stderr: e.stderr ?? "" };
  }
}

function haveOpenssl(): boolean {
  try {
    execFileSync("openssl", ["version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

describe("local stack refusals", () => {
  it("requires OMDALA_LOCAL_PG_URL", async () => {
    const result = await stack(["--smoke"], {});
    expect(result.code).toBe(1);
    expect(result.stderr).toContain("OMDALA_LOCAL_PG_URL");
  });

  it.each([
    "postgresql://u@db.example.com:5432/postgres",
    "postgresql://u@10.0.0.5:5432/postgres",
    "postgresql://u@omdala-prod.internal:5432/postgres",
  ])("refuses the non-loopback database %s before connecting", async (url) => {
    const result = await stack(["--smoke"], { OMDALA_LOCAL_PG_URL: url });
    expect(result.code).toBe(1);
    expect(result.stderr).toContain("refusing non-loopback database host");
  });

  it("refuses an unknown profile before connecting to anything", async () => {
    const result = await stack(["--smoke", "--profile=production"], {
      OMDALA_LOCAL_PG_URL: "postgresql://u@127.0.0.1:5432/postgres",
    });
    expect(result.code).toBe(1);
    expect(result.stderr).toContain("unknown profile");
  });

  it("accepts --public-origins only with the development profile, and only known values", async () => {
    const base = { OMDALA_LOCAL_PG_URL: "postgresql://u@127.0.0.1:5432/postgres" };
    const persistent = await stack(["--smoke", "--public-origins=staging"], base);
    expect(persistent.code).toBe(1);
    expect(persistent.stderr).toContain("--profile=development only");
    const unknown = await stack(["--smoke", "--profile=development", "--public-origins=production"], base);
    expect(unknown.code).toBe(1);
    expect(unknown.stderr).toContain("unknown --public-origins");
  });

  it("refuses an invalid URL", async () => {
    const result = await stack(["--smoke"], { OMDALA_LOCAL_PG_URL: "not a url" });
    expect(result.code).toBe(1);
    expect(result.stderr).toContain("not a valid URL");
  });
});

describe.skipIf(!process.env.OMDALA_TEST_DATABASE_URL || !haveOpenssl())(
  "local stack against a scratch PostgreSQL",
  () => {
    const env = () => ({ OMDALA_LOCAL_PG_URL: process.env.OMDALA_TEST_DATABASE_URL });

    it("persistent profile: link and session live in PostgreSQL and survive a worker restart", async () => {
      const result = await stack(["--smoke"], env());
      expect(result.stderr + result.stdout).not.toMatch(/local-stack: (?!smoke)/);
      expect(result.code).toBe(0);
      expect(result.stdout).toContain("[persistent]");
      expect(result.stdout).toContain("magic-link request 201 (stub mail sink)");
      expect(result.stdout).toContain("link and session persisted in PostgreSQL");
      expect(result.stdout).toContain("session valid after worker restart");
      expect(result.stdout).toContain("replayed link refused");
    }, 200_000);

    it("development profile with the staging public origins: CORS, login link, rate limit reset, inbox clear", async () => {
      const result = await stack(["--smoke", "--profile=development", "--public-origins=staging"], env());
      expect(result.stderr + result.stdout).not.toMatch(/local-stack: (?!smoke)/);
      expect(result.code).toBe(0);
      expect(result.stdout).toContain("rate limit reset and inbox clear work");
      expect(result.stdout).toContain("login link on the staging auth origin");
      expect(result.stdout).toContain("CORS answers for the three staging origins only");
    }, 160_000);

    it("development profile: in-memory auth, stub mail sink, seeded profile and persisted scenes", async () => {
      const result = await stack(["--smoke", "--profile=development"], env());
      expect(result.stderr + result.stdout).not.toMatch(/local-stack: (?!smoke)/);
      expect(result.code).toBe(0);
      expect(result.stdout).toContain("[development]");
      expect(result.stdout).toContain("magic-link request 201 (stub mail sink)");
      expect(result.stdout).toContain("seeded profile read back from PostgreSQL");
      expect(result.stdout).toContain("scenes and runs persisted in PostgreSQL");
    }, 160_000);
  },
);

// ── teardown guarantees (need the scratch server) ─────────────────────────────

const stackDirs = () => readdirSync(tmpdir()).filter((n) => n.startsWith("omdala-local-stack-")).length;

async function localDatabases(url: string): Promise<number> {
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    const { rows } = await client.query(
      "SELECT count(*)::int AS n FROM pg_database WHERE datname LIKE 'omdala_local_%'",
    );
    return rows[0].n as number;
  } finally {
    await client.end();
  }
}

describe.skipIf(!process.env.OMDALA_TEST_DATABASE_URL || !haveOpenssl())(
  "local stack always tears down",
  () => {
    const url = process.env.OMDALA_TEST_DATABASE_URL!;

    it("drops the scratch database and temp directory when the worker cannot start", async () => {
      // A busy port makes wrangler exit after the database, proxy and sink already exist.
      const blockerSockets = new Set<net.Socket>();
      const blocker = net.createServer((socket) => {
        blockerSockets.add(socket);
        socket.on("error", () => undefined);
      });
      await new Promise<void>((resolve) => blocker.listen(0, "127.0.0.1", resolve));
      const busyPort = (blocker.address() as net.AddressInfo).port;
      const dbsBefore = await localDatabases(url);
      const dirsBefore = stackDirs();
      try {
        const result = await stack(["--smoke"], {
          OMDALA_LOCAL_PG_URL: url,
          OMDALA_LOCAL_API_PORT: String(busyPort),
        });
        expect(result.code).toBe(1);
        expect(result.stderr).toContain("wrangler exited early");
      } finally {
        // close() waits for open connections; wrangler's port probe may have left one
        for (const socket of blockerSockets) socket.destroy();
        await new Promise((resolve) => blocker.close(resolve));
      }
      expect(await localDatabases(url)).toBe(dbsBefore);
      expect(stackDirs()).toBe(dirsBefore);
    }, 160_000);

    it.each([
      ["SIGHUP", 129],
      ["SIGINT", 130],
      ["SIGTERM", 143],
    ] as const)("%s tears the running stack down", async (signal, exitCode) => {
      const dbsBefore = await localDatabases(url);
      const dirsBefore = stackDirs();
      const child = spawn(process.execPath, [script], {
        env: { PATH: process.env.PATH, HOME: process.env.HOME, OMDALA_LOCAL_PG_URL: url },
        stdio: ["ignore", "pipe", "ignore"],
      });
      const exited = new Promise<number | null>((resolve) => child.once("exit", resolve));
      let output = "";
      const ready = new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`stack did not become ready:\n${output}`)), 120_000);
        child.stdout!.on("data", (chunk) => {
          output += chunk.toString();
          if (output.includes("press Ctrl+C to stop")) {
            clearTimeout(timer);
            resolve();
          }
        });
      });
      await ready;
      expect(await localDatabases(url)).toBe(dbsBefore + 1);
      child.kill(signal);
      expect(await exited).toBe(exitCode);
      expect(await localDatabases(url)).toBe(dbsBefore);
      expect(stackDirs()).toBe(dirsBefore);
    }, 160_000);
  },
);
