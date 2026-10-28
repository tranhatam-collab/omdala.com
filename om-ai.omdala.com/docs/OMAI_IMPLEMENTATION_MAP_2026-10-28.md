# Om AI implementation map — 2026-10-28

Order: WO-TAI-01 (parent OMAI-01). Source base: `OMCODE/infra-e2e-auto-20261026` @ `7abd962`.
Method: every row points at code and tests read in this worktree. Spec checkmarks are not counted; only code plus a passing test counts.

Status words: `IMPLEMENTED+TESTED`, `IMPLEMENTED_UNTESTED`, `PARTIAL`, `MISSING`.
Paths below are relative to `om-ai.omdala.com/`. `live.routes.test.ts` = `backend/src/live.routes.test.ts`; `boundary.test` = `backend/src/public-auth-boundary.test.ts`.

## 1. Test baseline (VERIFIED_WORKTREE_ONLY, Node v22.22.0, `npm ci` per subproject)

| Subproject | Commands run | Result |
| --- | --- | --- |
| backend | `npm run typecheck`, `npm test`, `npm run build` | typecheck 0; **19 tests, 19 pass, 0 fail, 0 skipped** (live.routes 8, routes 5, public-auth-boundary 5, ai-authority-source 1); build 0 |
| gateway | `npm test` | **7 tests, 7 pass** (PluginRegistry 3, CommandDispatcher 2, AiAuthorityRouter 2) |
| web | `npm run typecheck`, `npm run build` | both exit 0. **No unit-test runner exists**; only `web/e2e/` (not run, needs a browser and a bridge) |
| app (mobile contract) | `npm test` | node tests **15 pass**; jest **3 suites, 4 tests pass** |
| `services/ai` | not run | package is a pnpm workspace member (`workspace:*` deps) and needs the root install, which is outside this lane. It has a `typecheck` script and no tests |

Total executed: 45 passing tests, 0 failing. Direct backend remains fail-closed in production entrypoints (`/v2/*` returns 503, `/ready` 503) per `docs/audit/2026-10-08/OM_AI_PUBLIC_AUTH_BOUNDARY.md`.

## 2. Requirement map

