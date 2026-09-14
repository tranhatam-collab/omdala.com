import { createStore } from "../server/store.mjs";
import {
  checkProvider,
  probeGeneration,
  providerKey,
} from "../server/providers.mjs";
const store = createStore(process.env.OMCODE_DATA_DIR);
try {
  for (const id of ["google", "cerebras"]) {
    await checkProvider(store, id);
    let p = store.get("providers", []).find((p) => p.id === id);
    const candidates =
      id === "google"
        ? ["gemini-3.8-flash", "gemini-3.5-flash", "gemini-3.1-flash-lite"]
        : ["qwen-3.8-27b", "gemma-4-31b"];
    for (const candidate of candidates.filter((c) => p.models.includes(c))) {
      const list = store.get("providers", []);
      p = list.find((p) => p.id === id);
      p.model = candidate;
      store.set("providers", list);
      const result = await probeGeneration(store, id);
      console.log(
        JSON.stringify({
          provider: id,
          model: candidate,
          status: result.generationStatus,
          error: result.generationError,
        }),
      );
      if (result.generationStatus === "verified") break;
      if (result.generationHttpStatus === 402) break;
    }
  }
  for (const id of ["deepseek", "cerebras"]) {
    const p = store.get("providers", []).find((p) => p.id === id);
    if (p.generationStatus === "verified") continue;
    const key = await providerKey(id);
    const r = await fetch(`${p.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: p.model,
        messages: [{ role: "user", content: "OK" }],
        max_tokens: 8,
      }),
      signal: AbortSignal.timeout(20000),
    });
    const data = await r.json().catch(() => ({}));
    console.log(
      JSON.stringify({
        provider: id,
        status: r.status,
        errorCode: data.error?.code,
        errorType: data.error?.type,
        message: String(data.error?.message || "")
          .replaceAll(key, "[redacted]")
          .slice(0, 300),
      }),
    );
  }
} finally {
  store.close();
}
