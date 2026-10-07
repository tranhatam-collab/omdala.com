# OM-AI direct public identity boundary

Status: **source remediated; runtime release BLOCKED**

The OM-AI backend previously accepted caller-controlled `Bearer <user>:<role>`, `x-user-id`, `x-role`, request-body identity, and query identity. A caller could self-assert `owner`, choose another actor or user, read shared session state, and mutate another user's live state.

The production entrypoints now install one fail-closed boundary before route registration:

- `/health` remains a liveness endpoint.
- `/ready` returns `503 omdala_identity_authority_unavailable`.
- every direct `/v2/*` request returns the same 503 response with `cache-control: no-store`.
- request headers, query strings, and bodies are never parsed as identity.
- internal route logic receives an immutable principal only through a server-side symbol used by the test harness.
- live-session create, get, list, connect, end, memory, usage, favorite, realtime, and upgrade paths derive identity from that principal and enforce session ownership where applicable.
- transition/device actor and role values and approval requester values now come from the verified principal.

The internal route harness preserves unit coverage; `src/index.ts` and `src/server.ts` cannot select it. The direct backend remains intentionally unavailable because no approved canonical-session adapter or internal service credential exists.

## Exit evidence required before enabling a route

1. The canonical `api.omdala.com` session verifier binds the authenticated user, role, tenant, workspace, expiry, and revocation state server-side.
2. The bridge exposes an explicit allowlist of routes. Legacy reality reads, memory mutations, approval authorization, and policy-decision enforcement require separate tenant and authorization review before inclusion.
3. Runtime negative tests cover forged bearer/header/body/query identity, cross-user session access, expired and revoked sessions, wrong tenant/workspace, and replay.
4. The deployment receipt proves the exact source SHA and keeps `/ready` unavailable until those tests pass.
5. An independent reviewer approves the exact SHA before any public DNS or route is attached.

Current source validation commands:

```sh
npm --prefix om-ai.omdala.com/backend run typecheck
npm --prefix om-ai.omdala.com/backend test
npm --prefix om-ai.omdala.com/backend run build
node om-ai.omdala.com/backend/dist/e2e.js
```
