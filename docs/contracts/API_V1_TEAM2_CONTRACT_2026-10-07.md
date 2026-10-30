# Team 2 API Contract v2026-10-07

Status: `IMPLEMENTED_IN_WORKTREE / CONSUMER_SIGNOFF_PENDING`
Source SHA: `415927e5f1580d539013b55765dfba834de655e7`
Implementation: `services/api/src/contracts.ts`

## Envelope

Successful responses use the following shape. `meta.requestId` is returned
when request tracing is enabled.

```json
{
  "ok": true,
  "data": { "items": [] },
  "meta": { "requestId": "req_redacted" }
}
```

Failure responses never expose provider credentials or database details:

```json
{
  "ok": false,
  "error": { "code": "RESOURCE_NOT_FOUND", "message": "Resource not found" },
  "meta": { "requestId": "req_redacted" }
}
```

## Version and Pagination

- Contract version: `2026-10-07`.
- `page` is a positive integer and defaults to `1`.
- `limit` is a positive integer, defaults to `20`, and is capped at `100`.
- Run listings expose `pagination.page`, `pagination.limit`,
  `pagination.total`, and `pagination.hasNextPage`.
- `meta_pagination` remains as a compatibility alias for the existing app
  consumer and will be retired only after consumer sign-off.

## Authentication and Tenant Scope

- Protected routes require a verified access session before database or
  provider work.
- The server derives the owner from the verified session; `x-user-id` and
  `x-actor-id` are not accepted as identity authority.
- Reality states, commitments, transitions, proofs, and trust reads are
  scoped to the authenticated owner in the PostgreSQL repository.
- Cross-owner references return `RESOURCE_NOT_FOUND` rather than disclosing
  whether another tenant's object exists.

## Idempotency and Correlation

- Mail requests use the validated `message_idempotency_key` field before the
  provider call; a safe random key is generated when the caller omits it.
- Every response carries `x-request-id` and `meta.requestId`.
- Persistent idempotency storage for billing, queue jobs, and provider actions
  is not closed by this packet and remains a staging/runtime gate.

## Failure Codes (amended 2026-10-30)

Implementation: `services/api/src/db/errors.ts`, `services/api/src/index.ts`,
`services/api/src/aiagent-client.ts`. Messages never contain driver text,
hostnames, credentials, or provider response bodies.

### Database

| HTTP | `error.code` | Meaning |
|---|---|---|
| 503 | `DATABASE_UNAVAILABLE` | Connection refused, reset, or server not accepting connections. **Changed from 502 to 503**; consumers that branched on 502 must accept 503. |
| 504 | `DATABASE_TIMEOUT` | Statement or connection timeout |
| 503 | `PERSISTENCE_REQUIRED` | No database is configured where one is required, including the auth routes |
| 503 | `session_authority_unavailable` | The session store could not be read while validating a session |
| 422 | `DATABASE_CONSTRAINT_FOREIGN_KEY`, `DATABASE_CONSTRAINT_UNIQUE`, `DATABASE_CONSTRAINT_VIOLATION` | Constraint failures |
| 500 | `INTERNAL_ERROR` | Anything else |

The magic-link request, session exchange, and refresh routes use the same
database codes; they no longer answer with `magic_link_failed`,
`session_exchange_failed`, or `refresh_failed` for storage failures, and they
set no session cookie on failure.

### Database TLS

PostgreSQL connections verify the server certificate by default. Verification
can be skipped only by setting `OMDALA_DB_TLS_INSECURE=1` when `ENVIRONMENT` is
`local`, `development`, or `test`. In any other environment, including
`production` and `staging`, the flag is refused: the database call throws
`DB_TLS_INSECURE_REFUSED` before any connection is opened. It is a deployment
configuration error, not a documented client-facing code: callers see a generic
server-side failure. The Hyperdrive connection
path is pending a staging check and is not covered by this statement.

### AIAGENT (`POST /v1/ai/chat`, `GET /v1/ai/models`)

| HTTP | `error.code` | Meaning |
|---|---|---|
| 429 | `aiagent_quota_exceeded` | Provider quota or rate limit. `Retry-After` (seconds, 0 to 86400) is passed through when the provider sent a valid one |
| 504 | `aiagent_timeout` | Provider did not answer within 60 seconds |
| 502 | `aiagent_reconciliation_failed` | Chat: provider error or incomplete run, receipt, usage, or cost evidence |
| 502 | `aiagent_catalog_unavailable` | Models: the provider answered with an error status (5xx, 401, 403) |
| 503 | `aiagent_catalog_unavailable` | Models: failure that is not a provider response (network error, non-JSON body, invalid catalog, AIAGENT not configured) |
| 503 | `aiagent_not_configured` | Chat: AIAGENT is not configured for this environment |
| 422 | `invalid_ai_request` | Chat: model or input rejected before the provider call |

## Redacted Consumer Examples

```http
GET /v2/reality/runs?page=1&limit=20
Authorization: Bearer <redacted>
X-Request-Id: req_redacted
```

```json
{
  "ok": true,
  "data": {
    "contractVersion": "2026-10-07",
    "runs": [],
    "pagination": { "page": 1, "limit": 20, "total": 0, "hasNextPage": false },
    "meta_pagination": { "page": 1, "limit": 20, "total": 0, "hasNextPage": false }
  },
  "meta": { "requestId": "req_redacted" }
}
```

Consumer sign-off, OpenAPI publication, compatibility tests against real
staging, and API version freeze remain pending Team 1, Team 3, and Team 4
review.
