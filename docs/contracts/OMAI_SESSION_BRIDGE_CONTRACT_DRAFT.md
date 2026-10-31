# Om AI ⇄ OMDALA Session Bridge Contract (DRAFT)

Status: `PROPOSED`. Nothing in section 8 exists yet; sections 1 to 7 describe what
`services/api` does today.
Label: `PREP_UNDER_ASSUMPTION(CTL-03, PostgreSQL)`
Traced at: `claude/omdala-t2-core` 2c48d55 (`services/api/src/index.ts` unless a
file is named). Line numbers drift; the function names are the stable anchors.
Audience: Om AI (`om-ai.omdala.com`, `om-ai.omdala.com/APP_SESSION_POLICY.md`), which
needs to know exactly what an OMDALA session is before it consumes one.

## 1. How a session is presented

| Channel | Where read | Notes |
|---|---|---|
| `Authorization: Bearer <access token>` | `getBearerToken` (741) | Checked **first**. A present but invalid bearer is not retried as a cookie. |
| Cookie `omdala_access_token` | `getCookieValue` (723), `requireAuthenticatedSession` (1267) | Fallback when there is no bearer. |
| Cookie `omdala_refresh_token` | `POST /v1/auth/refresh` (3567), `POST /v1/auth/logout` (3669) | The **only** way to present a refresh token. Not accepted as bearer or in a body. |

Cookies are set by `setSessionCookies` (697) through `buildSecureCookie`
(`security.ts` 280): `HttpOnly; Secure; SameSite=Lax; Path=/`, **no `Domain`** (host-only
to the API origin), access `Max-Age=3600`, refresh `Max-Age=604800`.

Tokens are **not returned in any response body**: `POST /v1/auth/session/exchange` (2946)
and `POST /v1/auth/refresh` return only status fields (tests assert no `access_token` or
`refresh_token` key). See finding F1.

## 2. Token format and claims (as issued by `issueSessionTokens`, 616)

Format: `base64url(JSON payload) + "." + base64url(HMAC-SHA256(secret, payloadPart))`,
secret `MAGIC_LINK_SECRET`. It is **not a JWT** (no header, no registered claims).

| Claim | Meaning | Set at | Checked at |
|---|---|---|---|
| `jti` | UUID of this token | `issueSessionTokens` | shape only (`verifySessionToken`, 457); refresh `jti` is the rotation key |
| `sid` | UUID of the server-side session | `issueSessionTokens` | shape, then looked up in the session store |
| `email` | the account, lower-case | magic-link payload | non-empty; compared with the stored session |
| `type` | `"access"` or `"refresh"` | `issueSessionTokens` | must equal the expected type |
| `exp` | expiry, **milliseconds** since epoch | access `now+1h`, refresh `now+7d` | `exp < Date.now()` rejects |

Not issued: scopes, role, workspace id, tenant id, issuer, audience, `iat`. See F4 to F6.

## 3. Tenant and workspace binding (as implemented)

- The tenant is the **account**, identified by `email`. Every repository call takes
  the owner from the verified session, never from a request body (proved by
  `v1-tenant-isolation.test.ts` and, against PostgreSQL, `v1-tenant-isolation.integration.test.ts`).
- There is **no workspace claim**. Workspaces belong to the account: `GET /v1/workspaces`
  lists the caller's; `GET /v1/workspaces/:id` answers `404 workspace_not_found` for any
  other account's id. A client learns its workspace ids from those routes.
- `X-Tenant-ID: omdala-com` on AIAGENT calls is a fixed platform value
  (`aiagent-client.ts`), not a per-user tenant.

## 4. Server-side state, expiry, revocation

Authority is the session row, checked on **every** protected request
(`requireAuthenticatedSession` → `isAuthSessionStateActive`, 597):

- staging and production: `omdala.auth_sessions` (`id = sid`, same `email`, `revoked_at IS NULL`,
  `refresh_expires_at > now`). Store unavailable → `503 session_authority_unavailable`.
- `development` and `test` (`permitsEphemeralAuthState`, 500): in-memory map; a `sid`
  the process has never seen is **accepted** if the signature and expiry are valid
  (local convenience; never true in staging or production).

Expiry: access token 1 h; refresh token 7 d; the session row's `refresh_expires_at` is
extended by each refresh (sliding, no absolute cap). Magic link: 30 min
(request, 2899), 10 min for the staging E2E bootstrap (2845).

