# G0.7 — Clean Integration Branch Reconstruction Plan

## Date: 2026-07-19
## Status: PLAN DOCUMENTED — awaiting G1 governance lock before execution
## Policy: No blind reset, no bulk add — every delta reviewed individually

## Starting Point
- Clean worktree: /Users/tranhatam/Documents/Devnewproject/omdala-audit-clean
- Canonical branch: feat/pricing-promo-engine @ 00690da
- New integration branch: `integration/g0-recovery` (to be created)

## Reconstruction Steps (to execute after G1 approval)

### Step 1: Create integration branch
```bash
cd /Users/tranhatam/Documents/Devnewproject/omdala-audit-clean
git checkout -b integration/g0-recovery
```

### Step 2: Apply ACCEPTED SOURCE deltas (Category D2 — new components)
These are local changes to the canonical project that should be reviewed and applied:

| File | Action | Rationale |
|------|--------|-----------|
| apps/admin/app/components/AdminModerationQueue.tsx | REVIEW | New component, may be needed |
| apps/admin/app/components/AdminSessionGuard.tsx | REVIEW | New component, may be needed |
| apps/app/components/app-frame.tsx | REVIEW | New component |
| apps/app/components/app-nav.tsx | REVIEW | New component (replaces app-nav.js?) |
| apps/app/components/live-api-panel.tsx | REVIEW | New component (replaces live-api-panel.js?) |
| apps/app/components/magic-link-form.tsx | REVIEW | New component |
| apps/app/lib/api.ts | REVIEW | API client |
| apps/app/lib/navigation.ts | REVIEW | Navigation utility |

### Step 3: REMOVE duplicate route groups (Category D1 — ROUTE-001 P0)
Delete `apps/app/app/brand-exchange/` (without parentheses) — keep `(brand-exchange)/`:

```bash
# DELETE these (duplicate routes):
apps/app/app/brand-exchange/admin/
apps/app/app/brand-exchange/ai-assistant/
apps/app/app/brand-exchange/brands/
apps/app/app/brand-exchange/dashboard/
apps/app/app/brand-exchange/deal-rooms/
apps/app/app/brand-exchange/listings/
apps/app/app/brand-exchange/profile/
apps/app/app/brand-exchange/proof-vault/
apps/app/app/brand-exchange/runtime-truth/
apps/app/app/brand-exchange/settings/

# KEEP these (Next.js route group convention):
apps/app/app/(brand-exchange)/brands/
apps/app/app/(brand-exchange)/dashboard/
apps/app/app/(brand-exchange)/listings/
apps/app/app/(brand-exchange)/profile/
apps/app/app/(brand-exchange)/proof-vault/
apps/app/app/(brand-exchange)/runtime-truth/
apps/app/app/(brand-exchange)/settings/
```

### Step 4: Remove build artifacts from git (G2.4)
```bash
# Remove committed build artifacts:
git rm -r apps/admin/out/
# Add to .gitignore:
echo "out/" >> .gitignore
echo "tsconfig.tsbuildinfo" >> .gitignore
```

### Step 5: DO NOT merge separate subprojects
These stay as separate repos/directories:
- Omone.omdala.com/ → separate repo (github.com/tranhatam-collab/omone)
- om-ai.omdala.com/ → separate project
- omniverse.omdala.com/ → separate project
- infra/ → separate infra configs

### Step 6: DO NOT include anomalies
- O, Om, Omone, Omone.om, Omone.omd, Omone.omdala → discard (filesystem corruption)

### Step 7: DO NOT include secret files
- .env.db.local, infra/.env.local, Omone.omdala.com/.env → excluded (G3.4 will handle)

### Step 8: Commit with receipt
```bash
git add <reviewed files only>
git commit -m "G0.7: Reconstruct integration branch from reviewed deltas

- Apply accepted new components (D2)
- Remove duplicate route groups (D1, ROUTE-001)
- Remove build artifacts from git (G2.4)
- Exclude separate subprojects, anomalies, secrets

Receipt: docs/audit/2026-07-19/G0_7_RECONSTRUCTION_PLAN.md"
```

## Delta Decision Matrix

| Delta | Classification | Action | Gate |
|-------|---------------|--------|------|
| 628 files in both | ACCEPTED SOURCE | Content diff (verify no local modifications) | G0.7 |
| 517 files canonical-only | CANONICAL | Keep as-is (authoritative) | G0.7 |
| 263 files Omone.omdala.com/ | SEPARATE REPO | Exclude from integration branch | N/A |
| 67 files om-ai.omdala.com/ | SEPARATE PROJECT | Exclude | N/A |
| 3 files omniverse.omdala.com/ | SEPARATE PROJECT | Exclude | N/A |
| 53 files infra/ | SEPARATE | Exclude (separate infra repo) | N/A |
| 64 files docs/ | AUDIT ARTIFACTS | Include in docs/audit/ | G0.7 |
| 6 truncated anomalies | CORRUPTION | Discard | G0.7 |
| 20+ duplicate routes | ROUTE-001 P0 | Delete `brand-exchange/` (keep `(brand-exchange)/`) | G2.3 |
| 10+ new components | NEW CODE | Review and accept individually | G0.7 |
| 3 tsbuildinfo | BUILD ARTIFACTS | Discard, add .gitignore | G2.4 |
| 2 audit reports | REFERENCE | Keep | G0.7 |
| 7 secret files | SECRETS | Exclude, rotate in G3.4 | G3.4 |
| 290 dataless files | UNHYDRATED | Hydrate in G0.3, re-diff | G0.3 |

## Pre-conditions before execution
1. G1.1-G1.4 completed (governance lock)
2. Founder approves this reconstruction plan
3. G0.3 hydration completed (290 dataless files)
4. Content diff of 628 shared files completed

## Post-conditions (G0 EXIT)
1. Valid HEAD on integration/g0-recovery branch
2. Clean git status (no untracked files in canonical project)
3. Reviewed delta manifest committed
4. Source identity receipt recorded
