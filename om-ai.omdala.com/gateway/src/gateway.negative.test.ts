import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CommandDispatcher, MAX_COMMAND_PAYLOAD_BYTES } from "./dispatcher.js";
import { PluginRegistry } from "./registry.js";
import { AiAuthorityRouter } from "./aiAuthorityRouter.js";
import type { GatewayPlugin } from "./plugin.js";

// The gateway is a local library with no HTTP listener: it has no auth headers, CORS, routes or
// methods to test. Its untrusted inputs are command objects and plugin registrations, plus the
// AI capability name, so the negative tests target those.

function stub(id: string, onExecute?: (payload: unknown) => void | Promise<void>): GatewayPlugin {
  return {
    pluginId: id,
    name: `stub-${id}`,
    protocol: "other",
    async discover() {},
    async execute(payload) {
      await onExecute?.(payload);
    },
    async reportState() {
      return {};
    },
    async healthCheck() {
      return true;
    },
    async shutdown() {},
  };
}

function setup(onExecute?: (payload: unknown) => void | Promise<void>) {
  const registry = new PluginRegistry();
  registry.register(stub("local_ip", onExecute));
  return new CommandDispatcher((id) => registry.get(id));
}

describe("CommandDispatcher rejects malformed commands before any plugin runs", () => {
  it("rejects non-object commands", async () => {
    let executed = 0;
    const dispatcher = setup(() => {
      executed += 1;
    });
    for (const bad of [null, undefined, "cmd", 42, [], true]) {
      await assert.rejects(dispatcher.dispatch(bad as never), /invalid_command/);
    }
    assert.equal(executed, 0);
  });

  it("rejects missing, blank, non-string, or oversized commandId", async () => {
    const dispatcher = setup();
    for (const commandId of [undefined, "", "   ", 7, {}, "x".repeat(129)]) {
      await assert.rejects(
        dispatcher.dispatch({ commandId, pluginId: "local_ip", payload: {} } as never),
        /invalid_command:commandId/,
      );
    }
  });

  it("rejects pluginId that is not a lowercase identifier, including prototype and path tricks", async () => {
    let executed = 0;
    const dispatcher = setup(() => {
      executed += 1;
    });
    for (const pluginId of [undefined, "", 5, "LOCAL_IP", "local-ip", "../local_ip", "local ip", "__proto__", "x".repeat(65), "local_ip\n"]) {
      await assert.rejects(
        dispatcher.dispatch({ commandId: "c1", pluginId, payload: {} } as never),
        /invalid_command:pluginId/,
        String(pluginId),
      );
    }
    assert.equal(executed, 0);
  });

  it("treats Object.prototype names as unknown plugins, not as plugin lookups", async () => {
    const dispatcher = setup();
    for (const pluginId of ["constructor", "tostring", "hasownproperty"]) {
      await assert.rejects(
        dispatcher.dispatch({ commandId: "c1", pluginId, payload: {} }),
        new RegExp(`plugin_not_found:${pluginId}`),
      );
    }
  });

  it("rejects oversized payloads and accepts one at the limit", async () => {
    let executed = 0;
    const dispatcher = setup(() => {
      executed += 1;
    });
    const oversized = { data: "x".repeat(MAX_COMMAND_PAYLOAD_BYTES) };
    await assert.rejects(dispatcher.dispatch({ commandId: "c1", pluginId: "local_ip", payload: oversized }), /payload_too_large/);
    assert.equal(executed, 0);

    const overhead = JSON.stringify({ data: "" }).length;
    const atLimit = { data: "x".repeat(MAX_COMMAND_PAYLOAD_BYTES - overhead) };
    const result = await dispatcher.dispatch({ commandId: "c2", pluginId: "local_ip", payload: atLimit });
    assert.equal(result.status, "dispatched");
    assert.equal(executed, 1);
  });

  it("rejects payloads that cannot be serialized (cycles, BigInt)", async () => {
    const dispatcher = setup();
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    for (const payload of [cyclic, { n: 10n }]) {
      await assert.rejects(dispatcher.dispatch({ commandId: "c1", pluginId: "local_ip", payload }), /invalid_command:payload/);
    }
  });

  it("counts multi-byte payloads by bytes, not characters", async () => {
    const dispatcher = setup();
    const payload = { text: "é".repeat(MAX_COMMAND_PAYLOAD_BYTES / 2) };
    await assert.rejects(dispatcher.dispatch({ commandId: "c1", pluginId: "local_ip", payload }), /payload_too_large/);
  });

  it("still reports unknown plugins and propagates plugin failures without marking dispatched", async () => {
    const dispatcher = setup(() => {
      throw new Error("device_offline");
    });
    await assert.rejects(dispatcher.dispatch({ commandId: "c1", pluginId: "ble", payload: {} }), /plugin_not_found:ble/);
    await assert.rejects(dispatcher.dispatch({ commandId: "c2", pluginId: "local_ip", payload: {} }), /device_offline/);
  });

  it("accepts an undefined payload", async () => {
    const dispatcher = setup();
    const result = await dispatcher.dispatch({ commandId: "c1", pluginId: "local_ip", payload: undefined });
    assert.equal(result.status, "dispatched");
  });
});

describe("PluginRegistry refuses unsafe registrations", () => {
  it("does not let a second plugin silently replace a registered id", () => {
    const registry = new PluginRegistry();
    const first = stub("local_ip");
    registry.register(first);
    assert.throws(() => registry.register(stub("local_ip")), /plugin_already_registered:local_ip/);
    assert.equal(registry.get("local_ip"), first);
    assert.equal(registry.list().length, 1);
  });

  it("rejects invalid plugin ids and non-plugin values", () => {
    const registry = new PluginRegistry();
    for (const id of ["", "Bad", "has space", "../x", "__proto__", "9lives"]) {
      assert.throws(() => registry.register(stub(id)), /invalid_plugin_id/, id);
    }
    assert.throws(() => registry.register(null as never), /invalid_plugin_id/);
    assert.throws(() => registry.register({} as never), /invalid_plugin_id/);
    assert.equal(registry.list().length, 0);
  });
});

describe("AiAuthorityRouter fails closed for unknown capabilities", () => {
  const router = new AiAuthorityRouter();

  it("never routes anything but the exact chat capability", () => {
    for (const capability of ["CHAT", "chat ", "chat\n", "", "__proto__", "completion", "realtime", undefined, null, 1]) {
      const decision = router.route(capability as never);
      assert.equal(decision.status, "blocked", String(capability));
      assert.equal(decision.executionPath, null, String(capability));
      assert.equal(decision.directProviderEgress, false);
      assert.equal(decision.authority, "omdala_api_aiagent");
    }
  });
});
