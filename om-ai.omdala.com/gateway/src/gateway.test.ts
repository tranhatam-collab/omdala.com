import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CommandDispatcher } from "../src/dispatcher.js";
import { PluginRegistry } from "../src/registry.js";
import { LiveProviderRouter } from "../src/liveProviderRouter.js";
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

// ─── Live Provider Router Tests ─────────────────────────────────────────

describe("LiveProviderRouter", () => {
  const router = new LiveProviderRouter();

  it("routes free plan to openai_realtime with voice_only fallback", () => {
    const decision = router.route({
      workspaceType: "personal",
      planId: "free",
      avatarRequested: false,
    });
    assert.equal(decision.primary, "openai_realtime");
    assert.deepEqual(decision.fallback, ["voice_only"]);
  });

  it("routes avatar request on business to tavus", () => {
    const decision = router.route({
      workspaceType: "business",
      planId: "business",
      avatarRequested: true,
    });
    assert.equal(decision.primary, "tavus");
    assert.ok(decision.fallback.includes("heygen"));
  });

  it("routes avatar request on non-business to heygen", () => {
    const decision = router.route({
      workspaceType: "personal",
      planId: "personal_pro",
      avatarRequested: true,
    });
    assert.equal(decision.primary, "heygen");
    assert.ok(decision.fallback.includes("tavus"));
  });

  it("routes voice-only to openai_realtime", () => {
    const decision = router.route({
      workspaceType: "family",
      planId: "personal_pro",
      avatarRequested: false,
    });
    assert.equal(decision.primary, "openai_realtime");
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
