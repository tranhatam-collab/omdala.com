# Om AI API contract against code, 2026-10-30

Order WO-TAI-10. Sources: `AI_OM_API_CONTRACT_V1.md` section 5 (base paths `/v2/live/*`, labelled A) and `AI_OM_LIVE_API_CONTRACT_V1.md` (paths relative to `/v2/live`, labelled L). Code: `backend/src/routes/live.ts`, `health.ts`, `app.ts`. In production every `/v2/*` call returns 503 `omdala_identity_authority_unavailable` until the session bridge exists, so "implemented" means the route logic with a verified principal injected (the test harness).

Tests: `live.contract.test.ts` (new, 10 contract tests: status codes, error codes, required fields), `live.routes.test.ts`, `live.safety.test.ts`, `live.plan-change.test.ts`, `live.metering.test.ts`, `public-auth-boundary.test.ts`.

## Documented endpoints

| Endpoint | Doc | State | Test |
| --- | --- | --- | --- |
| GET /personas | A, L | implemented | contract, safety |
| GET /personas/:id | A, L | implemented | contract, safety |
| POST /personas/:id/favorite | A, L | implemented | contract, safety |
| POST /personas/custom | A, L | missing | contract (404) |
| POST /sessions/create | A, L | implemented, shape differs (below) | contract, routes, safety |
| POST /sessions/:id/connect | A, L | implemented as fail-closed 503 | contract |
| POST /sessions/:id/end | A, L | implemented, recap is a static placeholder | contract, routes, metering (store) |
| GET /sessions/:id | A, L | implemented | contract, boundary |
| GET /sessions | A, L | implemented | contract, boundary |
| POST /realtime/token | A, L | implemented as fail-closed 503 | contract, routes |
| POST /realtime/session/bootstrap | A, L | implemented as fail-closed 503 | contract, routes |
| GET /memory/profile | A, L | implemented | contract, safety |
| PATCH /memory/profile | A, L | implemented | safety |
| GET /memory/personas/:id | A, L | missing | contract (404) |
| DELETE /memory/personas/:id | A, L | missing | contract (404) |
| GET /sessions/:id/recap (A) / GET /memory/sessions/:id/summary (L) | A, L | missing; the two docs disagree on the path | contract (404 for the A path) |
| GET /curriculum/paths | A, L | missing | contract (404) |
| GET /lessons/:id, POST /lessons/:id/start, POST /lessons/:id/complete | A, L | missing | contract (404) |
| GET /usage/today | A, L | implemented | contract, safety |
| GET /usage/cycle | A, L | missing | contract (404) |
| GET /usage/history | L | missing | none |
| GET /plans | A, L | implemented | contract |
| POST /plans/upgrade | A, L | implemented but closed: 403 `PLAN_CHANGE_REQUIRES_BILLING` (WO-TAI-03) | contract, plan-change |
| GET /subscriptions/current | L | missing | none |
| POST /moderation/check | A, L | implemented, keyword screen | contract, safety, bypass |
| POST /moderation/escalate | A, L | missing | contract (404) |
| GET /avatar/providers | A, L | implemented, always `providers: []` | contract, routes |
| POST /avatar/session/start, POST /avatar/session/end | A, L | missing | contract (404) |
| GET /provider/routes (A) / GET /providers (L) | A, L | missing | contract (404 for the A path) |
| POST /auth/session, GET /me, POST /auth/refresh | L | not Om AI's: canonical session belongs to the API bridge (Team 2) | boundary |
| GET /workspaces, POST /workspaces/switch | L | missing, needs tenant model (CTL-03) | none |
| Family (2), School (3), Business (3), Analytics (1) | L | missing | none |
| Shared platform: /v1/account/profile, /v1/account/preferences, /v1/billing/subscriptions, /v1/billing/usage | A | not in this service by design | none |

## Undocumented in the two contracts

| Endpoint | Note |
| --- | --- |
| GET /health, GET /ready | liveness and an always-503 readiness; tested in public-auth-boundary |
| GET /openapi.json, /docs | only when `OM_AI_ENABLE_DOCS=1` |
| `/v2/reality/*` (devices, scenes, runs, approvals, transitions, plans/:id, proofs, memory aliases and preferences) | legacy-transition per AI_OM_API_CONTRACT_V1 section 7; covered by `routes.test.ts`, not extended here. `/v2/reality/memory/*` is global, not per user (tenant review needed) |

## Divergences between the contract text and the code

1. Envelope: contracts show `{ ok, data, meta, error }`; code returns `{ data, error, meta? }` with no `ok`; errors are `{ code, reason }`.
2. `POST /sessions/create`: contract returns `status: "created"`, `usage_snapshot`, `provider_decision`; code returns `status: "blocked"`, `usage`, `ai_authority`, `execution_ready: false`, `avatar{enabled, provider: null, mode: "blocked"}` and accepts a flat `avatar_enabled` instead of `transport_preferences`. Request fields `workspace_id`, `profile_id`, `transport_preferences` are ignored.
3. Auth is a server-bound principal, not a documented bearer token; request-supplied identity is ignored.
4. Added error codes not in `AI_OM_ERROR_CODE_MATRIX.md`: `ai_authority_unavailable`, `plan_upgrade_required`, `persona_not_child_safe`, `content_requires_escalation`, `PLAN_CHANGE_REQUIRES_BILLING`, `omdala_identity_authority_unavailable`.
5. Path parameter names differ (`:id` vs `:session_id`); harmless.

Proposed follow-ups (not done): update the two contract documents to the envelope and create-shape above, or change the code; add the missing endpoints only when their dependencies exist (recap and memory delete need CTL-03, curriculum needs content, escalation needs the AI authority).
