// The default-build export (out-deny) is test scaffolding; remove it so it is not linted or committed.
import { rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export default async function globalTeardown() {
  await rm(path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "out-deny"), {
    recursive: true,
    force: true,
  });
}
