# Team 2 Wave 0 Execution Receipt

Date: 2026-10-07 (Asia/Ho_Chi_Minh)
Team: Team 2 - API, identity, data, billing, and shared product surfaces
Worktree: `.team1/.team2/team2-wave0-20261007`
Branch: `OMCODE/team2-wave0-20261007`
Base/source SHA: `415927e5f1580d539013b55765dfba834de655e7`
True state: `VERIFIED_WORKTREE_ONLY`
Overall gate: `HOLD`

## Implemented in This Worktree

- Reality repository reads for states, commitments, and transitions now join
  through owned nodes; proofs validate commitment/transition scope before
  insert.
- Commitment creation requires both nodes to belong to the authenticated
  owner.
- Scene run actor identity comes from the verified session context, not a
  caller-controlled `x-user-id` or `x-actor-id` header.
- Resource-scope failures map to a non-disclosing `404 RESOURCE_NOT_FOUND`.
- API contract primitives are versioned at `2026-10-07`; run pagination is
  normalized and capped at 100 with a compatibility alias.
- Monthly pricing can no longer convert during the free trial. The recorded
  trial end is required before expiry, then the eligible monthly path receives
  three promo cycles at 90% off.
- Added data-authority ADR and consumer contract packet. Both are proposals,
  not approvals.

## Verification

| Gate | Command | Result |
|---|---|---|
| API tests | `PATH=.../v22.22.3/bin:$PATH pnpm --filter @omdala/api test` | `PASS 13 files / 81 tests` |
| API typecheck | `PATH=.../v22.22.3/bin:$PATH pnpm --filter @omdala/api run check` | `PASS` |
| Billing tests | `PATH=.../v22.22.3/bin:$PATH pnpm --filter @omdala/billing test` | `PASS 28 tests` |
| Billing typecheck/build | `PATH=.../v22.22.3/bin:$PATH pnpm --filter @omdala/billing run typecheck && ... build` | `PASS` |
| Root shared typecheck | `PATH=.../v22.22.3/bin:$PATH pnpm typecheck` | `PASS` |
| Core tests | `PATH=.../v22.22.3/bin:$PATH pnpm --filter @omdala/core test` | `PASS 7/7` |
| Admin/docs/auth typecheck | respective `pnpm --filter ... typecheck` commands | `PASS` |
| Admin/docs build | respective `pnpm --filter ... build` commands | `PASS`, static export |
| App tests | `PATH=.../v22.22.3/bin:$PATH pnpm --filter @omdala/app test` | `PASS 27/27` |
| Diff hygiene | `git diff --check` | `PASS` |
| Runtime | Cloudflare staging/API/Hyperdrive | `NOT_CHECKED / BLOCKED` |

The worktree was dependency-installed from the existing lockfile. The first
clean-shell attempt correctly failed because dependencies were absent and the
default shell selected Node `24.18.0`; all passing gates above were rerun with
Node `22.22.3`, the repository engine version.

## Crosswalk State

| Record | State | Evidence or blocker |
|---|---|---|
| G05 | `PROPOSED` | ADR added; Founder/Team 4 authority approval absent |
| B01 | `VERIFIED_WORKTREE_ONLY` | Versioned envelope/pagination contract and tests; consumer sign-off absent |
| B02 | `PARTIAL` | PostgreSQL migration exists; exact staging binding and rehearsal absent |
| B03 | `VERIFIED_WORKTREE_ONLY` | Session guard/provider route tests; external FGA/provider proof absent |
| B04 | `VERIFIED_WORKTREE_ONLY` | Owner-scoped repository code/tests; staging negative test absent |
| B05 | `VERIFIED_WORKTREE_ONLY` | Local session lifecycle tests; real auth/mail staging absent |
| B06 | `VERIFIED_WORKTREE_ONLY` | Health identity/dependency tests; deployed identity absent |
| B07 | `PARTIAL` | Core error/ownership paths hardened; approval/deploy semantics absent |
| B08 | `BLOCKED` | No accepted queue/DLQ/replay resource and delivery receipt |
| B09 | `BLOCKED` | No approved real consumer/export/cutover source |
| B10 | `BLOCKED` | Usage/quota remains non-persistent; provider staging absent |
| B11 | `PARTIAL` | Request correlation exists; append-only persisted audit is absent |
| B12 | `BLOCKED` | Retention/export/delete/restore authority and rehearsal absent |
| B13 | `VERIFIED_WORKTREE_ONLY` | Billing 28 tests pass; merchant/webhook/sandbox evidence absent |
| B14 | `BLOCKED` | No real staging API/integration acceptance run |
| L01 | `BLOCKED` | DPA/subprocessor/residency approval absent |
| R05 | `BLOCKED` | Production smoke is prohibited while release is HOLD |

## Explicit Non-Claims

This receipt does not claim clean candidate integration, remote commit, push,
staging deployment, Cloudflare resource creation, migration, secret/DNS
mutation, production readiness, independent Team 4 acceptance, or Founder
approval. The current candidate remains `PRODUCTION HOLD / NO_GO` until the
external gates are independently evidenced.

## Next Authorized Actions

1. Founder selects the data authority and names the staging/prod resource
   owners.
2. Team 1 provides read-only Cloudflare/GitHub metadata and protected staging
   environment configuration.
3. Team 2 rehearses migrations, backup/restore, tenant negative paths, and
   real provider/mail receipts on staging only.
4. Team 4 verifies this exact SHA and receipt before any production decision.
