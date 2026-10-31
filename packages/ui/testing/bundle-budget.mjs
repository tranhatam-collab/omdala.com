// First-load JavaScript budgets: measures each exported page's script payload and compares it with
// the baseline recorded in the app.
export const BUDGET_GROWTH = 0.1;

import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { gzipSync } from "node:zlib";

/** The static JavaScript files an exported page loads: its script tags and script preloads. */
export function scriptPaths(html) {
  const found = new Set();
  for (const match of html.matchAll(/\b(?:src|href)="(\/_next\/static\/[^"?#]+\.js)(?:[?#][^"]*)?"/g)) found.add(decodeURIComponent(match[1]));
  return [...found];
}

function htmlFiles(dir, base = dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry !== "_next") out.push(...htmlFiles(full, base));
    } else if (entry === "index.html" || (dir === base && entry === "404.html")) {
      out.push(full);
    }
  }
  return out;
}

/**
 * Route -> first-load JavaScript in bytes (gzip level 9, each shared file counted once per page),
 * measured on an app's static export: the files each page's HTML loads. This is bundler independent
 * (the Route table `next build` prints has no size column for every build mode).
 */
export function measureFirstLoad(outDirectory) {
  const sizes = new Map();
  const gzipSize = (file) => {
    if (!sizes.has(file)) sizes.set(file, gzipSync(readFileSync(path.join(outDirectory, file)), { level: 9 }).length);
    return sizes.get(file);
  };
  const routes = {};
  for (const file of htmlFiles(outDirectory)) {
    const relative = path.relative(outDirectory, file).split(path.sep).join("/");
    const route = relative === "404.html" ? "/404" : `/${relative.replace(/index\.html$/, "")}`;
    routes[route] = scriptPaths(readFileSync(file, "utf8")).reduce((total, script) => total + gzipSize(script), 0);
  }
  return routes;
}

/** Problems found comparing a measurement with its baseline (an empty list means within budget). */
export function budgetProblems(measured, baseline, growth = BUDGET_GROWTH) {
  const problems = [];
  for (const [route, bytes] of Object.entries(measured)) {
    const recorded = baseline[route];
    if (recorded === undefined) {
      problems.push(`${route}: no baseline recorded (${bytes} B); record it with OMDALA_UPDATE_BUNDLE_BASELINE=1`);
    } else if (bytes > recorded * (1 + growth)) {
      const percent = Math.round(((bytes - recorded) / recorded) * 1000) / 10;
      problems.push(`${route}: first-load JS ${bytes} B is ${percent}% over the ${recorded} B baseline (limit ${growth * 100}%)`);
    }
  }
  for (const route of Object.keys(baseline)) {
    if (!(route in measured)) problems.push(`${route}: in the baseline but no longer built; update the baseline`);
  }
  return problems;
}
