# OMDALA decision packets for the owner (2026-10-31)

Order WO-T0-03. Every decision below is open, blocks named work, and comes with
the option T0 recommends. Evidence is in the team reports on each team branch
(`docs/06-strategy/reports/<TEAM>/`) and in the ledger
([DEV_LEDGER.md](./DEV_LEDGER.md) sections 7 and 7.3). Production stays HOLD
whatever is chosen here.

Ordered by how much work each one unblocks.

## 0. Review and merge route for the team work (CTL-04), new 2026-10-31T06:2xZ

- Facts: T4's integration dry run (WO-T4-18, report on the T4 branch) merged the
  T2, T3, TAI and T4 branches onto `OMCODE/infra-e2e-auto-20261026` (7abd962)
  without a conflict, and every check passed on the merged tree: typecheck, lint,
  brand, build, API 643/643 against PostgreSQL, unit suites, and E2E for app, web,
  auth, docs, admin and brand. Draft PRs #16-#19 carry reviewer summaries.
- Options: (a) a human reviewer reads PRs #17, #18, #16, #19 and the owner approves
  merging them into the OMCODE line in that order (T1 merges); (b) first push the
  merged tree as `claude/omdala-integration` to get hosted CI on the combined code,
  then (a); (c) keep the branches separate for now.
- Consequences: (a) and (b) turn about 60 team orders into one candidate that staging
  work (E2E-3 onward) can use; (c) keeps every result local to its branch.
- Recommended: (b), then (a). The owner or T1 does the push or merge (WO-T1-09);
  the cloud teams are limited to their own branches.

## 1. Data authority (CTL-03)

- Question: is PostgreSQL through Hyperdrive the main API's system of record?
- Options: (a) PostgreSQL via Hyperdrive, D1 only for Omniverse when un-parked;
  (b) D1 for everything; (c) defer.
- Consequences: (a) matches all work done so far under
  `PREP_UNDER_ASSUMPTION(CTL-03, PostgreSQL)`: migrations 0004-0007, the AI cost
  ledger, bridge credentials, DR rehearsal, isolation tests. (b) rewrites that work.
  (c) keeps every one of those items unaccepted.
- Recommended: (a).
- Unblocks: acceptance of T2's prep work, CORE-03/06/07/10, OMAI-02/04, MEM-01.

## 2. Hyperdrive TLS check (WO-T2-08)

- Question: how does `pg` connect through `env.HYPERDRIVE.connectionString` now that
  certificate verification is on by default?
- Options: (a) allow `developers.cloudflare.com` in the cloud environment's network
  settings so T2 reads the documented configuration; (b) T1 runs one staging query
  with `ssl` verification on and once without it.
- Consequences: until one happens, the deployed API may fail to reach its database
  after the TLS change (R-03 fix).
- Recommended: (a), it costs nothing and keeps the fix in T2's hands; (b) as the
  confirmation before any deploy.

## 3. Coordinator permissions

- Question: allow `update_trigger` in the T0 session ("always allow")?
- Consequences: with it, T0 pauses idle teams and resumes them when work appears,
  and slows its own cadence. Without it, idle teams still wake hourly for a short
  ledger check.
- Recommended: allow.

## 4. AI daily cost cap per plan (AI-06)

- Question: what is `OMDALA_AI_DAILY_COST_CAP_USD` per environment and plan?
- Consequences: unset means staging and production refuse chat (fail closed); the
  cap is enforced atomically per account (verified by T4, bypass fixed).
- Recommended: a small staging cap (for example 1 USD per account per day) now;
  production values with the billing plan in decision 7.

## 5. Om AI session bridge (AI-01)

- Question: approve the drafted bridge (short-lived credential with `aud`, `scope`,
  `ws`, stable `sub`, revocable row, per-scope route allowlist) and choose how Om AI
  checks a token.
- Options for the check: (a) introspection endpoint on the API; (b) published
  signing keys that Om AI verifies itself.
- Consequences: (a) every Om AI call depends on the API being up, revocation is
  immediate, Om AI needs its own caller credential; (b) no runtime dependency,
  revocation lags up to the token lifetime (15 minutes) unless a revocation list is
  checked.
- Recommended: approve the design; choose (b) with a 15-minute lifetime and a
  revocation check for sensitive scopes. TAI's tests already cover both behind one
  port, so the choice only swaps an adapter.
- Unblocks: releasing the bridge beyond 501, adding the Om AI origin to CORS.

## 6. Security endpoints (closed by T0 in WO-T2-29)

- Question: design and reopen service tokens, API keys and webhook verification,
  or remove them?
- Facts: service tokens never verified, API keys were never stored, and the verify
  endpoint was an unauthenticated secret oracle. T0 closes all three with 501 in
  staging and production (reversible).
- Recommended: remove them from the public contract until a design exists.

## 7. Billing provider (CTL-02)

- Question: which payment provider backs plans?
- Consequences: no provider webhook receiver, plan-change path or event replay store
  exists yet (WO-T2-25); they are built behind the release boundary once a provider
  is named.
- Recommended: name the provider and the plan list with prices; T2 then builds the
  receiver against its sandbox, with no live keys in the repository.

## 8. Mobile identifiers (MOB-02)

- Question: the real iOS bundle identifier and Android package name; keep or retire
  the unreferenced `ios/AIOmApp/**` Swift sources?
- Consequences: without identifiers, no store build or `expo prebuild` is
  reproducible; the Xcode project carries a corrupted bundle id.
- Recommended: choose reverse-DNS identifiers under the OMDALA domain and retire
  `ios/AIOmApp/**` unless a native module is planned.

## 9. Magic-link token in the URL (security, UX)

- Question: move the single-use token from the query string to the URL fragment?
- Consequences: a fragment never reaches server or CDN logs; links already sent keep
  working only if both forms are accepted for a transition period.
- Recommended: fragment, with a short dual-acceptance window.

## 10. Admin access before live data

- Question: what protects the admin surface when it starts showing real data?
- Facts: admin is deny-by-default now, but it is a static export; its pages and
  scripts are public files.
- Recommended: an edge access layer in front of `admin` (T1 designs), before any
  admin page reads live data.

## 11. Cloudflare account for the Worker (R-27, INFRA-003)

- Question: which account owns the API Worker? `services/api/wrangler.toml` differs
  from the account baseline document.
- Recommended: confirm the baseline account and let T1 align `wrangler.toml`.

## 12. Native-speaker review of Om AI Vietnamese copy (WO-TAI-17)

- Question: who reviews the Vietnamese strings TAI rewrote with diacritics?
- Recommended: name one reviewer; TAI applies the corrections.

## Relay to VS Code (T1), not decisions

Ledger section 7 lists WO-T1-01 and WO-T1-03 to WO-T1-08. The most urgent is
WO-T1-07: earlier staging runs of `apps/app` sent session checks to the production
API, so their results that touched the API are not valid evidence.
