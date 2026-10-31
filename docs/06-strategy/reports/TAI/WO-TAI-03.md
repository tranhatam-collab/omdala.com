# WO-TAI-03 report
Order: WO-TAI-03 (plan change closed). Status: DONE. Base SHA: e5eb70e (branch head before this commit).
Files: om-ai.omdala.com/backend/src/routes/live.ts, live/store.ts, live.routes.test.ts, live.safety.test.ts, live.plan-change.test.ts (new).
Change: `POST /v2/live/plans/upgrade` returns 403 `PLAN_CHANGE_REQUIRES_BILLING` for every caller, except a verified `facility_admin` while NODE_ENV=test. `liveStore.upgradePlan` throws outside test (test-support path). Label: PREP_UNDER_ASSUMPTION(billing authority, server-side only).
Commands (om-ai.omdala.com/backend): `npm run typecheck` pass; `npm test` 33 pass / 0 fail / 0 skip (was 29; +4 in live.plan-change.test.ts); `npm run build` pass.
Tests: 7 non-admin roles get 403 and keep `free`; forged x-role/bearer/body role gets 403; admin works only under test and gets 403 once NODE_ENV=production; store path refused outside test.
Test edits (required by the new contract, no assertion weakened elsewhere): the old "plans upgrade" test now asserts 403; tests that needed a paid plan call `liveStore.upgradePlan` directly instead of the route.
Evidence: VERIFIED_WORKTREE_ONLY.
Findings: web `upgradeLivePlan` (web/src/api/live.ts) and the plan selector in LiveExecutionCard will now receive 403; the web client is already a fail-closed stub, but the UI should show a "billing required" message (candidate for WO-TAI-05).
Next: WO-TAI-05.
