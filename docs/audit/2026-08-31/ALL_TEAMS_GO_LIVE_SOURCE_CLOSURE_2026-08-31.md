# OMDALA All Teams Go-Live Source Closure

Date: 2026-08-31

Owner: Team 1 integration and independent QA lane

Scope: Omdala.com only

Branch: `OMCODE/go-live-e2e-20260829`

Source baseline before this closure: `c52a495019bace47fa395c2e9108bfa800ce24b5`

## Verdict

```text
SOURCE CONTROLS:       IMPLEMENTED
LOCAL CONTROL TESTS:   PASS
EXACT-SHA CI:          PENDING NEW COMMIT
INDEPENDENT REVIEW:    BLOCKED BY EXTERNAL REVIEWER
STAGING RESOURCES:     BLOCKED BY WAVE A
STAGING E2E:           BLOCKED UNTIL WAVE B
PRODUCTION:            HOLD
```

This file does not authorize a deploy, database migration, DNS change, secret
change, merge, or production release.

## Team 1: Source Identity And Independent Review

Implemented:

- Added `.github/CODEOWNERS` for the repository and critical release paths.
- Added an exact-SHA independent-review policy.
- Self-review, bot review, untrusted external review, stale-SHA approval, and
  revoked approval are rejected.
- Added a PR review workflow that uploads both accepted and blocked receipts.
- API, surface, and staging workflows re-check the independent review instead
  of trusting an earlier report.

Evidence:

- 6 independent-review policy tests.
- Exact PR head SHA is compared with the requested release SHA.
- Reviewer identity and GitHub review ID are carried into release receipts.

## Team 2: Database Safety Before Migration

Implemented:

- Protected source host and database name must match the parsed database URL.
- Source and restore targets must be distinct.
- A custom PostgreSQL backup is made before any migration.
- The backup is restored into an ephemeral PostgreSQL 16 service.
- User-table inventory and exact row counts must match source and restore.
- The dump is encrypted with AES-256-CBC and PBKDF2.
- The encrypted artifact is decrypted and byte-compared before acceptance.
- Only the encrypted dump and redacted receipt are uploaded.
- Migration remains fail-closed and starts only after this gate passes.

Evidence:

- 6 PostgreSQL target-policy tests.
- `bash -n scripts/postgres-pre-migration-gate.sh`: PASS.
- Real backup/restore execution is intentionally deferred to GitHub CI because
  no local PostgreSQL service or Docker daemon was running during this pass.

## Team 3: Traceable Mail Transport

Implemented:

- Staging and production no longer accept HTTP success without a provider
  message ID.
- Provider receipt parsing supports response headers and common JSON response
  shapes.
- Contact and access-request routes return two delivery handoff receipts.
- Magic-link request returns one delivery handoff receipt.
- Console fallback remains restricted to development, local, and test.
- Added a negative API test for a mail provider that returns 202 without an ID.
- Staging Playwright now verifies `mail-api`, provider ID, and provider status.

Boundary:

- This proves provider acceptance and traceability. Inbox delivery still
  requires the external mail provider's delivery event or inbox receipt.

## Team 4: Exact-Run Staging Acceptance

Implemented:

- API deploy emits an immutable receipt bound to SHA, PR, reviewer, backup
  receipt hash, deployment ID, and workflow run ID.
- Surface deploy emits an immutable receipt bound to SHA, PR, reviewer, release
  ID, and workflow run ID.
- Staging acceptance takes API and surface workflow run IDs, downloads their
  artifacts, and rejects typed or fabricated deployment identifiers.
- Playwright writes a JSON report.
- The verifier requires exactly 4 discovered, executed, and passing scenarios,
  with zero unexpected, flaky, or skipped results.
- The final staging receipt binds the E2E report hash and the database backup
  receipt hash.
- Static anti-bypass checks reject missing review, missing backup/restore,
  missing provider receipt assertions, or `continue-on-error` in the release
  chain.

Evidence:

