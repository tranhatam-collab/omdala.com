# services/api

Cloudflare Worker skeleton for `api.omdala.com`.

## Endpoints

- `GET /api/health`
- `GET /api/session`
- `POST /api/auth/magic-link`

## Commands

From the repo root:

```bash
npm run dev:api
npm run build:api
```

## PostgreSQL bootstrap check (PREP_UNDER_ASSUMPTION(CTL-03))

`pnpm --filter @omdala/api run test:postgres-bootstrap` applies
`infra/postgres/migrations/*.sql` to a throwaway database, checks table, index
and constraint counts against what the migrations declare, re-applies them
(idempotency), and re-bootstraps after `DROP SCHEMA omdala CASCADE`. The suite
is skipped unless `OMDALA_TEST_DATABASE_URL` points at a disposable local
PostgreSQL server whose role may `CREATE DATABASE`; it creates and drops its
own `omdala_bootstrap_*` database and never uses the named database itself.

CI can provide one with a service container, for example
`postgres:17` (`POSTGRES_HOST_AUTH_METHOD=trust`, port 5432) and
`OMDALA_TEST_DATABASE_URL=postgresql://postgres@127.0.0.1:5432/postgres`.
There are no down migrations: `compatibility.json` declares schema rollback
out of scope, so the supported reset is drop-and-rebootstrap.
