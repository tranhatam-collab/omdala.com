import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

export function playwrightCandidates(env = process.env, home = os.homedir()) {
  return [
    env.OMCODE_PLAYWRIGHT_PATH,
    "playwright",
    path.join(
      home,
      ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright",
    ),
  ].filter(
    (candidate, index, candidates) =>
      candidate && candidates.indexOf(candidate) === index,
  );
}

export function loadPlaywright(env = process.env, home = os.homedir()) {
  const candidates = playwrightCandidates(env, home);
  const failures = [];

  for (const candidate of candidates) {
    try {
      return require(candidate);
    } catch (error) {
      if (error?.code !== "MODULE_NOT_FOUND") throw error;
      failures.push(candidate);
    }
  }

  throw new Error(
    `Playwright is unavailable. Tried: ${failures.join(", ")}. ` +
      "Install the project dependency or set OMCODE_PLAYWRIGHT_PATH.",
  );
}
