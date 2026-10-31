// Copies the Monaco AMD build (monaco-editor/min/vs) into out/monaco/vs after `next build`, so the
// static export serves the editor from 'self' (no CDN). It lives in out/ (generated, git- and
// lint-ignored), not public/, because the assets are large third-party minified code.
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = createRequire(join(appRoot, "package.json")).resolve("monaco-editor/package.json");
const source = join(dirname(pkg), "min", "vs");
const target = join(appRoot, "out", "monaco", "vs");
if (!existsSync(join(appRoot, "out"))) throw new Error("run after `next build` (out/ is missing)");

if (!existsSync(source)) throw new Error(`monaco-editor build not found at ${source}`);
rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
// English UI only: drop the translated nls bundles (the app ships EN + VI of its own).
cpSync(source, target, {
  recursive: true,
  filter: (path) => !/nls\.messages\.[a-z-]+\.js\.js$/.test(path),
});
console.log(`monaco: copied to ${target}`);
