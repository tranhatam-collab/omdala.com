import path from "node:path";
import { createStore } from "../server/store.mjs";
import { checkProvider } from "../server/providers.mjs";
import { importSkills, importMcp } from "../server/catalog.mjs";
import { files } from "../server/local.mjs";
const store = createStore(
  process.env.OMCODE_DATA_DIR ||
    path.join(process.env.HOME, "Library/Application Support/OMCODE"),
);
try {
  for (const item of store.get("providers", [])) {
    const result = await checkProvider(store, item.id);
    console.log(
      JSON.stringify({
        provider: item.id,
        status: result.status,
        models: result.models?.length,
        error: result.error,
      }),
    );
  }
  const skills = await importSkills(store);
  console.log(JSON.stringify({ skills: skills.length }));
  const mcp = await importMcp(store);
  console.log(JSON.stringify({ mcp: mcp.map((s) => s.id) }));
  if (process.env.OMCODE_DEFAULT_PROJECT) {
    const project = await files("open", process.env.OMCODE_DEFAULT_PROJECT);
    store.set("projects", [
      project,
      ...store.get("projects", []).filter((p) => p.root !== project.root),
    ]);
  }
} finally {
  store.close();
}
