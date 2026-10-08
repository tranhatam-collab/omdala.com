# API.OMDALA.COM 522 INCIDENT TRIAGE

**Observed:** 2026-08-14
**Mode:** Read-only
**Severity recommendation:** `SEV-2`
**State:** `OPEN`
**Release impact:** `NO-GO`

## Current evidence

| Probe | Result | Classification |
|---|---|---|
| `dig api.omdala.com A` | `172.67.144.5` | Cloudflare edge address |
| `dig api.omdala.com AAAA` | `2606:4700:3034::6815:275c` | Cloudflare edge address |
| `GET /cdn-cgi/trace` | HTTP `200`, about 1.1 seconds | Cloudflare edge reachable |
| `GET /health` | HTTP `522`, about 20.2 seconds | Origin/runtime path unreachable |
| Current `services/api/wrangler.toml` | No route/custom domain | `BLOCKED_SOURCE_CONFIG` |
| Bootstrap commit `99844b2` | Had explicit `api.omdala.com/*` route | Historical intent only |
| Wrangler account inspection | `authentication_required` | Dashboard state not checked |

## Assessment

The edge is reachable while the application path returns `522`. Source history shows an
explicit Worker route existed and the current config no longer declares it. The leading
hypothesis is route/DNS/account configuration drift, but this is **not yet a confirmed root
cause** because the current Cloudflare DNS record, Worker routes, custom domains, deployments,
and account ownership could not be read without authentication.

Do not redeploy or rewrite DNS based only on this hypothesis. A blind Worker deploy without an
explicit route can succeed while leaving the public hostname on a failing origin path.

## Required read-only triage

1. Founder selects or confirms the account that owns zone `omdala.com` and Worker `omdala-api`.
2. Team 1 lists the exact DNS record for `api.omdala.com`, proxy status, Worker routes/custom domains, and latest deployment ID.
3. Team 1 compares those records with the candidate SHA and expected account ID.
4. Team 2 confirms the required Hyperdrive binding and database reachability.
5. Team 4 independently repeats `/health` and `/health/deep` after any approved remediation.

## Decision matrix

| Observed dashboard state | Approved remediation candidate |
|---|---|
| DNS points to stale VPS and no Worker custom domain exists | Founder-approved cutover to the verified Worker route/custom domain |
| Worker route exists but deployment is stale | Deploy exact approved SHA through protected workflow |
| Worker route/deployment are correct but database is unavailable | Restore Hyperdrive/database path; do not change DNS |
| Zone and Worker are in different accounts | Complete account canonicalization before route/deploy changes |

## Required closure receipt

- Founder approval ID and chosen account ID.
- Before/after DNS and Worker route metadata.
- Exact release SHA and Cloudflare deployment ID.
- `/health/deep` JSON with matching identity and database `ok`.
- Team 4 independent probe and rollback evidence.

No production mutation was performed during this triage.
