# RELEASE HANDOFF CHECKLIST - APP + API

Status: Production verified (2026-04-04)

Owner surfaces:

- API: `https://api.omdala.com`
- App: `https://app.omdala.com`
- Web: `https://omdala.com` and `https://omdala-web.pages.dev`

## 1) Scope Lock

- Core app auth flow is stabilized (magic-link request, session persistence, dashboard gate).
- API v2 reality namespace is available with DB mode + seed fallback mode.
- Operational smoke/runbook assets are present for incident response and daily checks.

## 2) Pre-Release Config Checks

- Cloudflare Worker `omdala-api` uses correct account/zone for `omdala.com`.
- Route or custom domain binding for `api.omdala.com` is active.
- Hyperdrive binding is present in production.
- Required Worker secrets exist:
  - `DATABASE_URL`
  - `MAIL_API_KEY`
  - `MAGIC_LINK_SECRET`

## 3) API Verification

Run from repo root:

```bash
bash ./scripts/verify-api-omdala.sh
```

Expected:

- `GET /health` -> 200
- `GET /v2/reality/health` -> 200
- `GET /v2/reality/nodes` -> 200 with JSON `data/meta`

Optional live write checks:

- `POST /v1/auth/magic-link/request` returns success envelope.
- `POST /v1/contact` returns `received: true`.
- `POST /v1/auth/access-request` returns `received: true`.

Rate-limit hardening (best-effort in Worker isolate):

- `POST /v1/auth/magic-link/request`: IP 20 / 15m, email 5 / 15m
- `POST /v1/contact`: IP 10 / 15m, email 5 / 15m
- `POST /v1/auth/access-request`: IP 10 / 15m, email 5 / 15m
- Endpoint error code on threshold: `rate_limited` with HTTP `429`

Recommendation for hard 100% edge enforcement:

- Add Cloudflare WAF Rate Limiting rules for the three paths above.

## 4) App Verification

Run from repo root:

```bash
pnpm --filter @omdala/app build
pnpm --filter @omdala/app typecheck
pnpm --filter @omdala/app test:e2e:prod
```

Expected:

- Build and typecheck pass.
- Prod smoke passes for:
  - login form submission status
  - dashboard auth gate behavior under missing session conditions

## 5) Web Verification

Run from repo root:

```bash
pnpm --filter @omdala/web build
pnpm --filter @omdala/web typecheck
pnpm --filter @omdala/web test:e2e
pnpm --filter @omdala/web test:e2e:prod
```

Expected:

- Build and typecheck pass.
- Local e2e validates language switch behavior.
- Prod e2e passes after pages deployment includes the latest language sync changes.

## 6) Ops / Reliability Verification

Run focused smoke assertions:

```bash
bash scripts/smoke_v2_reality.assert_only.sh
bash scripts/ops_v2_build_log_cache.sh reports/ops/cache/v2-log-query-cache.sample.json /tmp/omdala_log_cache_test.json
```

Optional full chain:

```bash
bash scripts/smoke_v2_reality_chain.sh
```

## 7) Release Evidence Bundle

Capture and keep:

- command outputs for matrix checks
- API endpoint response snippets (`health`, `v2/reality/health`, `v2/reality/nodes`)
- app/web e2e summary lines
- deployment identifier/version for API and app/web surfaces

Recorded evidence (2026-04-04):

- `POST https://api.omdala.com/v1/auth/magic-link/request` -> `ok:true`
- `POST https://api.omdala.com/v1/contact` -> `ok:true`
- `POST https://api.omdala.com/v1/auth/access-request` -> `ok:true`
- `POST https://mail.iai.one/_mail/emails` from `noreply@omdala.com` -> valid message id
- `POST https://mail.iai.one/_mail/emails` from `noreply@omdalat.com` -> valid message id
- `app.omdala.com/login` UI submit smoke -> pass
- App production pages deploy alias observed: `https://61352238.omdala-app.pages.dev`
- App production smoke: `pnpm --filter @omdala/app test:e2e:prod` -> `2 passed`
- Web production pages deploy alias observed: `https://09ad7a10.omdala-web.pages.dev`
- Web release alias smoke: `pnpm test:web:e2e:release` -> pass

## 8) Rollback Plan

- API: rebind route/custom-domain to previous known-good worker deployment.
- App/Web: redeploy previous known-good pages build.
- Keep DNS unchanged unless DNS itself is root cause.

## 9) Working Mode (Post-Handoff)

- After this handoff cycle, development can proceed in local-first mode.
- Deploy directly from machine when requested.
- Do not push to GitHub unless explicitly requested.

## 10) One-Command Matrix

Run from repo root:

```bash
pnpm release:verify
```

Optional strict canonical web check:

```bash
VERIFY_WEB_CANONICAL=true pnpm release:verify
```

## 11) One-Command Deploy Pipeline

Run full deploy + verify (default: production surfaces):

```bash
pnpm release:deploy
```

Deploy single surface:

```bash
pnpm release:deploy:api-only
pnpm release:deploy:app-only
pnpm release:deploy:web-only
```

Deploy + verify only one surface:

```bash
pnpm release:deploy:api-only:verify
pnpm release:deploy:app-only:verify
pnpm release:deploy:web-only:verify
```

Verify only one surface (no deploy):

```bash
pnpm release:verify:api-only
pnpm release:verify:app-only
pnpm release:verify:web-only
```

Run preview deploy + verify:

```bash
pnpm release:deploy:preview
```

Useful toggles:

```bash
DEPLOY_API=false pnpm release:deploy
DEPLOY_WEB=false pnpm release:deploy
SKIP_VERIFY=true pnpm release:deploy
API_ENV=staging APP_BRANCH=preview WEB_BRANCH=preview pnpm release:deploy
```
