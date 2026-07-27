# G0.6 DIFF RECEIPT v2 — CORRECTED (per Independent Verification)

## Date: 2026-07-19 (corrected)
## Supersedes: G0_6_DIFF_RECEIPT.md (v1 — misclassified tracked dirs as subprojects)
## Canonical: feat/pricing-promo-engine @ 00690da6ddb851965d6a45c0e82e19ef841d7f6f

## Correction Summary

v1 incorrectly classified `infra/` and `om-ai.omdala.com/` as "separate subprojects outside canonical repo." Independent verification proved they ARE tracked in canonical Git:

| Directory | v1 classification | CORRECTED | Tracked files in canonical |
|-----------|-------------------|-----------|---------------------------|
| infra/ | SEPARATE SUBPROJECT | **TRACKED IN CANONICAL** | 98 |
| om-ai.omdala.com/ | SEPARATE SUBPROJECT | **TRACKED IN CANONICAL** | 323 |
| omniverse.omdala.com/ | SEPARATE PROJECT | **TRACKED IN CANONICAL** | 1 |

## Corrected Diff Summary

| Category | Count | Notes |
|----------|-------|-------|
| Files in both (canonical + current) | 628 | Accepted source (needs content diff) |
| Files only in canonical (git, not filesystem) | 517 | See breakdown below |
| Files only in current (filesystem, not git) | 540 | See breakdown below |
| **Total canonical files** | **1145** | |
| **Total current files** | **1168** | (290 dataless files not counted) |

## Files only in CANONICAL (517) — by top-level

| Directory | Files | Classification |
|-----------|-------|----------------|
| om-ai.omdala.com/ | 211 | CANONICAL SOURCE — mostly `.deploy-artifacts/` (build artifacts committed to git) + `.github/` workflows + source files |
| reports/ | 154 | CANONICAL SOURCE — bilingual scan reports, automation logs |
| infra/ | 71 | CANONICAL SOURCE — CI workflows, docker-compose, docs, env examples |
| apps/ | 61 | CANONICAL SOURCE — mostly `apps/admin/out/` (33 build artifacts) + `apps/docs/out/` + source files (.js versions, .env.local.example, electron config) |
| packages/ | 15 | CANONICAL SOURCE — package files not in filesystem |
| docs/ | 4 | CANONICAL SOURCE |
| services/ | 1 | CANONICAL SOURCE |

### Key findings:
- `om-ai.omdala.com/.deploy-artifacts/` — build artifacts committed to git (should be removed)
- `apps/admin/out/` and `apps/docs/out/` — build artifacts committed to git (should be removed)
- `reports/bilingual/` — 154 historical scan reports in git
- Source `.js` files in canonical that have `.tsx` equivalents in filesystem (e.g., `app-nav.js` vs `app-nav.tsx`)

## Files only in CURRENT (540) — by top-level

| Directory | Files | Classification |
|-----------|-------|----------------|
| Omone.omdala.com/ | 263 | **SEPARATE PROJECT** — has its own git repo (github.com/tranhatam-collab/omone). NOT in canonical. |
| docs/ | 64 | AUDIT ARTIFACTS — created during audit sessions (docs/audit/2026-07-19/) |
| apps/ | 59 | LOCAL CHANGES — duplicate route groups `(brand-exchange)/`, new components, .tsbuildinfo |
| infra/ | 53 | LOCAL CHANGES — new docs, docker-compose variants, bridge worker |
| om-ai.omdala.com/ | 67 | LOCAL CHANGES — mobile app (android/ios), new docs, .DS_Store |
| packages/ | 11 | LOCAL CHANGES |
| mobile/ | 9 | **NEW PROJECT** — not in canonical at all |
| omniverse.omdala.com/ | 3 | LOCAL CHANGES — .DS_Store, .tsbuildinfo |
| services/ | 3 | LOCAL CHANGES |
| Root anomalies (O, Om, Omone...) | 6 | CORRUPTION — truncated filename artifacts |
| Root audit reports | 2 | REFERENCE — QA_AUDIT_*.md |

### Key findings:
- `Omone.omdala.com/` (263 files) is genuinely a separate project — NOT in canonical git
- `mobile/` (9 files) is a new project not in canonical
- `(brand-exchange)/` route groups exist ONLY in filesystem, NOT in canonical — these are local uncommitted additions
- Canonical has NO `brand-exchange` routes at all (neither with nor without parentheses)
- 6 truncated filename anomalies (O, Om, Omone, Omone.om, Omone.omd, Omone.omdala) — corruption

## ROUTE-001 Correction

v1 claimed duplicate route groups `(brand-exchange)/` vs `brand-exchange/` in canonical.
**CORRECTED:** Neither exists in canonical commit 00690da. Both are local uncommitted additions in the broken filesystem only.

| Route | In canonical? | In filesystem? |
|-------|--------------|----------------|
| `(brand-exchange)/dashboard/` | NO | YES |
| `brand-exchange/dashboard/` | NO | YES |
| `(brand-exchange)/profile/` | NO | YES |
| `brand-exchange/profile/` | NO | YES |

**Impact on G2.3:** Route conflict is a filesystem-only issue. If we deploy from canonical commit, there are no duplicate routes. The `(brand-exchange)/` and `brand-exchange/` groups need review but only affect local changes, not the canonical release.

## Corrected Delta Decision Matrix

| Delta | Count | Action | Gate |
|-------|-------|--------|------|
| 628 files in both | 628 | Content diff (verify no local modifications) | G0.7 |
| 211 om-ai canonical-only | 211 | Keep as canonical source; remove `.deploy-artifacts/` from git | G2.4 |
| 154 reports canonical-only | 154 | Keep as canonical source (historical reports) | G0.7 |
| 71 infra canonical-only | 71 | Keep as canonical source | G0.7 |
| 61 apps canonical-only | 61 | Keep source; remove `out/` build artifacts from git (33 files) | G2.4 |
| 15 packages canonical-only | 15 | Keep as canonical source | G0.7 |
| 263 Omone.omdala.com/ | 263 | EXCLUDE — separate repo (github.com/tranhatam-collab/omone) | N/A |
| 64 docs/ audit artifacts | 64 | Keep as audit reference (docs/audit/2026-07-19/) | G0.7 |
| 59 apps local changes | 59 | REVIEW — includes `(brand-exchange)/` routes, new components, .tsbuildinfo | G0.7 |
| 53 infra local changes | 53 | REVIEW — new docs, docker-compose variants | G0.7 |
| 67 om-ai local changes | 67 | REVIEW — mobile app, new docs | G0.7 |
| 9 mobile/ | 9 | NEW PROJECT — decide if it should be in canonical | G0.7 |
| 6 anomalies | 6 | DISCARD — filesystem corruption | G0.7 |
| 2 root audit reports | 2 | REFERENCE — keep | G0.7 |

## Next Steps (per Independent Verification backlog)
1. Hydrate 290 dataless files, rerun snapshot/diff
2. Review dirty candidate diff (4 modified, 33 staged deletions, 2706-line lockfile)
3. Resolve ADR/source conflicts (D1 limits, Auth.js vs custom, OMCODE boundary)
4. Create D1 migrations and tenant-isolation tests
5. Expand CI (API/app tests, lint, E2E, bilingual, security)
6. Commit accepted candidate, run GitHub CI on exact SHA
