# Fix Receipt — G0–G6 Backlog — 2026-07-21

**Repo:** `omdala-audit-clean` (canonical clone)  
**Base:** `00690da` → candidate fixes (uncommitted until `git commit`)  
**Production mutation:** none  
**Remote D1 migration apply:** none (Founder gate)

## Completed in this pass

| # | Item | Status |
|---|------|--------|
| 1 | G0.6 supersede v1; v2 corrected receipt in tree | Done |
| 2 | ADR-003/005/006 corrections synced (`ADRS_G1_4.md`) | Done |
| 3 | G3 baseline: Auth.js → custom auth; D1 10GB limits | Done |
| 4 | App + Brand Exchange specs; VND line fixed | Done |
| 5 | D1 migrations: 20 entities + auth + audit SQL | Done |
| 6 | Tenant isolation helpers + schema tests (`@omdala/core`) | Done |
| 7 | CI: pnpm scripts, API/app/core tests, infra gateway/worker, lint | Done |
| 8 | `.gitignore`: exclude `apps/*/out/` build artifacts | Done |
| 9 | Omone: `STAGING_DATABASE_URL` falls back to `DATABASE_URL` | Done (in `Omone.omdala.com` sibling repo) |
| 10 | Infra api-gateway tests (23) + worker tests (10) | PASS local |

## Still open (not auto-fixed)

| Gate | Blocker |
|------|---------|
| G0 | Hydrate 290 dataless files; repair broken `omdala.com` worktree (0 commits) |
| G2 EXIT | GitHub Actions PASS on committed SHA |
| G3 EXIT | Remote D1 apply + secret rotation + backup/restore drill |
| G4 EXIT | Brand Factory API/renderer/approval implementation |
| G5 | Deploy apps to empty Pages projects; run migrations on staging D1 |
| G6 | Founder release packet after G2–G5 |

## Score estimate after this pass

| Dimension | Before | After (local) |
|-----------|--------|---------------|
| Architecture/data ownership | 4/10 | **6/10** (migrations + tests exist) |
| Automated quality evidence | 5/10 | **7/10** (CI expanded, tenant tests) |
| Governance consistency | 5/10 | **7/10** (ADR/G3 aligned) |
| **Total (defensible)** | 39/100 | **~50/100** until CI + staging receipts |

## Local verification (2026-07-21)

| Suite | Result |
|-------|--------|
| `pnpm run typecheck` | PASS |
| `@omdala/api` | 47/47 PASS |
| `@omdala/app` | 27/27 PASS |
| `@omdala/core` (tenant isolation) | 7/7 PASS |
| Next.js builds (web, app, admin, auth, docs) | PASS |
| `infra/services/api-gateway` | 23/23 PASS |
| `infra/services/worker` | 10/10 PASS |

## Next command (Founder/eng)

```bash
cd omdala-audit-clean
pnpm install
pnpm run typecheck && pnpm run test:api && pnpm run test:app && pnpm run test:d1
git add -A && git commit -m "fix: G0-G6 backlog — D1 migrations, CI, ADR alignment"
git push origin feat/pricing-promo-engine
```

Do **not** run `wrangler d1 migrations apply --remote` until G5 authorization.
