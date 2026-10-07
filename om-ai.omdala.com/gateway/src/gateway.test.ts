import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CommandDispatcher } from "../src/dispatcher.js";
import { PluginRegistry } from "../src/registry.js";
import { AiAuthorityRouter } from "../src/aiAuthorityRouter.js";
import type { GatewayPlugin } from "../src/plugin.js";

// ─── Plugin Registry Tests ──────────────────────────────────────────────

describe("PluginRegistry", () => {
  it("registers and retrieves a plugin", () => {
    const registry = new PluginRegistry();
    const plugin = makeStubPlugin("p1");
    registry.register(plugin);
    assert.equal(registry.get("p1"), plugin);
  });

  it("returns undefined for unknown plugin", () => {
    const registry = new PluginRegistry();
    assert.equal(registry.get("unknown"), undefined);
  });

  it("lists all registered plugins", () => {
    const registry = new PluginRegistry();
    registry.register(makeStubPlugin("p1"));
    registry.register(makeStubPlugin("p2"));
    assert.equal(registry.list().length, 2);
  });
});

// ─── Command Dispatcher Tests ───────────────────────────────────────────

describe("CommandDispatcher", () => {
  it("dispatches command to the correct plugin", async () => {
    const registry = new PluginRegistry();
    registry.register(makeStubPlugin("p1"));
    const dispatcher = new CommandDispatcher((id) => registry.get(id));

    const result = await dispatcher.dispatch({
      commandId: "cmd-1",
      pluginId: "p1",
      payload: { action: "on" },
    });

    assert.equal(result.status, "dispatched");
    assert.equal(result.commandId, "cmd-1");
  });

  it("throws when plugin not found", async () => {
    const registry = new PluginRegistry();
    const dispatcher = new CommandDispatcher((id) => registry.get(id));

    await assert.rejects(
      dispatcher.dispatch({ commandId: "cmd-1", pluginId: "missing", payload: {} }),
      /plugin_not_found:missing/,
    );
  });
});

// ─── AI authority boundary tests ────────────────────────────────────────

describe("AiAuthorityRouter", () => {
  const router = new AiAuthorityRouter();

  it("routes chat only through the OMDALA API AIAGENT contract", () => {
    const decision = router.route("chat");
    assert.equal(decision.authority, "omdala_api_aiagent");
    assert.equal(decision.executionPath, "/v1/ai/chat");
    assert.equal(decision.status, "routed");
    assert.equal(decision.directProviderEgress, false);
  });

  it("fails closed for realtime capabilities without an authority endpoint", () => {
    for (const capability of ["realtime_voice", "realtime_avatar"] as const) {
      const decision = router.route(capability);
      assert.equal(decision.authority, "omdala_api_aiagent");
      assert.equal(decision.executionPath, null);
      assert.equal(decision.status, "blocked");
      assert.equal(decision.directProviderEgress, false);
    }
  });
});

// ─── Helpers ────────────────────────────────────────────────────────────

function makeStubPlugin(id: string): GatewayPlugin {
  return {
    pluginId: id,
    name: `stub-${id}`,
    protocol: "other",
    async discover() {},
    async execute() {},
    async reportState() {
      return {};
    },
    async healthCheck() {
      return true;
    },
    async shutdown() {},
  };
}
