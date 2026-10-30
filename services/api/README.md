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

## Local stand-up (PREP_UNDER_ASSUMPTION(CTL-03))

`OMDALA_LOCAL_PG_URL=postgresql://<user>@127.0.0.1:5432/postgres pnpm --filter @omdala/api run local:stack`
creates a scratch database on a loopback PostgreSQL server, applies the
migrations, seeds `local-dev@example.test`, and starts `wrangler dev --local`
(never remote), printing the base URL. `local:smoke` does the same, runs a
health + magic-link + session + profile smoke, and tears everything down.
Needs `openssl`. Secrets and a throwaway CA are generated per run in a private
temp directory; the worker's database TLS is fully verified through a loopback
TLS proxy. Mode is `ENVIRONMENT=development`: account data is in PostgreSQL,
magic links and sessions are in memory (lost on restart), mail is printed to
the worker console and never sent. The refresh/logout cookies are `Secure`, so
a browser journey should use `http://localhost`/`127.0.0.1` in a browser that
treats loopback as secure (Chromium, Firefox).
