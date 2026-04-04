# services/api

Future backend service boundary for `api.omdala.com`.

## Reality API v2

Implemented endpoints:

- `GET /v2/reality/health`
- `GET /v2/reality/nodes`
- `GET /v2/reality/states`
- `GET /v2/reality/commitments`
- `POST /v2/reality/commitments`
- `GET /v2/reality/transitions`
- `GET /v2/reality/proofs`
- `POST /v2/reality/proofs`
- `GET /v2/reality/trust`
- `GET /v2/reality/trust/:nodeId`

Persistence mode:

- If `DATABASE_URL` exists, endpoints read/write PostgreSQL.
- If `DATABASE_URL` is missing, endpoints fall back to in-memory seed data for local development.

## Database schema

Canonical schema and migrations:

- `infra/db/schema.sql`
- `infra/migrations/0001_reality_core.up.sql`
- `infra/migrations/0001_reality_core.down.sql`

Apply schema:

```bash
psql "$DATABASE_URL" -f infra/db/schema.sql
```

## Deploy environments

- `production` uses default `wrangler.toml` `[vars]`.
- `preview` uses `[env.preview.vars]`.
- `staging` uses `[env.staging.vars]`.

Required vars for DB persistence:

- `DATABASE_URL`
- `MAGIC_LINK_SECRET`
- `MAIL_API_KEY`

Use:

- `pnpm --filter @omdala/api deploy` for production
- `pnpm --filter @omdala/api deploy -- --env preview`
- `pnpm --filter @omdala/api deploy -- --env staging`

## Smoke test script

Run end-to-end API smoke checks:

```bash
bash scripts/smoke_v2_reality.sh
```

Behavior:

- Validates `/v2/reality/*` read/write endpoints.
- Asserts trust score increases immediately after `POST /v2/reality/proofs`.
- Optionally runs DB cleanup using `scripts/cleanup_test_data.sql`.

Environment inputs (see root `.env.example`):

- `BASE_URL` (default: `https://omdala-api.tranhatam66.workers.dev`)
- `SMOKE_CLEANUP` (`1` to clean up, `0` to skip)
- `DATABASE_URL` (required for cleanup execution)
- `ENV_FILE` (optional, defaults to `.env`; fallback `.env.local`)
- `FROM_NODE_ID`, `TO_NODE_ID` (optional synthetic node IDs)

CI strict mode:

```bash
bash scripts/smoke_v2_reality_ci.sh
```

- Requires `DATABASE_URL` (direct env var or loaded from `.env`/`.env.local`).
- Forces `SMOKE_CLEANUP=1` and fails if cleanup cannot run successfully.

Assert-only mode (reuse existing smoke JSON outputs):

```bash
bash scripts/smoke_v2_reality.assert_only.sh
```

- Validates trust score delta from `BEFORE_FILE` and `AFTER_FILE`.
- Defaults to `/tmp/omdala_smoke_trust_before.json` and `/tmp/omdala_smoke_trust_after.json`.

Cleanup safety integration check:

```bash
psql "$DATABASE_URL" -f scripts/cleanup_test_data.test.sql
```

- Seeds synthetic delete/keep fixtures in a transaction.
- Executes `scripts/cleanup_test_data.sql`.
- Asserts only recent smoke-like records are deleted (7-day window); then rolls back.

## V2 request tracing and logs

- Every `/v2/reality/*` response now includes `meta.requestId`.
- Server echoes/sets `x-request-id` header for end-to-end tracing.
- Structured v2 logs include: `request_id`, `route/path`, `error_code`, `duration_ms`.
- Cloudflare query examples: `docs/OMDALA_CLOUDFLARE_LOG_QUERIES_2026.md`.

Trace helper from smoke outputs:

```bash
bash scripts/smoke_v2_reality_trace_request.sh
```

- Reads latest `meta.requestId` from smoke JSON files in `/tmp`.
- Writes Cloudflare query snippet to `/tmp/omdala_trace_query.txt`.
- Accepts explicit `REQUEST_ID` override.

Continuous chain mode:

```bash
bash scripts/smoke_v2_reality_chain.sh
```

- Runs API tests -> strict CI smoke -> standard smoke -> trace query export.
- Fast way to execute end-to-end verification continuously.

Daily ops check report:

```bash
pnpm ops:v2:daily-check
```

- Executes full chain and generates a short markdown report in `reports/ops/`.
- Includes latency snapshot (p50/p95/max), trace request id, and ready-to-paste logs query.
- Also exports dashboard-ready JSON report in `reports/ops/`.
- Optional health budget + trend from log cache (`reports/ops/cache/v2-log-query-cache.json`).
- Optional uploader: POST JSON to `REPORT_UPLOAD_URL` or copy to `REPORT_UPLOAD_DIR`.

Build real log cache from Cloudflare export:

```bash
pnpm ops:v2:build-log-cache -- <export_file>
```

- Accepts JSON array, JSONL, or CSV export.
- Computes 24h and previous 24h windows for tracked `error_code` values and p95 latency.
- Writes `reports/ops/cache/v2-log-query-cache.json` by default.

Web E2E language check:

```bash
pnpm test:web:e2e:prod
```

- Uses `https://omdala-web.pages.dev` as default base URL.
- Override via `E2E_BASE_URL` when validating a different preview/prod domain.

Latency fail-fast gate:

- `SMOKE_P95_THRESHOLD_MS` (default `2500`)
- `SMOKE_CRITICAL_ROUTE_P95_THRESHOLD_MS` (default `2200`) for critical routes: `create_commitment`, `create_proof`, `trust_after`
- `SMOKE_ENFORCE_P95=1` to fail when p95 exceeds threshold
- Perf summary output: `/tmp/omdala_smoke_perf.json`

Cleanup consistency check:

```bash
pnpm smoke:reality:cleanup:consistency
```

- Verifies no dangling `trust_score_history.event_id` references for `proof_*` rows.
- Included automatically in strict cleanup safety flow.

Alert runbook:

- `docs/OMDALA_V2_ALERT_RESPONSE_RUNBOOK_2026.md`
- Covers `DATABASE_TIMEOUT`, `DATABASE_UNAVAILABLE`, and `DATABASE_CONSTRAINT_*` response playbooks.
