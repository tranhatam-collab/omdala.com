import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
// MCP tool servers are not AI providers: URL hygiene only, no AIAGENT allowlist.
import { validateUrl } from "./endpoint-policy.mjs";
import { APP_VERSION } from "./meta.mjs";
export async function mcpRequest(server, action, args) {
  const client = new Client({ name: "omcode", version: APP_VERSION });
  const transport = new StreamableHTTPClientTransport(
    new URL(validateUrl(server.url)),
    { requestInit: { signal: AbortSignal.timeout(15000), redirect: "error" } },
  );
  const timer = setTimeout(() => client.close().catch(() => {}), 15000);
  try {
    await client.connect(transport);
    return action === "tools"
      ? await client.listTools()
      : await client.callTool(args);
  } finally {
    clearTimeout(timer);
    await client.close().catch(() => {});
  }
}
