// PREP_UNDER_ASSUMPTION(CTL-03, PostgreSQL via Hyperdrive for the main API)
//
// scripts/local-stack.mjs: the refusal paths always run; the full local stand-up
// (wrangler dev --local against a scratch database) is opt-in through
// OMDALA_TEST_DATABASE_URL and needs openssl for its throwaway CA.
import { execFile, execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
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

    it("development profile: in-memory auth, console mail, seeded profile from PostgreSQL", async () => {
      const result = await stack(["--smoke", "--profile=development"], env());
      expect(result.stderr + result.stdout).not.toMatch(/local-stack: (?!smoke)/);
      expect(result.code).toBe(0);
      expect(result.stdout).toContain("[development]");
      expect(result.stdout).toContain("magic-link request 201 (console transport)");
      expect(result.stdout).toContain("seeded profile read back from PostgreSQL");
    }, 160_000);
  },
);
