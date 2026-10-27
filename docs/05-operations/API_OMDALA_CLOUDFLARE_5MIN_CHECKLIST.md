# 5-minute handoff checklist: enable `api.omdala.com`

Use this checklist in Cloudflare dashboard to make the API live on one canonical domain.

## 1) Verify zone and Worker

- Zone: `omdala.com`
- Worker service: `omdala-api`
- Environment: `production`

Path:

- `Workers & Pages` -> `omdala-api` -> `production`

## 2) Configure Worker route (or custom domain)

Preferred (legacy route mode in this repo):

- Ensure `services/api/wrangler.toml` includes:
  - `[[routes]]`
  - `pattern = "api.omdala.com/*"`
  - `zone_name = "omdala.com"`

Alternative (Cloudflare UI mode):

- `Workers & Pages` -> `omdala-api` -> `Settings` -> `Domains & Routes` -> `Add custom domain`
- Domain: `api.omdala.com`
- Environment/script: `production`

## 3) DNS record requirements

- Do not point `api.omdala.com` directly to `*.workers.dev` if it causes `1014`.
- Remove conflicting `api` DNS records before binding route/custom-domain.
- If route mode is used, keep DNS as proxied record resolved by Cloudflare.

## 4) Confirm deployment behavior

- Ensure latest `production` deployment is selected for `omdala-api`.
- Ensure Hyperdrive binding is present in the same account as zone.
- Confirm required secrets exist on production Worker:
  - `DATABASE_URL`
  - `MAIL_API_KEY`
  - `MAGIC_LINK_SECRET`

## 5) Run verification script

From repo root:

```bash
API_BASE_URL="https://api.omdala.com" bash ./scripts/verify-api-omdala.sh
```

Expected:

- `/health` -> HTTP 200
- `/v2/reality/health` -> HTTP 200
- `/v2/reality/nodes` -> HTTP 200 and JSON with `data`/`meta`

## Rollback (fast)

- Remove `api.omdala.com/*` route (or custom domain binding), or
- Rebind to previous stable Worker deployment, and
- Keep DNS in place.