| # | Requirement | Code | Tests | Status | Notes / gaps |
| --- | --- | --- | --- | --- | --- |
| 1 | Live session lifecycle (create, get, list, end, idempotency, ownership) | `backend/src/routes/live.ts:83,131,155,203,217`; `backend/src/live/store.ts` createSession/getSession/listSessions/endSession | live.routes.test.ts (create, create-idempotency, end-idempotency, validation 400); boundary.test (own session visible, cross-user get/list → 404) | IMPLEMENTED+TESTED | Sessions are created `blocked` and can never become `active` (no code path sets `active`/`connected_at`). Persistence is a local JSON file (`live-store.json`), see §3. |
| 2 | Persona catalogue, detail, favorites, filters | routes/live.ts:26,49,67; store.ts DEFAULT_STATE (3 personas), listPersonas/getPersona/favoritePersona | persona fields only indirectly via create tests; **no test** for list filters, detail, favorite, 404 | IMPLEMENTED_UNTESTED | `premium_required` is stored but never enforced. Custom personas (`supports_custom_personas` on plans) have no route: MISSING. Persona detail returns `supported_providers: []` and hard-coded `curriculum_bindings`. |
| 3 | Realtime call loop (connect, token, bootstrap, avatar) | routes/live.ts:131,229,255,362; `backend/src/aiAuthority.ts`; `gateway/src/aiAuthorityRouter.ts` | live.routes.test.ts (token/bootstrap 503 with no credential; avatar cannot select provider); ai-authority-source.test.ts (no provider/credential/egress in source); gateway.test.ts (chat routed, realtime blocked) | PARTIAL | Fail-closed gate is real and tested. The call loop itself does not exist: every connect/token/bootstrap returns 503 `ai_authority_unavailable`. Depends on the provider AI lane / API AIAGENT realtime contract. |
| 4 | Recap | routes/live.ts:155-200 | end-idempotency test exercises the route but does not assert the summary | PARTIAL | `summary` is a **hard-coded static object** (topics, corrections, `lesson_daily_routine_a2_02`), not derived from a session. It must not be presented as a real recap. Real recap needs the authority lane. |
| 5 | Transcripts | none | none | MISSING | No transcript storage, visibility control, or retention route. Spec: `AI_OM_LIVE_API_CONTRACT_V1.md` §12-§13, `AI_OM_MEMORY_MODEL_V1.md`. |
| 6 | Memory profile (display name, timezone, target language, correction style) | routes/live.ts:281,288; store.ts get/patchMemoryProfile (timezone validated via Intl) | none for these routes (only the verified-principal path in boundary.test touches create) | IMPLEMENTED_UNTESTED | `target_language` has no validation (type or length). A null/absent JSON body passes the `?.` validators and then throws at `body.display_name` (500). |
| 7 | Memory controls: delete, export, retention, per-profile scope | none in live; `routes/memory.ts` is the legacy reality alias store | none | MISSING | Spec requires delete session history, export summaries, retention classes, transcript visibility (`AI_OM_MEMORY_MODEL_V1.md` §7-§9, `AI_OM_DATA_RETENTION_POLICY.md`). Legacy `/v2/reality/memory/*` aliases are global (not user-scoped) and `/preferences` echoes arbitrary bodies; the boundary doc already marks reality memory mutations as needing separate tenant review. |
| 8 | Metering and free 30-minute quota | store.ts getUsageToday (day key by profile timezone, free limit by plan), endSession (free/premium split, idempotent) | live.routes.test.ts end-idempotency asserts 1800 remaining and 0 used | PARTIAL | The free/premium split with non-zero billable seconds is **unreachable and untested** because sessions never go `active`. Paid plans have `daily_free_seconds: 0` and no quota or spend cap. No org/workspace quota. |
| 9 | Plan gating | store.ts PLAN_DEFINITIONS, upgradePlan; routes/live.ts:329,334 | live.routes.test.ts (upgrade + list not asserted for list) | PARTIAL | Defects found: (a) `plan_context` from the request body overrides the stored subscription in `createSession`; (b) `avatar_enabled` is not checked against plan or persona `supports_avatar`; (c) `POST /plans/upgrade` lets any verified user set any plan with no billing evidence. (a)/(b) are inside this lane; (c) needs the billing authority (Team 2 / data authority). |
| 10 | Moderation | routes/live.ts:348 (`/moderation/check`, 4 self-harm substrings) | live.routes.test.ts one positive case | PARTIAL | Only one positive case tested; no negative, case, empty-body, or non-string input tests; handler throws on a missing body or non-string `text`. Not called from session create/end or any transcript path, so it gates nothing. No violence/abuse/minor-sexual-content classes, no multilingual patterns (the product serves `vi`/`en`). |
| 11 | Child safety | persona `safe_for_children` flag + list filter (store.ts, routes/live.ts:26); persona detail `safety_profile` | none | PARTIAL | The flag is advisory only: nothing prevents a child context from creating a session with `safe_for_children: false` persona (`listener_gentle_01`). No child profile, age band, or guardian allowlist exists in live state. Roles in `backend/src/auth.ts` are home roles (`family_member`, `family_admin`, …) and the live routes ignore `auth.role`. |
| 12 | Family safety (guardian controls, transcript visibility for children) | none | none | MISSING | Spec `AI_OM_LIVE_API_CONTRACT_V1.md` §15 (`/family/profiles`, controls). Needs workspace/tenant model from the data authority. |
| 13 | Organization safety (org personas, admin approval, org usage) | none | none | MISSING | Spec §16. No workspace id in `LiveSession`; live store keys everything by `user_id` only. |
| 14 | Account / preferences UX (web) | `web/src/components/LiveExecutionCard.tsx`, `web/src/api/live.ts` | typecheck + build only | IMPLEMENTED_UNTESTED | The web client is a stub: `web/src/api/client.ts` returns `canonical_session_bridge_unavailable` for every call, so the card cannot reach the backend. No component tests. |
| 15 | Billing UX | web plan selector in LiveExecutionCard calls `upgradeLivePlan` | none | PARTIAL | Direct plan change only; no checkout, invoice, or entitlement display. Blocked on billing authority. |
| 16 | Verified-session bridge | `backend/src/publicBoundary.ts`, `backend/src/auth.ts` (`bindVerifiedAuthContext`, `requireSensitiveAuth`), `backend/src/testSupport.ts`; clients: `app/src/session/sessionStore.tsx`, `web/src/api/client.ts`, `shared/api-origin-policy.ts` | boundary.test (5), app node tests clientSessionBoundary/nativeClientBoundary/apiOriginPolicy, app jest sessionStore | IMPLEMENTED+TESTED (consumer side) | Consumer side only. The producer, a canonical `api.omdala.com` session verifier plus allowlisted route bridge, does not exist; all 5 exit-evidence items in the boundary doc remain open. |
| 17 | Mobile surfaces | RN app `app/src/screens/*` (Scenes, Timeline, RunDetail, Settings, SignIn); iOS SwiftUI `ios/AIOmApp/Voice,Memory,Settings,…`; `android/` has README only | app: 15 node + 4 jest | PARTIAL | RN app has **no live-session, persona, usage, or memory screens**. iOS Swift sources exist but are not compiled or tested in CI and were not examined for behaviour here; treat as UNVERIFIED. Android: MISSING (docs only). |
| 18 | Provider-side AI helpers | `services/ai/src/index.ts` (`getAiActionSuggestions`, static Vietnamese suggestions) | none | IMPLEMENTED_UNTESTED | Not the live call path; no provider call. Typecheck not run here (workspace install). |

