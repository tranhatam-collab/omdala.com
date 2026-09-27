import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

export async function dataManifest(root) {
  const result = [];
  async function walk(directory) {
    let entries;
    try {
      entries = await fs.readdir(directory, { withFileTypes: true });
    } catch (error) {
      if (error.code === "ENOENT" && directory === root) return;
      throw error;
    }
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) await walk(file);
      else {
        const bytes = entry.isSymbolicLink()
          ? Buffer.from(`symlink:${await fs.readlink(file)}`)
          : await fs.readFile(file);
        result.push({
          path: path.relative(root, file),
          bytes: bytes.length,
          sha256: createHash("sha256").update(bytes).digest("hex"),
        });
      }
    }
  }
  await walk(root);
  return result;
}
export function compareData(before, after) {
  const current = new Map(after.map((f) => [f.path, f]));
  const deleted = before.filter((f) => !current.has(f.path)).map((f) => f.path);
  const changed = before
    .filter(
      (f) => current.has(f.path) && current.get(f.path).sha256 !== f.sha256,
    )
    .map((f) => f.path);
  return {
    preserved: !deleted.length && !changed.length,
    deleted,
    changed,
    checkedFiles: before.length,
  };
}
