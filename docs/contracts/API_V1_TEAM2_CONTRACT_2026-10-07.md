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
