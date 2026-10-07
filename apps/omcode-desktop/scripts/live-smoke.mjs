import { createStore } from "../server/store.mjs";
import { probeGeneration, checkProvider } from "../server/providers.mjs";
import path from "node:path";
const store = createStore(
  process.env.OMCODE_DATA_DIR ||
    path.join(process.env.HOME, "Library/Application Support/OMCODE"),
);
try {
  for (const provider of store
    .get("providers", [])
    .filter((p) => p.status === "connected")) {
    try {
      await checkProvider(store, provider.id);
      const result = await probeGeneration(store, provider.id);
      console.log(
        JSON.stringify({
          provider: result.id,
          model: result.model,
          ok: result.generationStatus === "verified",
          elapsedMs: result.latencyMs,
          error: result.generationError,
        }),
      );
    } catch (error) {
      console.log(
        JSON.stringify({
          provider: provider.id,
          ok: false,
          error: error.message,
        }),
      );
    }
  }
} finally {
  store.close();
}
