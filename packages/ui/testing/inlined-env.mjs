// Checks that a Next.js client bundle has its NEXT_PUBLIC_* values inlined. The bundler only
// replaces the direct `process.env.NEXT_PUBLIC_X` form; an optional-chained or unset lookup stays
// in the chunk and evaluates to undefined in the browser, silently selecting the production default.
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

/** Lookups of a NEXT_PUBLIC_ variable that are still present in built code (`.env.X`, `?.X`). */
export function findUninlinedEnvLookups(source) {
  const found = [];
  for (const match of source.matchAll(/(?:\.|\?\.)NEXT_PUBLIC_[A-Z0-9_]+/g)) {
    const start = Math.max(0, match.index - 40);
    found.push(source.slice(start, match.index + match[0].length + 30));
  }
  return found;
}

/**
 * resolve/validatePublicOrigin("surface", origin, environment) calls whose origin or environment
 * is neither a string literal nor an identifier the same chunk binds to one (the minifier hoists
 * `const releaseEnvironment = process.env.X` into `s="staging"`). In a build made with every public
 * value set, anything else was not inlined.
 */
export function findNonLiteralOriginCalls(source) {
  const found = [];
  const call = /\(\s*"(?:web|app|auth|api|brand)"\s*,\s*([^,()]+?)\s*,\s*([^,()]+?)\s*\)/g;
  const isInlined = (argument) => {
    if (argument.startsWith('"')) return true;
    if (!/^[A-Za-z_$][\w$]*$/.test(argument)) return false;
    const escaped = argument.replace(/\$/g, "\\$");
    return new RegExp(`[,;{ (]${escaped}="[^"]*"`).test(source);
  };
  for (const match of source.matchAll(call)) {
    const [, origin, environment] = match;
    if (!isInlined(origin) || !isInlined(environment)) found.push(match[0]);
  }
  return found;
}

const SKIP_DIRECTORIES = new Set(["node_modules", ".next", "out", "test-results", ".turbo", "dist"]);

export function listFiles(dir, extension, { skipBuildDirectories = false } = {}) {
  const out = [];
  let entries = [];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (skipBuildDirectories && SKIP_DIRECTORIES.has(entry)) continue;
      out.push(...listFiles(full, extension, { skipBuildDirectories }));
    }
    else if (full.endsWith(extension)) out.push(full);
  }
  return out;
}

const SOURCE_SKIP = /(node_modules|\.next|[/\\]out[/\\]|test-results|[/\\]e2e[/\\]|\.test\.|playwright|[/\\]testing[/\\])/;

/** Every NEXT_PUBLIC_* name the source of the apps and packages refers to. */
export function collectPublicEnvNames(roots) {
  const names = new Set();
  for (const root of roots) {
    for (const ext of [".ts", ".tsx", ".js", ".jsx", ".mjs"]) {
      for (const file of listFiles(root, ext, { skipBuildDirectories: true })) {
        if (SOURCE_SKIP.test(file)) continue;
        for (const match of readFileSync(file, "utf8").matchAll(/NEXT_PUBLIC_[A-Z0-9_]+/g)) names.add(match[0]);
      }
    }
  }
  return [...names].sort();
}

/** Valid staging values for the names the apps validate; a sentinel for anything else. */
export function sentinelEnvironment(names) {
  const known = {
    NEXT_PUBLIC_RELEASE_ENVIRONMENT: "staging",
    NEXT_PUBLIC_API_URL: "https://api-staging.omdala.com",
    NEXT_PUBLIC_AUTH_API_BASE: "https://api-staging.omdala.com",
    NEXT_PUBLIC_AUTH_ORIGIN: "https://auth-staging.omdala.com",
    NEXT_PUBLIC_APP_ORIGIN: "https://app-staging.omdala.com",
    NEXT_PUBLIC_WEB_ORIGIN: "https://staging.omdala.com",
    NEXT_PUBLIC_BRAND_ORIGIN: "https://brand-staging.omdala.com",
  };
  return Object.fromEntries(names.map((name) => [name, known[name] ?? `sentinel-${name}`]));
}
