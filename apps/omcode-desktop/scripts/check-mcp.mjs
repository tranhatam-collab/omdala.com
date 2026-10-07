import fs from "node:fs/promises";
import { createStore } from "../server/store.mjs";
import { mcpRequest } from "../server/mcp.mjs";

if (!process.env.OMCODE_DATA_DIR)
  throw new Error("Set OMCODE_DATA_DIR explicitly.");
const store = createStore(process.env.OMCODE_DATA_DIR);
const results = [];
try {
  const servers = store.get("mcp", []);
  for (const item of servers) {
    try {
      const result = await mcpRequest(item, "tools");
      item.tools = result.tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
        readOnly: !!tool.annotations?.readOnlyHint,
      }));
      item.status = "connected";
      item.error = null;
      results.push({
        id: item.id,
        status: item.status,
        tools: item.tools.length,
      });
    } catch (error) {
      item.status = "needs_connection";
      item.error = "Cần kết nối hoặc cấp OAuth riêng cho OMCODE.";
      results.push({
        id: item.id,
        status: item.status,
        reason: error.message.slice(0, 300),
      });
    }
    console.log(JSON.stringify(results.at(-1)));
  }
  store.set("mcp", servers);
  await fs.writeFile(
    "evidence/mcp-check.json",
    JSON.stringify({ time: new Date().toISOString(), results }, null, 2),
  );
} finally {
  store.close();
}
