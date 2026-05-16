# Dev Acceleration Plan (Continuous)

Date: 2026-04-05  
Mode: continuous delivery with fast unblock loops

## Principle

- Missing what? Build it now.
- Too hard or blocked? Use ecosystem support and report back with options.
- Keep production-safe gates green on every cycle.

## Operating loop (repeat daily)

1. Pick highest-impact blocker from launch checklist.
2. Implement smallest complete slice end-to-end.
3. Run local gates:
   - `npm run verify:prod`
   - `npm run verify:web:gates`
   - `npm run verify:app`
   - `npm run e2e:app:mvp`
4. If strict launch mode is enabled, run:
   - `npm run e2e:app:mvp:strict`
5. Deploy directly to Cloudflare and verify:
   - `npm run deploy:prod:full`
6. Snapshot and changelog update:
   - `npm run release:snapshot`

## Phase plan (fastest completion path)

### Phase A - Close launch blockers

- Enable production API endpoints:
  - `GET /v2/reality/scenes`
  - `GET /v2/reality/runs`
- Turn on strict gate in CI:
  - set repo variable `LAUNCH_STRICT=1`
- Pass strict smoke:
  - `npm run e2e:app:mvp:strict`

### Phase B - Production hardening

- Finalize auth refresh/logout endpoints in production.
- Add request id tracing consistency across app/web/back-end responses.
- Add failure fallbacks for scene/run fetches in app UI.

### Phase C - Beta rollout execution

- Internal beta announcement with known limitations.
- Collect first 24-48h telemetry and issue triage.
- Ship quick patches in 1-day release cycles.

## Ecosystem support playbook (when blocked)

- Cloudflare issues: use Wrangler + Dashboard route/project checks.
- Expo/mobile issues: use Expo docs and package updates; keep versions pinned.
- API gaps: define temporary fallback behavior in smoke scripts and UI while backend catches up.

## Reporting format

For each cycle, report:

- Completed items
- Blockers
- Mitigation used
- Commands run and results
- Next cycle target
