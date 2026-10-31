// Copies the Monaco AMD build (monaco-editor/min/vs) into out/monaco/vs after `next build`, so the
// static export serves the editor from 'self' (no CDN). It lives in out/ (generated, git- and
// lint-ignored), not public/, because the assets are large third-party minified code.
import { cpSync, existsSync, lstatSync, mkdirSync, rmSync, symlinkSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = createRequire(join(appRoot, "package.json")).resolve("monaco-editor/package.json");
const source = join(dirname(pkg), "min", "vs");
const devLink = join(appRoot, "public", "monaco");
const target = join(appRoot, "out", "monaco", "vs");

if (!existsSync(source)) throw new Error(`monaco-editor build not found at ${source}`);
// `--dev`: `next dev` serves public/, so link the package's build there (a symlink: nothing is
// copied or committed). `--clean` removes the link before a build so the export is not polluted.
if (process.argv.includes("--dev") || process.argv.includes("--clean")) {
  try {
    if (lstatSync(devLink)) rmSync(devLink, { recursive: true, force: true });
  } catch {}
  if (process.argv.includes("--dev")) {
    mkdirSync(devLink, { recursive: true });
    symlinkSync(source, join(devLink, "vs"), "dir");
    console.log(`monaco: linked ${devLink}`);
  }
  process.exit(0);
}

if (!existsSync(join(appRoot, "out"))) throw new Error("run after `next build` (out/ is missing)");

rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
// English UI only: drop the translated nls bundles (the app ships EN + VI of its own).
cpSync(source, target, {
  recursive: true,
  filter: (path) => !/nls\.messages\.[a-z-]+\.js\.js$/.test(path),
});
console.log(`monaco: copied to ${target}`);
