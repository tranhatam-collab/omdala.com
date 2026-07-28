# OMDALA Team 1 Release Source Manifest

Date: 2026-07-28
Owner: Team 1 - Source, CI/CD, Cloudflare, DNS, release control
Baseline: `71f3f32f45f499b7a3bce4fbd6b753319a939779`
Working branch: `OMCODE/team1-release-foundation-20260728`
Current candidate before this update: `528a0e47420e8135cd6d12b045738e52a9959c67`
Canonical release checkout: `/Users/tranhatam/Documents/Devnewproject/omdala-release-clean-20260728`
Release verdict: `HOLD`

## Source lock

The release source is the clean clone of `git@github.com:tranhatam-collab/omdala.com.git`.
The damaged checkout at `/Users/tranhatam/Documents/Devnewproject/omdala.com` is evidence-only until Git recovery is completed.
No release may be created from an uncommitted or untraceable working tree.
Release commands require Node `22.x` and pnpm `9.15.x`; `.nvmrc`, `.node-version`, package-manager and engine constraints are source-controlled.

## Surface registry

| Surface | Canonical source | Runtime | Current evidence | Release state |
|---|---|---|---|---|
| `omdala.com` | `apps/web` | Cloudflare Pages project `omdala-web` | HTTP 200; deployed SHA not proven | HOLD |
| `app.omdala.com` | `apps/app` | Cloudflare Pages project `omdala-app` | Root 200; `/workspace` production 404 while route exists in source | FAIL |
| `admin.omdala.com` | `apps/admin` | Cloudflare Pages project `omdala-admin` | HTTP 200; deployed SHA not proven | HOLD |
| `auth.omdala.com` | `apps/auth` | Cloudflare Pages project `omdala-auth` | Root includes Next error marker; login surface exists | FAIL |
| `docs.omdala.com` | `apps/docs` | Cloudflare Pages project `omdala-docs` | HTTP 200; project is older than release branch | HOLD |
| `omcode.omdala.com` | `apps/app/app/omcode` | Cloudflare Pages project `omcode` | Marketing shell 200; product workspace E2E fails | FAIL |
| `api.omdala.com` | `services/api` | Cloudflare Worker `omdala-api` | Health 200; `/v2/reality/nodes` 500; live Worker predates branch | FAIL |
| `brand.omdala.com` | Not implemented in canonical branch | Not provisioned | NXDOMAIN | NOT BUILT |
| `om-ai.omdala.com` | Separate `om-ai.omdala.com` tree, excluded from root workspace | Not proven | NXDOMAIN; `/v2/live/*` 404 | NOT RELEASED |
| `omniverse.omdala.com` | No executable canonical product | Not provisioned | NXDOMAIN | NOT BUILT |
| `code.omdala.com` | ADR decision open | Not provisioned | NXDOMAIN | HOLD |
| `www.omdala.com` | Redirect target not locked | Not provisioned | NXDOMAIN | FAIL |
| `omone.omdala.com` family | Separate repository `tranhatam-collab/omone` | Separate Cloudflare surfaces | Live, but local and remote histories have no merge base; remote CI/deploy red | FAIL |

## CI/CD lock

1. Lint is a hard gate. No `continue-on-error` is allowed.
2. Production dependencies fail on high or critical advisories.
3. Development dependencies fail on critical advisories.
4. App and Web Playwright suites run in CI with Chromium.
5. Production release is manual and requires the protected GitHub environment plus `DEPLOY_OMDALA` confirmation.
6. The release workflow checks out and records the exact deployed SHA.
7. Pages releases remain blocked until every Pages project has an explicit repository, branch and deployed-SHA receipt.
8. API release fails closed while `services/api/wrangler.toml` has no explicit D1 or Hyperdrive binding.

## Team 1 exit conditions

- Clean branch and exact baseline SHA are recorded.
- Security audit has zero production high/critical and zero development critical findings.
- Build, typecheck and unit tests pass after dependency upgrades.
- CI exposes lint and E2E failures instead of masking them.
- Deployment workflow targets the actual `services/api` Worker package.
- Wrangler dry-run compiles the Worker bundle; runtime binding preflight remains blocked pending Team 2 architecture lock.
- Production mutation remains disabled until downstream gates and Founder approval pass.

## Verification receipt

| Gate | Evidence | Result | Owner of remaining work |
|---|---|---|---|
| Frozen dependency install | `pnpm install --frozen-lockfile` | PASS | Team 1 |
| Production security policy | 17 findings: 4 low, 13 moderate, 0 high, 0 critical | PASS | Team 1 monitors |
| Development security policy | 3 findings: 1 moderate, 2 high, 0 critical | PASS under critical-only policy | Team 1 monitors |
| TypeScript | `pnpm typecheck` | PASS | Shared |
| Unit tests | API 47/47, App 27/27, Core 7/7 | PASS | Shared |
| Monorepo build | `pnpm build:all` | PASS | Shared |
| Lint | 213 findings: 73 errors, 140 warnings | FAIL | Teams 2 to 5 by file ownership |
| App browser E2E | 1 passed, 8 failed | FAIL | Teams 3 and 5 |
| Web browser E2E | 0 passed, 1 failed due stale bilingual copy expectation | FAIL | Team 4 |
| Worker compile | `wrangler deploy --dry-run`, 455.86 KiB, gzip 97.05 KiB | PASS | Team 1 |
| Runtime data binding | Wrangler reports no bindings | BLOCKED | Team 2 architecture decision and Founder approval |
| Production release | No production mutation performed | HOLD | Founder after all gates pass |

Team 1 is complete only as a release-foundation lane. The OMDALA ecosystem is not release-ready while any downstream gate above remains red or blocked.