Revocation is **per session**:
- `POST /v1/auth/logout` revokes `sid` (from the refresh cookie, else the access token)
  and clears both cookies; every token of that session then fails on its next request
  with `401 session_revoked`.
- Presenting an already-used refresh token revokes the whole session (`rotateAuthSessionState`,
  line 584) and answers `401 refresh_token_reused_or_revoked`.
- There is no per-token deny list and no administrative revoke route (F7).

## 5. Replay behaviour

| Credential | Replay |
|---|---|
| Magic-link token | single use: atomic `UPDATE ... consumed_at IS NULL` (`consumeMagicLink`); replay → `401 invalid_or_consumed_token` |
| Refresh token | single use: rotation compares the stored `jti`; replay → session revoked (above) |
| Access token | **replayable** until `exp` or revocation; `jti` is not recorded |

## 6. Routes that accept a session today

Session required (`requireAuthenticatedSession`): `GET /v1/auth/session`; `GET|PUT
/v1/account/profile`; `GET|PUT /v1/account/preferences`; `GET /v1/billing/subscriptions`;
`GET /v1/billing/usage`; `GET|POST /v1/workspaces`; `GET /v1/workspaces/:id`; `GET
/v1/notifications`; `POST /v1/notifications/mark-read/:id`; `POST /v1/analytics/track`;
`GET /v1/analytics/dashboard`; `POST /v1/security/api-keys`; `POST /v1/security/service-token`;
`GET /v1/ai/connectors|health|models`; `POST /v1/ai/chat`; `POST /v1/ai/complete` (session-gated, then
answers `501 direct_ai_disabled`); and `/v2/reality/*` (in
staging and production only `GET nodes|proofs|trust|trust/:id` are released, the rest
answer `501 REALITY_ROUTE_NOT_RELEASED`).

There is no route allowlist per client today: any valid session reaches every route above.

## 7. Error codes (HTTP status → `error.code`)

| Situation | Status | Code |
|---|---|---|
| no bearer and no cookie | 401 | `unauthenticated` |
| bad signature, wrong type, expired | 401 | `invalid_or_expired_token` |
| session revoked, expired in store, or email mismatch | 401 | `session_revoked` |
| session store unreachable | 503 | `session_authority_unavailable` |
| refresh without cookie | 400 | `missing_refresh_token` |
| refresh reused or revoked | 401 | `refresh_token_reused_or_revoked` |
| magic link consumed or unknown | 401 | `invalid_or_consumed_token` |
| session secret not configured | 501 | `not_configured` |
| database down / timeout while issuing or rotating | 503 / 504 | `DATABASE_UNAVAILABLE` / `DATABASE_TIMEOUT` |
| logout cannot revoke | 503 | `session_revocation_failed` |

## 8. Findings (gaps Om AI will hit) and PROPOSED bridge

| # | Finding | Evidence |
|---|---|---|
| F1 | A native or server client cannot obtain a bearer token: tokens exist only in `Set-Cookie`. `APP_SESSION_POLICY.md` expects an `access_token` in the response. | `setSessionCookies`; exchange and refresh bodies |
| F2 | Refresh works only from the refresh cookie. | `POST /v1/auth/refresh` reads `getCookieValue` only |
| F3 | No Om AI origin is allowed for CORS with credentials: staging allows web, app, auth; production adds docs, trust, admin. | `getAllowedOrigins` (213), `fixedFirstPartyOrigins` (174) |
| F4 | No scopes and no workspace claim: a token cannot be limited to one workspace or one feature. | claims table |
| F5 | The tenant is only the account email; no stable account id claim. | claims table |
| F6 | No `iss`, `aud`, `iat`; `exp` is milliseconds, so generic JWT libraries cannot validate it. | claims table |
| F7 | No administrative revoke, no list of a user's sessions, no per-token revoke. | revocation section |
| F8 | In development and test an unknown `sid` is accepted. | `isAuthSessionStateActive` |

PROPOSED (not implemented, for T0/owner decision; none should ship without tests):

1. A bridge credential distinct from the browser session: a short-lived token minted
   by an authenticated session, with `aud: "om-ai"`, `scope` (list), `ws` (one workspace
   id the account owns, validated at mint time), `sub` (stable account id), `iat`/`exp`
   in seconds, and a server-side row so it can be revoked on its own.
