# WO-TAI-08 report
Order: WO-TAI-08 (gateway negative tests). Status: PARTIAL (command, registry and authority-router negatives done; the spec's HTTP cases do not apply). Base SHA: 5c7a79a.
Files (om-ai.omdala.com/gateway): src/dispatcher.ts, src/registry.ts, package.json (`test` now `src/*.test.ts`), src/gateway.negative.test.ts (new, 12 tests).
Finding on scope: the gateway has no HTTP listener, so there are no auth headers, CORS origins, request bodies, routes or methods to test; I did not invent a server. Its untrusted inputs are command objects, plugin registrations and the AI capability name, and those got the negative tests.
Defects fixed (all in TAI paths): dispatcher accepted any value as a command (null threw a raw TypeError) and had no id or size checks; now rejects non-objects, bad commandId, pluginId outside `^[a-z][a-z0-9_]{0,63}$`, unserializable payloads, and payloads over 64 KiB (counted in bytes). Registry let a second plugin silently replace a registered id and accepted any id; now throws `plugin_already_registered` / `invalid_plugin_id`. Router already failed closed for unknown capabilities (now tested).
Commands (om-ai.omdala.com/gateway): `npm run typecheck` pass; `npm test` 19 pass / 0 fail / 0 skip (was 7); `npm run build` pass.
Evidence: VERIFIED_WORKTREE_ONLY.
Next: if a gateway HTTP/IPC surface is planned, an order to define it with auth and origin rules first; otherwise none.
