# TEAM 1 INFRA GATE HARDENING RECEIPT

Date: 2026-08-29

Verdict: `CANDIDATE_NO_GO / RELEASE_HOLD`

## 1. Source identity

- Repository: `git@github.com:tranhatam-collab/omdala.com.git`
- Worktree: `.team1/candidate-efcf476-20260829`
- Branch: `OMCODE/team1-infra-gate-hardening-20260829`
- Base SHA: `efcf476bc1989a9d42294d4573b6ff56fc80324f`
- Base parent: `1c338b835e05f631c7b2bb9e5d8f3fec2028de75`
- Remote `main` observed: `63433d32c0ad4adfbdd566800c0b11174b75499e`
- Remote review candidate observed: `1c338b835e05f631c7b2bb9e5d8f3fec2028de75`
- `efcf476` had no remote branch when this audit began.
- The outer workspace has no valid `HEAD` and is not a release source.

This receipt does not authorize merge, deployment, DNS, database, secrets, or
production changes.

## 2. Team 1 hardening applied

1. Pin Node `22.22.3`, npm `10.9.8`, and pnpm `9.15.0` for reproducible gates.
2. Require a remote upstream in the source probe.
3. Remove the invalid production `wrangler --env ""` argument.
4. Require runtime JSON to be application-ready before reporting
   `VERIFIED_CURRENT`.
5. Require `release_sha` and `deployment_id` in remote health evidence.
6. Treat health environment variables and external health URLs as exact URLs;
   do not append a second `/health/deep` path.
7. Install all four nested npm dependency trees before nested audits.
8. Run all four nested audits in the local release verifier and retain the raw
   JSON report inside the release receipt.
9. Fail the local release verifier before heavy steps when its toolchain is not
   exact.

## 3. Verification evidence

### Static controls

- `node --check scripts/infra-readonly-probe.mjs`: `PASS`
- `node --check scripts/release-verify.mjs`: `PASS`
- GitHub workflow YAML parse: `PASS`
- `git diff --check`: `PASS`

### API candidate

- `pnpm --filter @omdala/api test`: `50/50 PASS`
- `pnpm --filter @omdala/api run check`: `PASS`

### OM AI functional tests

- `npm test`: `11/11 PASS`
- These are local functional tests, not provider-authenticated staging E2E.

### Nested dependency audits

All current counts below use Node `22.22.3` and npm `10.9.8`.

| Package | Current result | Gate |
|---|---:|---|
| OM AI backend | 5 high, 1 moderate, 1 low | `FAIL` |
| OM AI gateway | 0 high, 0 moderate, 1 low | `PASS_AT_HIGH_THRESHOLD` |
| Infra API Gateway | 5 high, 1 moderate | `FAIL` |
| Infra Worker | 0 vulnerabilities | `PASS` |

The OM AI backend and Infra API Gateway counts reproduce the corrected Team 4
P0 rows. The separate npm 11 `12 high` statement is historical CLI variance,
not the pinned current gate.

## 4. Current source probe

The patched source probe correctly reports:

- valid local HEAD and exact toolchain;
- no remote upstream yet;
- SHA not on `origin/main`;
- missing production and staging Hyperdrive bindings;
- missing production and staging API routes;
- local Team 1 patch not yet immutable at probe time.

The probe remains fail-closed. It does not convert this branch into a release
candidate.

## 5. Blocked or not rerun

1. Full monorepo frozen install was blocked by registry `ECONNRESET`,
   `ENOTFOUND`, and `ERR_SOCKET_TIMEOUT`. A filtered API install completed.
2. Full lint was not rerun. Team 4's `73 errors / 148 warnings` remains open
   until reproduced and closed on the same remote SHA.
3. Browser E2E was not rerun in this receipt.
4. Real-auth, real-persistence, real-provider, Brand Exchange public runtime,
   and App staging runtime evidence remain absent.
5. Production and staging Cloudflare account, route, Hyperdrive, rollback, and
   runtime identity receipts remain absent.
6. Pricing still permits `trial + convert` to bypass the promised three-month
   promo and enter full-price monthly state.
7. The test labeled `no mock` still invokes an unauthenticated-session mock.

## 6. Team 4 receipt status

The corrected Team 4 receipt and defect registry are in its dedicated worktree
and have stable local hashes, but they remain untracked. They are evidence
drafts, not immutable Git receipts. Team 4 must commit/sign them from its own
branch and re-audit the next immutable remote candidate.

## 7. Required next ownership

### Team 1

- Commit and push this hardening branch as a review candidate.
- Obtain direct GitHub Check Run evidence for the exact pushed SHA.
- Keep production deployment blocked until the SHA is on protected `main` and
  all required checks pass.
- Reconcile one canonical governance document and explicit supersession chain.

### Team 2

- Remediate or formally disposition all 10 current high dependency findings.
- Reconcile the 30-day trial and three-month 90-percent promotion state machine.
- Supply real auth, tenant isolation, persistence, and provider evidence.

### Team 3

- Deliver App and Brand Exchange staging routes with exact deployed SHA.
- Replace acceptance claims based only on fixture/mock journeys with real-user
  staging E2E.
- Supply bilingual, SEO, accessibility, and semantic runtime receipts.

### Team 4

- Commit/sign the corrected independent receipt in its dedicated branch.
- Re-run lint, E2E, supply-chain, and runtime checks on the exact remote SHA.
- Preserve independent `HOLD` authority until every release gate closes.

## 8. True state

- Source hardening: `VERIFIED_HEAD_ONLY` after the receipt commit
- API unit/type verification: `VERIFIED_CURRENT` for this local worktree
- OM AI unit verification: `VERIFIED_CURRENT` for this local worktree
- Nested security: `CONTRADICTED` for OM AI backend and Infra API Gateway
- Remote provenance: `BLOCKED` until push
- Production readiness: `NO_GO`
- Release/deploy: `HOLD`