2. A route allowlist per `aud`/scope. Suggested Om AI read set: `GET /v1/auth/session`,
   `GET /v1/account/profile`, `GET /v1/account/preferences`, `GET /v1/workspaces`,
   `GET /v1/workspaces/:id`; writes and `security/*` excluded.
3. Return the bridge token in the response body (never the browser cookies), and accept
   refresh from a body or header for native clients only.
4. Add the Om AI web origin to the staging and production CORS set once it exists.
5. Revocation: revoke the bridge row on logout of the parent session, plus an admin revoke.

## 9. Where each statement is tested today

| Statement | Test |
|---|---|
| expired, revoked, replayed, tampered tokens; wrong account; missing session | `auth-session-negatives.test.ts`, `auth-session.e2e.test.ts` |
| owner always from the session; foreign ids answer 404 | `v1-tenant-isolation.test.ts`, `v1-tenant-isolation.integration.test.ts` |
| session and magic link persisted, valid after a worker restart | `pnpm --filter @omdala/api run local:smoke` (persistent profile) |
| database failure codes | `failure-states.test.ts` |

Also confirmed by running the code against `ENVIRONMENT=test` while drafting: an invalid bearer
with a valid cookie answers `401 invalid_or_expired_token` (no fallback); a valid bearer with
a junk cookie answers 200; a refresh token as bearer answers 401; `POST /v1/auth/refresh`
with only a bearer answers `400 missing_refresh_token`; `POST /v1/auth/logout` with only an
access bearer answers `200 {revoked: true}`; an access token whose `exp` is in seconds is
rejected as expired (milliseconds are required). These probes are not committed as tests.

## 10. How Om AI verifies a bridge credential (WO-T2-23) — OWNER DECISION

Status: `PROPOSED`. Label: `PREP_UNDER_ASSUMPTION(AI-01, bridge as drafted)`.
What exists (WO-T2-21/22, 501 outside local and test): the credential is
`omb1.<payload>.<HS256 signature>`, signed with `MAGIC_LINK_SECRET`, which only this API holds.
**Om AI therefore cannot verify it by itself.** Two ways to close that:

| | (a) Introspection endpoint | (b) Asymmetric signing + published key set |
|---|---|---|
| How | Om AI calls `POST /v1/auth/om-ai/introspect` with the token and its own service credential; the API answers `{active, claims}` after the same checks as today (signature, row, parent session, expiry). | The API signs with a private key (EdDSA or ES256) and publishes the public keys at a JWKS URL; Om AI verifies offline and caches the keys. Tokens become real JWTs: add `iss`, a `kid` header, keep `iat`/`exp` in seconds. |
| Revocation | Immediate (logout, own revoke, admin revoke all take effect on the next call). | Only at expiry (15 min) unless Om AI also introspects, which brings (a) back. |
| New secret | A service credential for Om AI (rotation, storage on both sides). | A signing private key in the API's secret store, key rotation with overlapping `kid`s, a public JWKS route. |
| Latency / availability | One API round trip per verification (cacheable for seconds); Om AI depends on API availability. | No per-request call; Om AI keeps working if the API is briefly down. |
| Work left | Route, caller authentication, a short cache rule, rate limit. | Key generation and custody, JWKS route, `iss`/`kid`, rotation procedure, tests against a JWT library. |
| Fits proposal 5 (revoke on logout) | Yes, as written. | Only partly; the 15-minute window is the exposure. |

**Recommendation: (a) now.** The drafted requirement is revocation on logout and by an
administrator; (a) gives that without new key custody, and the call volume of a read-only
bridge is small. Keep the token format compatible with (b) (seconds, `iat`/`exp`, `aud`,
`sub`) so moving to (b) later is additive; revisit if Om AI's latency or API-outage
tolerance requires offline verification. The owner chooses; nothing in (a) or (b) is
built beyond this paragraph.

Built with this order, behind the same release boundary: `sub` is now a **stored** account id
(`acct_` + 32 hex, random, one row per account in `omdala.account_ids`, proposed migration
`0007_account_ids`), no longer an HMAC of the email under `MAGIC_LINK_SECRET`. It survives
secret rotation and does not reveal or depend on the email. It is keyed by email, the account
key the API uses today; if accounts ever get a primary id of their own, `account_id` should
become that id.
