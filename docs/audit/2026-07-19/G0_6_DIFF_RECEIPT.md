# G0.6 — Diff Current Filesystem vs Canonical Commit

> **SUPERSEDED:** Use `G0_6_DIFF_RECEIPT_v2_CORRECTED.md` (2026-07-19 corrected).  
> v1 misclassified `infra/` and `om-ai.omdala.com/` as outside canonical Git.

## Date: 2026-07-19
## Canonical: feat/pricing-promo-engine @ 00690da6ddb851965d6a45c0e82e19ef841d7f6f
## Current: Broken worktree (no valid HEAD, all untracked)

## Summary

| Category | Count | Classification |
|----------|-------|----------------|
| Files in both (canonical + current) | 628 | ACCEPTED SOURCE (needs content diff) |
| Files only in canonical (git, not filesystem) | 517 | CANONICAL-ONLY (mostly build artifacts in `out/`) |
| Files only in current (filesystem, not git) | 541 | REQUIRES REVIEW — classified below |
| **Total canonical files** | **1145** | |
| **Total current files** | **1169** | (290 dataless files not counted) |

## Files only in CURRENT — Classification (541 files)

### Category A: Separate subprojects NOT in canonical repo (386 files)
These are independent projects that exist in the filesystem but are NOT part of the omdala.com git repo:

| Subproject | Files | Recommendation |
|------------|-------|----------------|
| Omone.omdala.com/ | 263 | SEPARATE REPO — has its own git, .env, CI/CD |
| om-ai.omdala.com/ | 67 | SEPARATE PROJECT — planning repo |
| omniverse.omdala.com/ | 3 | SEPARATE PROJECT — nearly empty |
| infra/ | 53 | SEPARATE — infra configs (docker-compose, scripts) |

**Recommendation:** These should be in separate repositories or clearly documented as external dependencies. They should NOT be merged into the omdala.com canonical repo.

### Category B: Audit and documentation (64 files)
| Path | Files | Classification |
|------|-------|----------------|
| docs/ | 64 | AUDIT ARTIFACTS — created during this audit session |

**Recommendation:** Keep audit artifacts in docs/audit/. Mark as REFERENCE.

### Category C: Truncated filename anomalies (6 files)
| File | Size | Date |
|------|------|------|
| O | 4581 | 2026-07-06 |
| Om | 4581 | 2026-07-06 |
| Omone | 4581 | 2026-07-06 |
| Omone.om | 4581 | 2026-07-06 |
| Omone.omd | 4581 | 2026-07-06 |
| Omone.omdala | 4581 | 2026-07-06 |

**Recommendation:** DISCARD CANDIDATES — filesystem corruption artifacts. Preserve as evidence until G0.7 review.

### Category D: Local uncommitted changes to canonical project (85 files)
These are changes to the omdala.com project that exist in the filesystem but were never committed:

#### D1: Duplicate route groups (ROUTE-001 P0) (20+ files)
CRITICAL: Two route groups generating same paths:
- `(brand-exchange)/dashboard/page.tsx` AND `brand-exchange/dashboard/page.tsx`
- `(brand-exchange)/profile/page.tsx` AND `brand-exchange/profile/page.tsx`
- `(brand-exchange)/settings/page.tsx` AND `brand-exchange/settings/page.tsx`
- Plus duplicate: brands, listings, proofs, etc.

**Recommendation:** MUST RESOLVE in G2.3 — choose one route group, delete the other.

#### D2: New components not in canonical (10+ files)
- AdminModerationQueue.tsx
- AdminSessionGuard.tsx
- app-frame.tsx
- app-nav.tsx
- live-api-panel.tsx
- magic-link-form.tsx
- lib/api.ts
- lib/navigation.ts

**Recommendation:** REVIEW — may be accepted source if they pass build/test.

#### D3: Build artifacts (3 files)
- apps/admin/tsconfig.tsbuildinfo
- apps/app/tsconfig.tsbuildinfo
- apps/auth/tsconfig.tsbuildinfo

**Recommendation:** DISCARD — generated artifacts, add to .gitignore.

#### D4: Audit reports (2 files)
- QA_AUDIT_OMDALA_OMCODE_OMONE_2026-07-06.md
- QA_AUDIT_REPORT_2026-07-04.md

**Recommendation:** REFERENCE — keep as historical audit docs.

## Files only in CANONICAL — Classification (517 files)

### Build artifacts committed to git (100+ files)
- `apps/admin/out/` — Next.js static export (404.html, index.html, _next/static/*, etc.)

**Recommendation:** REMOVE FROM GIT — build artifacts should not be committed. Add `out/` to .gitignore.

### Source files not in filesystem (400+ files)
These are in the git commit but not in the current filesystem snapshot. Some may be in the 290 dataless files (iCloud stubs not yet hydrated).

**Recommendation:** HYDRATE in G0.3, then re-diff. Canonical source is authoritative.

## Route Conflict Detail (ROUTE-001)

Duplicate route groups found in `apps/app/app/`:

| Route path | Group 1 | Group 2 | Conflict |
|------------|---------|---------|----------|
| /dashboard | (brand-exchange)/dashboard/ | brand-exchange/dashboard/ | YES |
| /profile | (brand-exchange)/profile/ | brand-exchange/profile/ | YES |
| /settings | (brand-exchange)/settings/ | brand-exchange/settings/ | YES |
| /brands | (brand-exchange)/brands/ | brand-exchange/brands/ | YES |
| /listings | (brand-exchange)/listings/ | brand-exchange/listings/ | YES |
| /proofs | (brand-exchange)/proof-vault/ | brand-exchange/proof-vault/ | YES |

**Next.js behavior:** Both groups resolve to the same URL path → build failure or ambiguous routing.

**Fix (G2.3):** Choose one group. Recommended: keep `(brand-exchange)/` (Next.js route group convention), delete `brand-exchange/` (without parentheses).

## Delta Classification Summary

| Classification | Count | Action |
|----------------|-------|--------|
| ACCEPTED SOURCE (in both) | 628 | Content diff needed |
| CANONICAL-ONLY (build artifacts) | ~100 | Remove from git |
| CANONICAL-ONLY (source) | ~417 | Hydrate + verify |
| SEPARATE SUBPROJECTS | 386 | Separate repos |
| AUDIT ARTIFACTS | 64 | Keep as reference |
| ANOMALIES | 6 | Discard (preserve evidence) |
| LOCAL CHANGES — routes | 20+ | Resolve conflict (G2.3) |
| LOCAL CHANGES — new code | 10+ | Review and accept/reject |
| BUILD ARTIFACTS | 3 | Discard, add .gitignore |
| AUDIT REPORTS | 2 | Keep as reference |

## Next Steps
- G0.7: Reconstruct clean integration branch from reviewed deltas
- G0.3 (revisit): Hydrate 290 dataless files, re-diff
- G2.3: Resolve duplicate route groups
- G2.4: Add build artifacts to .gitignore
