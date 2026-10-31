import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { APP_POLICY, headerProblems, parseCsp, parseHeaders } from "./security-headers.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

const GOOD = `/*
  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
  X-Frame-Options: SAMEORIGIN
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; connect-src 'self'; frame-src 'self'; frame-ancestors 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests;

/_next/static/*
  Cache-Control: public, max-age=31536000, immutable
`;

describe("policy checker", () => {
  it("parses rules and CSP directives", () => {
    assert.equal(parseHeaders(GOOD).length, 2);
    assert.deepEqual(parseCsp("default-src 'self'; font-src 'self'")["font-src"], ["'self'"]);
  });

  it("accepts a conforming public file", () => {
    assert.deepEqual(headerProblems("docs", GOOD), []);
  });

  it("flags the defects found in the old files", () => {
    const bad = GOOD
      .replace("font-src 'self'", "font-src 'self' https://fonts.gstatic.com")
      .replace("script-src 'self' 'unsafe-inline'", "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.omdala.com")
      .replace("  X-Content-Type-Options: nosniff\n", "")
      .replace("frame-ancestors 'self'; ", "");
    const problems = headerProblems("docs", bad).join("\n");
    assert.match(problems, /Google Fonts/);
    assert.match(problems, /unsafe-eval/);
    assert.match(problems, /remote origin/);
    assert.match(problems, /X-Content-Type-Options/);
    assert.match(problems, /frame-ancestors/);
  });

  it("flags a header sent twice (a path rule repeating a /* header)", () => {
    const duplicated = `${GOOD}\n/\n  X-Frame-Options: SAMEORIGIN\n`;
    assert.match(headerProblems("docs", duplicated).join("\n"), /both \/\* and \//);
  });

  it("allows blob: workers and data: fonts for the editor surface only", () => {
    const editorHeaders = GOOD
      .replace("/*\n", "/*\n  X-Robots-Tag: noindex, nofollow\n")
      .replace("X-Frame-Options: SAMEORIGIN", "X-Frame-Options: DENY")
      .replace("strict-origin-when-cross-origin", "no-referrer")
      .replace("font-src 'self'", "font-src 'self' data:")
      .replace("frame-ancestors 'self'", "frame-ancestors 'none'")
      .replace("default-src 'self';", "default-src 'self'; worker-src 'self' blob:;");
    assert.deepEqual(headerProblems("app", editorHeaders.replace("connect-src 'self'", "connect-src 'self' https://api.omdala.com")), []);
    const publicWithBlob = GOOD.replace("default-src 'self';", "default-src 'self'; worker-src 'self' blob:;");
    assert.match(headerProblems("docs", publicWithBlob).join("\n"), /worker-src must be 'self' only/);
    assert.match(headerProblems("docs", GOOD.replace("font-src 'self'", "font-src 'self' data:")).join("\n"), /font-src must be 'self'/);
  });

  it("requires noindex on private surfaces only", () => {
    assert.match(headerProblems("auth", GOOD).join("\n"), /X-Robots-Tag/);
    assert.match(headerProblems("docs", GOOD.replace("/*\n", "/*\n  X-Robots-Tag: noindex, nofollow\n")).join("\n"), /must not send X-Robots-Tag/);
  });
});

// The built file is what ships: check that out/_headers is the source file and conforms to the
// policy, building the app first when the output is missing or stale.
describe("built _headers of every surface", () => {
  for (const app of Object.keys(APP_POLICY)) {
    it(`${app}`, { timeout: 900000 }, () => {
      const built = path.join(root, "apps", app, "out", "_headers");
      const source = readFileSync(path.join(root, "apps", app, "public", "_headers"), "utf8");
      // Rebuild when the output is missing or was built from an older _headers.
      if (!existsSync(built) || readFileSync(built, "utf8") !== source) {
        const build = spawnSync("pnpm", ["--filter", `@omdala/${app}`, "run", "build"], { cwd: root, encoding: "utf8" });
        assert.equal(build.status, 0, `build of ${app} failed:\n${(build.stdout ?? "").slice(-1200)}`);
      }
      const shipped = readFileSync(built, "utf8");
      assert.equal(shipped, source, `${app}: the build did not ship public/_headers unchanged`);
      assert.deepEqual(headerProblems(app, shipped), []);
    });
  }
});
