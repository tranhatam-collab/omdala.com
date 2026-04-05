# 5-minute handoff checklist: enable `api.omdala.com`

Use this checklist in Cloudflare dashboard to make the API live on one canonical domain without `1014` errors.

## 1) Verify zone and Worker are in the same account

- Zone: `omdala.com`
- Worker service: `omdala-api`
- Environment: `production`
- Account must match zone owner (`f3f9e76222dcb488d5e303e29e8ba192`)

Path:

- `Workers & Pages` -> `omdala-api` -> `production`

## 2) Remove conflicting `api` DNS records first

Path:

- `DNS` -> `Records` -> filter `api`

Delete all existing `api` records that point to `*.workers.dev` (especially CNAME).
This prevents Cloudflare `error code: 1014` (cross-user CNAME).

## 3) Create Worker-compatible DNS record

Path:

- `DNS` -> `Records` -> `Add record`

Create:

- Type: `A`
- Name: `api`
- IPv4: `192.0.2.1` (placeholder)
- Proxy status: `Proxied` (orange cloud)

## 4) Bind Worker route

Path:

- `Workers & Pages` -> `omdala-api` -> `Settings` -> `Triggers` -> `Add route`

Create route:

- Route pattern: `api.omdala.com/*`
- Environment/script: `production` for `omdala-api`

## 5) Deploy and verify

From repo root:

```bash
pnpm --filter @omdala/api run deploy
API_BASE_URL="https://api.omdala.com" bash ./scripts/verify-api-omdala.sh
```

Expected:

- `/health` -> HTTP 200
- `/v2/reality/health` -> HTTP 200
- `/v2/reality/nodes` -> HTTP 200 with `ok=true`

## 6) Quick email smoke test

```bash
curl -sS --max-time 30 -X POST https://api.omdala.com/v1/auth/magic-link/request \
  -H 'content-type: application/json' \
  --data '{"email":"tranhatam@iai.one","redirectTo":"/dashboard"}'
```

Expected: `{"ok":true,"data":{"sent":true,...}}`

## Rollback (fast)

- Remove route `api.omdala.com/*` from Worker triggers, or
- Switch route to previous stable Worker script,
- Keep proxied `A api` record in place.
