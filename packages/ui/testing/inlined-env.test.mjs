import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import {
  collectPublicEnvNames,
  findNonLiteralOriginCalls,
  findUninlinedEnvLookups,
  listFiles,
  sentinelEnvironment,
} from "./inlined-env.mjs";
import { readFileSync } from "node:fs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const APPS = [
  ["web", "@omdala/web"],
  ["app", "@omdala/app"],
  ["docs", "@omdala/docs"],
  ["admin", "@omdala/admin"],
  ["auth", "@omdala/auth"],
  ["brand-marketplace", "@omdala/brand-marketplace"],
];

describe("scanner", () => {
  it("flags the lookups the bundler leaves behind", () => {
    assert.equal(findUninlinedEnvLookups("a=e.default?.env?.NEXT_PUBLIC_API_URL,b").length, 1);
    assert.equal(findUninlinedEnvLookups("x=n.default.env.NEXT_PUBLIC_OMDALA_API_BASE_URL??1").length, 1);
    assert.equal(findUninlinedEnvLookups("process.env.NEXT_PUBLIC_A+process?.env?.NEXT_PUBLIC_B").length, 2);
  });

  it("ignores inlined values and message text", () => {
    assert.equal(findUninlinedEnvLookups('f("https://api-staging.omdala.com","staging")').length, 0);
    assert.equal(findUninlinedEnvLookups('throw Error("NEXT_PUBLIC_RELEASE_ENVIRONMENT must be staging")').length, 0);
  });

  it("flags origin calls whose arguments were not inlined", () => {
    assert.equal(findNonLiteralOriginCalls('(0,s.P)("api",i,e.default?.env?.X)').length, 1);
    assert.equal(findNonLiteralOriginCalls('(0,s.P)("api","https://api-staging.omdala.com",void 0)').length, 1);
    assert.equal(findNonLiteralOriginCalls('(0,s.P)("api","https://api-staging.omdala.com","staging")').length, 0);
    // The minifier hoists the environment into a variable bound to the inlined literal.
    assert.equal(findNonLiteralOriginCalls('t=1,s="staging",a=d("auth","https://auth-staging.omdala.com",s)').length, 0);
    assert.equal(findNonLiteralOriginCalls('t=1,a=d("auth","https://auth-staging.omdala.com",s)').length, 1);
    assert.equal(findNonLiteralOriginCalls('s=e.default?.env?.X,a=d("auth","https://auth-staging.omdala.com",s)').length, 1);
  });

  it("gives every name a value, valid staging ones where the apps validate", () => {
    const env = sentinelEnvironment(["NEXT_PUBLIC_API_URL", "NEXT_PUBLIC_SOMETHING_NEW"]);
    assert.equal(env.NEXT_PUBLIC_API_URL, "https://api-staging.omdala.com");
    assert.equal(env.NEXT_PUBLIC_SOMETHING_NEW, "sentinel-NEXT_PUBLIC_SOMETHING_NEW");
  });
});

// Builds every app with each NEXT_PUBLIC_* name the source reads set (staging values), then
// inspects the client chunks. Slow (a build per app): run with `pnpm test:inlined-env`.
describe("built client bundles", () => {
  const names = collectPublicEnvNames(
    ["apps", "packages"].flatMap((dir) => {
      const base = path.join(root, dir);
      return [base];
    }),
  );
  const env = { ...process.env, ...sentinelEnvironment(names) };

  it("the sweep finds the variables the apps read", () => {
    assert.ok(names.includes("NEXT_PUBLIC_API_URL"));
    assert.ok(names.includes("NEXT_PUBLIC_RELEASE_ENVIRONMENT"));
  });

  for (const [dir, pkg] of APPS) {
    it(`${dir}: every NEXT_PUBLIC_ lookup is inlined and no origin falls back to production`, { timeout: 900000 }, () => {
      const build = spawnSync("pnpm", ["--filter", pkg, "run", "build"], { cwd: root, env, encoding: "utf8" });
      assert.equal(build.status, 0, `build of ${pkg} failed:\n${(build.stdout ?? "").slice(-1500)}\n${(build.stderr ?? "").slice(-800)}`);
      const chunks = listFiles(path.join(root, "apps", dir, ".next", "static"), ".js");
      assert.ok(chunks.length > 0, `no client chunks found for ${dir}`);
      const problems = [];
      for (const chunk of chunks) {
        const source = readFileSync(chunk, "utf8");
        for (const hit of findUninlinedEnvLookups(source)) problems.push(`${path.relative(root, chunk)}: un-inlined lookup ...${hit}...`);
        for (const hit of findNonLiteralOriginCalls(source)) problems.push(`${path.relative(root, chunk)}: origin not inlined ${hit}`);
      }
      assert.deepEqual(problems, []);
    });
  }
});
