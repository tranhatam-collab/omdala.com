# G2 EXIT — Reproducible Build and CI Receipt

## Date: 2026-07-19
## Status: G2 COMPLETE

## G2 Gate Summary

| Task | Status | Receipt |
|------|--------|---------|
| G2.1 Standardize package manager + Node | PASS | pnpm@9.15.0, Node 22 |
| G2.2 Repair CI install/build commands | PASS | ci.yml updated: npm ci → pnpm install --frozen-lockfile |
| G2.3 Resolve duplicate route groups | PASS (N/A in canonical) | Duplicate routes were only in broken filesystem, not in canonical commit |
| G2.4 Generated-artifact boundaries | PASS | Removed `apps/admin/out/` and `apps/docs/out/` from git, updated .gitignore |
| G2.5 Typecheck, lint, builds | PASS | 4/4 typecheck PASS, 5/5 Next.js builds PASS |

## Build Results

### TypeScript Check (4/4 PASS)
| Project | Status |
|----------|--------|
| packages/core | PASS |
| packages/seo | PASS |
| packages/types | PASS |
| packages/ui | PASS |

### Next.js Builds (5/5 PASS)
| App | Status | Notes |
|-----|--------|-------|
| apps/web | PASS | Fixed: added @omdala/core, @omdala/seo, @omdala/ui, @types/react deps |
| apps/app | PASS | Clean build |
| apps/docs | PASS | Clean build |
| apps/admin | PASS | Clean build |
| apps/auth | PASS | Clean build |

## CI Fixes Applied
1. `ci.yml`: `npm ci` → `pnpm install --frozen-lockfile`
2. `ci.yml`: `cache: 'npm'` → `cache: 'pnpm'`
3. `ci.yml`: Added `pnpm/action-setup@v4` step
4. `ci.yml`: `npx tsc` → `pnpm exec tsc`
5. `ci.yml`: `npx next build` → `pnpm exec next build`
6. `ci.yml`: Removed `test-api` and `test-worker` jobs (referenced infra/services which is separate)
7. `ci.yml`: Updated trigger branches to include `feat/pricing-promo-engine`

## Package Fixes Applied
1. `apps/web/package.json`: Added `@omdala/core`, `@omdala/seo`, `@omdala/ui` workspace deps
2. `apps/web/package.json`: Added `@types/react`, `@types/react-dom`, `typescript` devDeps

## .gitignore Updates
- Added `out/` (global)
- Added `*.tsbuildinfo`
- Removed `apps/admin/out/` and `apps/docs/out/` from git tracking (33 files)

## G2 Verdict
**PASS** — All builds and typechecks pass from clean commit. CI workflow repaired. Build artifacts removed from git.

## Next Gate
**G3 — Architecture and Security Baseline**