- 4 Playwright receipt verifier tests.
- 3 release-control anti-bypass tests.
- `actionlint` across all five affected workflows: PASS.

## Local Verification Summary

```text
Governance and anti-bypass tests: 19/19 PASS
Workflow syntax with actionlint:  PASS
Backup script bash syntax:         PASS
TypeScript syntax transpile:       5/5 PASS
git diff --check:                  PASS
API Vitest local runner:           BLOCKED, no output before controlled stop
API tsc local runner:              BLOCKED, no output before controlled stop
Docker integration test:           BLOCKED, Docker daemon not running
```

The blocked local runners are not recorded as pass. The next exact-SHA GitHub CI
run is the authoritative unit, type, lint, build, and browser result.

## Wave A: External Provision And Readback Only

Founder approval is required before this wave.

Required actions:

1. Invite at least one trusted GitHub collaborator who is not the PR author.
2. Protect `main` or create an equivalent ruleset requiring the exact-SHA
   independent-review check and all CI checks.
3. Create protected GitHub environments `staging` and `production`.
4. Restrict staging deployments to the candidate branch and an independent
   environment reviewer.
5. Provision staging-only PostgreSQL, Hyperdrive, Worker, Pages projects, and
   staging hostnames.
6. Add the staging Hyperdrive binding to `services/api/wrangler.toml` using the
   read-back resource ID. Never invent or copy a production ID.
7. Record resource IDs and protection readback. Do not add credentials, migrate,
   or deploy in Wave A.

## Wave B: Staging Secrets, Deploy, And E2E

Founder approval is required after Wave A readback is accepted.

Protected staging secrets:

- `OMDALA_DATABASE_URL`
- `OMDALA_BACKUP_ENCRYPTION_KEY`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`
- `OMDALA_STAGING_APP_URL`
- `OMDALA_STAGING_API_URL`
- `OMDALA_STAGING_BRAND_URL`
- `OMDALA_STAGING_WEB_URL`
- `OMDALA_STAGING_E2E_TEST_SECRET`

Protected staging variables:

- `OMDALA_DATABASE_EXPECTED_HOST`
- `OMDALA_DATABASE_EXPECTED_NAME`
- `OMDALA_API_HEALTHCHECK_URL`
- `OMDALA_API_URL`
- `OMDALA_APP_URL`
- `OMDALA_WEB_URL`
- `OMDALA_BRAND_URL`
- `OMDALA_WEB_PAGES_PROJECT`
- `OMDALA_APP_PAGES_PROJECT`
- `OMDALA_BRAND_PAGES_PROJECT`
- `OMDALA_PAGES_STAGING_BRANCH`

Worker secrets and configuration also required:

- `MAIL_API_KEY`
- `MAIL_API_URL` if the canonical default is not used
- `MAIL_API_WORKSPACE_ID`
- all current auth, AI provider, and E2E bindings required by deep health and
  the four staging scenarios

Execution order:

1. Obtain an independent approval on the exact final candidate SHA.
2. Run `OMDALA Release` for `staging` with the candidate ref and PR number.
3. Confirm backup/restore receipt, migration, API identity, and deep health.
4. Run `OMDALA Surface Release` for `staging` with the same SHA and PR.
5. Run `OMDALA Staging Go-Live E2E` with the exact SHA, PR number, API release
   run ID, and surface release run ID.
6. Accept only an uploaded `STAGING_ACCEPTED` receipt showing 4/4 executed tests.
7. Obtain an external mail delivery event or inbox receipt for the canary.
8. Keep merge and production on HOLD pending independent audit and Founder
   approval.

## Hard Stop

Do not call the project go-live ready when any of the following is missing:

- exact-SHA CI
- independent exact-SHA approval
- protected staging environment
- staging-only database and Hyperdrive identity
- backup restore and decrypt receipt
- API and surface deployment receipts
- 4/4 executed staging E2E report
- external mail delivery evidence
- rollback readback
- independent acceptance and Founder production decision
