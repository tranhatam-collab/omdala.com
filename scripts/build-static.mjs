import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const distDir = path.join(projectRoot, "dist");
const publicEntries = ["index.html", "styles.css", "docs"];

async function main() {
  await rm(distDir, { force: true, recursive: true });
  await mkdir(distDir, { recursive: true });

  for (const entry of publicEntries) {
    await cp(path.join(projectRoot, entry), path.join(distDir, entry), {
      force: true,
      recursive: true
    });
  }

  console.log(`Built static output to ${distDir}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
