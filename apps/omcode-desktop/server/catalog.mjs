import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { parse as parseYaml } from "yaml";
import { parse as parseToml } from "smol-toml";
export const ROLES = [
  {
    id: "coder",
    name: "Lập trình",
    instruction:
      "Implement focused, reviewable code changes. Inspect the existing project before proposing edits.",
  },
  {
    id: "reviewer",
    name: "Kiểm tra",
    instruction:
      "Audit for reproducible bugs, security, regressions and missing tests. Cite exact paths. Distinguish verified evidence from inference.",
  },
  {
    id: "planner",
    name: "Kế hoạch",
    instruction:
      "Inspect the project and develop an actionable plan with dependencies and verification. Do not propose edits until asked.",
  },
  {
    id: "debugger",
    name: "Gỡ lỗi",
    instruction:
      "Reproduce the failure, trace its root cause, propose a minimal fix and a meaningful regression test.",
  },
  {
    id: "tester",
    name: "Kiểm thử",
    instruction:
      "Create realistic tests of actual user workflows. Never claim E2E passed without execution evidence.",
  },
  {
    id: "architect",
    name: "Kiến trúc",
    instruction:
      "Analyze system boundaries, contracts and operational constraints. Favor existing proven components.",
  },
  {
    id: "documenter",
    name: "Tài liệu",
    instruction:
      "Write precise documentation based on observed source and runtime behavior.",
  },
];
async function walk(directory, depth, result) {
  if (depth < 0) return;
  let entries;
  try {
    entries = await fs.readdir(directory, { withFileTypes: true });
  } catch {
    return;
  }
  if (entries.some((e) => e.name === "SKILL.md" && e.isFile())) {
    result.push(directory);
    return;
  }
  for (const e of entries)
    if (
      e.isDirectory() &&
      !["node_modules", ".git", "sessions", ".cache"].includes(e.name)
    )
      await walk(path.join(directory, e.name), depth - 1, result);
}
export async function importSkills(store) {
  const sources = [];
  for (const root of [
    ".codex/skills",
    ".agents/skills",
    ".claude/skills",
    ".codex/plugins/cache",
  ])
    await walk(
      path.join(process.env.HOME, root),
      root.endsWith("cache") ? 7 : 3,
      sources,
    );
  const catalog = [];
  const hashes = new Set();
  const root = path.join(store.directory, "skills");
  await fs.mkdir(root, { recursive: true, mode: 0o700 });
  for (const source of sources) {
    try {
      const content = await fs.readFile(path.join(source, "SKILL.md"), "utf8");
      if (content.length > 200000) continue;
      const digest = createHash("sha256").update(content).digest("hex");
      if (hashes.has(digest)) continue;
      hashes.add(digest);
      let meta = {};
      if (content.startsWith("---")) {
        const end = content.indexOf("\n---", 3);
        if (end > 0)
          try {
            meta = parseYaml(content.slice(3, end)) || {};
          } catch {}
      }
      const id = digest.slice(0, 20);
      const destination = path.join(root, id);
      await fs.cp(source, destination, {
        recursive: true,
        force: false,
        errorOnExist: false,
        filter: async (p) => {
          const s = await fs.lstat(p);
          return (
            !s.isSymbolicLink() &&
            !["node_modules", ".git", ".env"].includes(path.basename(p))
          );
        },
      });
      catalog.push({
        id,
        name: String(meta.name || path.basename(source)),
        description: String(meta.description || "").slice(0, 500),
        source,
        path: destination,
        digest,
      });
    } catch {}
  }
  catalog.sort((a, b) => a.name.localeCompare(b.name));
  store.set("skills", catalog);
  return catalog;
}
export async function importMcp(store) {
  let config;
  try {
    config = parseToml(
      await fs.readFile(
        path.join(process.env.HOME, ".codex/config.toml"),
        "utf8",
      ),
    );
  } catch {
    return [];
  }
  const servers = Object.entries(config.mcp_servers || {})
    .filter(([, v]) => typeof v.url === "string")
    .map(([id, v]) => ({ id, url: v.url, status: "not_checked", tools: [] }));
  const existing = store.get("mcp", []);
  for (const item of servers)
    if (!existing.some((s) => s.id === item.id)) existing.push(item);
  store.set("mcp", existing);
  return existing;
}
export async function skillPrompt(store, ids) {
  const catalog = store.get("skills", []);
  const result = [];
  for (const id of ids.slice(0, 3)) {
    const item = catalog.find((s) => s.id === id);
    if (item)
      result.push(
        (await fs.readFile(path.join(item.path, "SKILL.md"), "utf8")).slice(
          0,
          12000,
        ),
      );
  }
  return result.join("\n\n");
}