## 3. Dependencies on other teams

| Dependency | Needed by rows | Owner | State |
| --- | --- | --- | --- |
| Auth bridge: canonical session verifier and route allowlist at `api.omdala.com` that binds user, role, tenant, workspace, expiry, revocation, and an internal service credential | 1, 6, 16 (all production use) | Team 2 (services/api) | Open. Backend, web and mobile are fail-closed consumers. |
| Data authority CTL-03: durable store, tenant/workspace model, retention and deletion semantics | 1, 7, 8, 12, 13 | CTL-03 | Open. Live state is a local JSON file; no tenant dimension; retention/delete/export cannot be built on it. |
| Provider AI lane: approved realtime/chat contract behind `omdala_api_aiagent` (token issuance, avatar, recap/transcript generation, moderation classifier) | 3, 4, 5, 10 | Provider AI lane / API AIAGENT | Open. `aiAuthority.ts` pins `status: blocked`. No provider call is allowed from Om AI. |
| Billing / entitlement authority | 9, 15 | Team 2 + data authority | Open. |
| Independent review of exact SHA before any route is attached | all | Team 4 | Per boundary doc. |

## 4. Candidates for WO-TAI-02 (inside `om-ai.omdala.com/backend`, no provider calls)

1. Tests for moderation negatives and input hardening; fix handler crash on missing/non-string `text`.
2. Plan gating: derive the plan from the stored subscription, not `plan_context`; reject avatar on plans or personas that do not support it.
3. Child safety: add a `child_profile`-style guard on session create so a child context cannot start a non-child-safe persona. Needs a verified signal; only a caller-declared guard is possible today (see WO-TAI-02 notes).
4. Persona list/detail/favorite, memory profile validation, usage endpoint tests.
5. Family/org controls, transcripts, export/delete: blocked on CTL-03; list only.
