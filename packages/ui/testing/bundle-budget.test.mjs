import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { budgetProblems, measureFirstLoad, scriptPaths } from "./bundle-budget.mjs";
import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { gzipSync } from "node:zlib";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const APPS = ["web", "app", "docs", "admin", "auth", "brand-marketplace"];
const UPDATE = process.env.OMDALA_UPDATE_BUNDLE_BASELINE === "1";

describe("measurement", () => {
  it("lists the scripts and script preloads a page loads, once each", () => {
    const html = `<link rel="preload" as="script" href="/_next/static/chunks/a.js"/><script src="/_next/static/chunks/a.js" async></script><script src="/_next/static/chunks/b.js?v=1"></script><link rel="stylesheet" href="/_next/static/css/x.css"/><a href="/other.js">no</a>`;
    assert.deepEqual(scriptPaths(html), ["/_next/static/chunks/a.js", "/_next/static/chunks/b.js"]);
    // Dynamic-route chunks are URL-encoded in the HTML but live under their literal [name] folder.
    assert.deepEqual(scriptPaths('<script src="/_next/static/chunks/app/%5Blang%5D/page-1.js"></script>'), ["/_next/static/chunks/app/[lang]/page-1.js"]);
  });

  it("sums gzip sizes per page, counting a shared file in every page", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "budget-"));
    try {
      mkdirSync(path.join(dir, "_next/static/chunks"), { recursive: true });
      mkdirSync(path.join(dir, "about"), { recursive: true });
      const shared = "x".repeat(5000);
      const own = "y".repeat(2000);
      writeFileSync(path.join(dir, "_next/static/chunks/shared.js"), shared);
      writeFileSync(path.join(dir, "_next/static/chunks/own.js"), own);
      writeFileSync(path.join(dir, "index.html"), '<script src="/_next/static/chunks/shared.js"></script>');
      writeFileSync(path.join(dir, "about/index.html"), '<script src="/_next/static/chunks/shared.js"></script><script src="/_next/static/chunks/own.js"></script>');
      writeFileSync(path.join(dir, "404.html"), "<html></html>");
      const sharedBytes = gzipSync(shared, { level: 9 }).length;
      const ownBytes = gzipSync(own, { level: 9 }).length;
      assert.deepEqual(measureFirstLoad(dir), { "/": sharedBytes, "/about/": sharedBytes + ownBytes, "/404": 0 });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("budget comparison", () => {
  it("passes within 10 percent and fails beyond it", () => {
    const baseline = { "/": 100000 };
    assert.deepEqual(budgetProblems({ "/": 110000 }, baseline), []);
    assert.match(budgetProblems({ "/": 110001 }, baseline).join("\n"), /over the 100000 B baseline/);
    assert.deepEqual(budgetProblems({ "/": 50000 }, baseline), []);
  });

  it("flags a route with no baseline and a baseline route that disappeared", () => {
    const problems = budgetProblems({ "/new": 1 }, { "/old": 1 }).join("\n");
    assert.match(problems, /\/new: no baseline recorded/);
    assert.match(problems, /\/old: in the baseline but no longer built/);
  });
});

// Builds every app and compares each route's first-load JavaScript with apps/<app>/bundle-baseline.json.
// Re-record after an intended change: OMDALA_UPDATE_BUNDLE_BASELINE=1 pnpm test:bundle-budget
describe("first-load JavaScript of every app", () => {
  for (const app of APPS) {
    it(app, { timeout: 900000 }, () => {
      const build = spawnSync("pnpm", ["--filter", `@omdala/${app}`, "run", "build"], { cwd: root, encoding: "utf8" });
      assert.equal(build.status, 0, `build of ${app} failed:\n${(build.stdout ?? "").slice(-1200)}`);
      const measured = measureFirstLoad(path.join(root, "apps", app, "out"));
      assert.ok(Object.keys(measured).length > 0, `no exported pages found for ${app}`);
      const file = path.join(root, "apps", app, "bundle-baseline.json");
      if (UPDATE) {
        const sorted = Object.fromEntries(Object.entries(measured).sort(([a], [b]) => a.localeCompare(b)));
        writeFileSync(file, `${JSON.stringify({ unit: "bytes: gzip level 9 of the scripts each exported page loads (first-load JS)", routes: sorted }, null, 2)}\n`);
        return;
      }
      assert.ok(existsSync(file), `${app}: no bundle-baseline.json; record it with OMDALA_UPDATE_BUNDLE_BASELINE=1`);
      const baseline = JSON.parse(readFileSync(file, "utf8")).routes;
      assert.deepEqual(budgetProblems(measured, baseline), []);
    });
  }
});
