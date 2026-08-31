# OMDALA V2 Alert Response Runbook (2026)

Scope: `/v2/reality/*` backend alerts by `error_code` in Cloudflare logs.

## DATABASE_TIMEOUT

Trigger:

- Error spike for `DATABASE_TIMEOUT`.
- Route p95 `duration_ms` rises above baseline.

Likely causes:

- Slow SQL query / missing index / lock contention.
- Postgres saturation (CPU/IO/connections).

Immediate actions (0-15 minutes):

1. Confirm affected routes and rate from logs.
2. Check p95 latency by route.
3. Verify DB host health (CPU, memory, active connections).
4. If one route dominates, reduce traffic burst (rate limit or temporary retry-backoff at client).

Diagnostics query:

```
message = "v2/reality handler error" OR message = "v2/reality db error"
| filter error_code = "DATABASE_TIMEOUT"
| stats count() as total by path, operation
| sort total desc
```

Stabilization:

- Optimize worst query path first.
- Add/review indexes for heavy filter/sort columns.
- Increase DB capacity if saturation is infrastructure-level.

Escalate when:

- Timeout persists > 30 minutes after mitigation.
- More than 3 core routes impacted simultaneously.

---

## DATABASE_UNAVAILABLE

Trigger:

- `DATABASE_UNAVAILABLE` bursts, often clustered in short windows.

Likely causes:

- Network path failure (Worker -> Hyperdrive -> DB).
- DB restart/failover.
- Connection pool exhaustion / listener unavailable.

Immediate actions (0-10 minutes):

1. Confirm if all routes are affected or partial.
2. Validate Hyperdrive binding status and DB reachability.
3. Check DB service uptime and restart events.
4. If incident ongoing, post status update and reduce non-critical writes.

Diagnostics query:

```
message = "v2/reality handler error" OR message = "v2/reality db error"
| filter error_code = "DATABASE_UNAVAILABLE"
| stats count() as total by sql_state, operation, path
| sort total desc
```

Stabilization:

- Restore DB connectivity first.
- Validate credentials/network ACL if changed.
- Re-run smoke (`smoke:reality`) to confirm read/write recovery.

Escalate when:

- Unavailable errors persist > 10 minutes.
- Health endpoint still returns degraded behavior after connectivity fix.

---

## DATABASE_CONSTRAINT_FOREIGN_KEY / DATABASE_CONSTRAINT_UNIQUE / DATABASE_CONSTRAINT_VIOLATION

Trigger:

- Sustained `422` DB constraint responses.

Likely causes:

- Client submits invalid references (missing node/commitment IDs).
- Duplicate synthetic IDs or retry logic without idempotency.
- Contract mismatch between API validation and DB schema.

Immediate actions (0-30 minutes):

1. Identify top failing payload pattern by route.
2. Check if failures come from one client/version.
3. Verify request validation coverage against schema constraints.

Diagnostics query:

```
message = "v2/reality handler error" OR message = "v2/reality db error"
| filter error_code starts_with "DATABASE_CONSTRAINT"
| stats count() as total by error_code, sql_state, path, operation
| sort total desc
```

Stabilization:

- Add/strengthen API pre-validation to block bad payloads earlier.
- Patch client payload generation if producer bug is identified.
- For duplicate writes, add idempotency key strategy.

Escalate when:

- Constraint errors exceed normal client mistake baseline for > 1 hour.
- Errors affect onboarding/critical write flow.

---

## Common closeout checklist

1. Re-run smoke suite (`bash scripts/smoke_v2_reality.sh`).
2. Confirm trust update path still works (`POST /proofs` -> `GET /trust`).
3. Capture incident window, root cause, and fix in ops notes.
4. Add preventive action item (query optimization, validation rule, alert threshold tuning).
