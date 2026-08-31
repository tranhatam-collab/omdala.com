# OMDALA Source Verification Receipt — 2026-07-19

Status: **FAILED — canonical source is not established**  
Scope: Phase 0 source, Git, configuration, and read-only live verification  
Mutation policy: no source edit, no Git repair, no commit, no deployment

## 1. Repository identity

| Check | Receipt | Result |
|---|---|---|
| Working directory | `/Users/tranhatam/Documents/Devnewproject/omdala.com` | Observed |
| Configured branch | `feat/pricing-promo-engine` | Observed |
| `HEAD` | `fatal: ambiguous argument 'HEAD'` | **FAIL** |
| Worktree HEAD | `0000000000000000000000000000000000000000` | **FAIL** |
| Worktree state | Every visible project path is `??` untracked | **FAIL** |
| Remote | `git@github.com:tranhatam-collab/omdala.com.git` | Observed, ownership not re-authenticated |
| Readable remote-tracking object | `origin/main` at `63433d32c0ad4adfbdd566800c0b11174b75499e` | Object readable; not proven to match filesystem or production |
| Secondary worktree | `.claude/worktrees/beautiful-bassi-5923d8`, HEAD `63433d...` | Observed; not selected as canonical |

The current checkout cannot produce a trustworthy diff, commit, merge, tag, or deployment receipt. No destructive Git recovery is authorized. The complete current filesystem must be preserved before any checkout, reset, index rebuild, or branch repair.

## 2. Toolchain and package identity

| Check | Receipt | Result |
|---|---|---|
| Current Node | `v24.15.0` | Observed |
| Root package manager declaration | `pnpm@9.15.0` | Observed |
| Root lockfile | `pnpm-lock.yaml` | Present |
| Root npm lockfile | none found | **FAIL for current CI** |
| CI install command | root workflow uses `npm ci` | **FAIL: no matching root npm lockfile** |
| App toolchains | mixed Next.js/React generations | Requires matrix verification |

No build or test was run in this phase. Running them now would not solve source identity and could produce misleading green evidence from an unversioned tree.

## 3. Read-only production observations

Observed on 2026-07-19 from HTTP/DNS probes. These receipts prove only the response seen at that moment; they do not identify the deployed commit.

| Surface | HTTP/runtime observation | Result |
|---|---|---|
| `omdala.com` | HTTP 200; title `OMDALA — The Operating Layer for Real-World Value` | Partial PASS |
| `www.omdala.com` | DNS resolution failed | **FAIL** |
| `app.omdala.com` | HTTP 200; title `OMDALA App`; `noindex, nofollow` | Partial PASS |
| `api.omdala.com/health` | HTTP 200; `{"ok":true,"service":"omdala-api"}` | Health-only PASS |
| `auth.omdala.com` | HTTP 200 but rendered `This page could not be found` | **FAIL: semantic 404 masked as 200** |
| `docs.omdala.com` | HTTP 200 | Partial PASS |
| `admin.omdala.com` | HTTP 200; `noindex, nofollow`; frame denied | Partial PASS |

No response exposed a verified deployment SHA, release ID, artifact digest, or source map to the current checkout. Therefore live/source parity is **NOT VERIFIED**.

## 4. Source-integrity blockers

1. Branch reference exists in `.git/HEAD`, but no valid commit is attached to the primary worktree.
2. The index is not a trustworthy representation of the filesystem; visible project content is entirely untracked.
3. Historical duplicate index artifacts exist and indicate prior Git/index corruption.
4. Some filesystem reads time out, consistent with partially hydrated or cloud-backed files.
5. Secret-bearing local environment files exist (`.env.db.local`, `infra/.env.local`). Only names/existence were inspected; values were not read or recorded.
6. Generated output and dependency directories coexist in the untracked tree, preventing a reliable source/artifact boundary.

## 5. Required recovery gate

Before development resumes:

1. Create a recoverable, checksummed snapshot of the current filesystem excluding secret values.
2. Fetch remote refs in a separate clean directory or clean worktree.
3. Founder selects the canonical repository, branch, and commit.
4. Compare the preserved filesystem to that canonical commit without overwriting either side.
5. Classify each delta as accepted source, generated artifact, local secret/config, or discard candidate.
6. Reconstruct a clean integration branch only from reviewed deltas.
7. Record commit SHA and bind subsequent build, deployment, and runtime receipts to it.

Until this gate passes, the current directory is evidence input, not an accepted release source.
