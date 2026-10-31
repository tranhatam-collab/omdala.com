# T2 queue empty (2026-10-30)
- Reported this cycle: WO-T2-CI, -04, -05, -06, -07 DONE; BL-T2-01, -02, -05 DONE; BL-T2-03 and BL-T2-04 BLOCKED (premise files do not exist). Head 01f22d3 on claude/omdala-t2-core.
- Hosted CI: "OMDALA CI" read as conclusion success for 3e36cd4, 47b1eb1, 690be2b, 0259a1e, 4239b8d, 1dfbf2b, c71779d, b74dd52, 1f1d532, b794619, 6908b4a (runs #54-#70); 01f22d3 was still queued. Hosted CI skips the DB-backed suites (21 + 6 skipped) until T1 adds a TLS-enabled postgres service (WO-T1-03); locally they pass 375/375 on PostgreSQL 16.
- Proposed next orders, in value order:
  1. WO-T2-08 (needs T0): prove `pg` with certificate verification works through Hyperdrive on staging. client.ts now verifies TLS by default; Hyperdrive's local proxy may not use TLS, so this is the one change that could break the deployed API. Either confirm on staging (T1 deploys) or add an explicit Hyperdrive branch in db/client.ts.
  2. T0 to resolve BL-T2-03/04: name the branch or files that hold the `\i` includes and the four leased scripts, or drop R-18 and R-22..R-25.
  3. WO-T2-09: map the models route (`/v1/ai/models`) failures to the same codes as chat (429, 504, 502) instead of a blanket 503.
  4. WO-T2-10: persist scenes/runs (process-wide in-memory today, unreleased in staging and production) or keep them closed and remove them from the contract.
  5. WO-T2-11: add `OMDALA_DB_TLS_INSECURE`, `DB_TLS_INSECURE_REFUSED` and the 503/504 database codes to docs/contracts/API_V1_TEAM2_CONTRACT_2026-10-07.md (docs/contracts is outside T2's paths; needs a lease).
- Consumers of the old HTTP 502 for DATABASE_UNAVAILABLE (apps, monitors, T3 specs) should be checked for the new 503.

## Update 2026-10-30 (second cycle, head 2ed5df9)
- Reported: WO-T2-09, -10, -11, -12 DONE; BL-T2-06 DONE; WO-T2-08 BLOCKED. No READY T2 order or backlog item is left.
- WO-T2-08 unblock options: (a) the owner allows developers.cloudflare.com for this environment and re-issues the order; or (b) T1 runs the staging check in the report (does `pg` with `ssl: { rejectUnauthorized: true }` connect through `env.HYPERDRIVE.connectionString`?). New evidence from WO-T2-12: workerd's TLS ignores `rejectUnauthorized: false`, so the pre-47b1eb1 setting could not have accepted an untrusted certificate in the deployed Worker either.
- Proposed next orders: (1) local persistent-auth profile: run the stand-up in `staging` mode with a loopback stub mail sink so magic links and sessions live in PostgreSQL (needs the staging TLS rule to accept the stand-up's CA, which it does, since verification is on); (2) a T3 browser journey on top of `local:stack`; (3) decide whether `development` should keep auth state in memory when a database is configured.
