# Release Checklist

## Dev

- `npm run ci` passes
- `npm --prefix backend run e2e` passes
- `npm run build:all` passes
- `docker compose up --build` starts all services
- `/health`, `/ready`, `/openapi.json`, `/docs` accessible

## Staging

- deploy from tagged commit
- verify env vars are set per service
- run smoke test against staging backend
- verify approval and proof flow with real auth mode
- verify observability dashboards and logs

## Production

- change auth mode from dev to production-safe config
- rotate secrets and validate token scopes
- run migration plan if persistence backend changes
- run smoke test on production readiness endpoint
- verify rollback plan and on-call ownership
