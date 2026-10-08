# START_HERE — OMDALA Operating Layer

> **Single entry point for all OMDALA work.**  
> If you read only one file, read this one.  
> Created: 2026-07-19 (G1.1, after G0 source recovery)

---

## 1. What is OMDALA?

OMDALA is the operating layer for real-world value — a multi-tenant platform connecting global brands, local places, and AI-powered automation across Southeast Asia.

**Product hierarchy:**
```
OMDALA Global → Country → Province/State → City/District → Local Node → Brand/Place
```

**Initial 10 countries (backlog, subject to business/legal validation):**
Vietnam, Laos, Cambodia, Thailand, Myanmar, Malaysia, Singapore, Indonesia, Philippines, Brunei.

---

## 2. Canonical Source (locked G0.5)

| Item | Value |
|------|-------|
| Repository | `git@github.com:tranhatam-collab/omdala.com.git` |
| Canonical branch | `feat/pricing-promo-engine` |
| Canonical commit | `00690da6ddb851965d6a45c0e82e19ef841d7f6f` |
| Clean worktree | `/Users/tranhatam/Documents/Devnewproject/omdala-audit-clean` |
| Cloudflare account | `Tranhatam@gmail.com` (ID: `f3f9e76222dcb488d5e303e29e8ba192`) |

**Release surfaces:** omdala.com, api.omdala.com, auth.omdala.com, app.omdala.com, admin.omdala.com, docs.omdala.com

---

## 3. Current Status

| Gate | Status | Receipt |
|------|--------|---------|
| G0 — Source Recovery | PASS (gaps disclosed) | `docs/audit/2026-07-19/G0_EXIT_SOURCE_IDENTITY_RECEIPT.md` |
| G1 — Governance Lock | IN PROGRESS | This file |
| G2 — Build/CI | PENDING | |
| G3 — Architecture/Security | PENDING | |
| G4 — Brand Factory | PENDING | |
| G5 — Staging Acceptance | PENDING | |
| G6 — Founder Approval | PENDING | |

**Release verdict: NO-GO — HOLD all production changes.**  
**Verified score: 16/100** (only 16% of acceptance chain has traceable receipts)

---

## 4. Separate Subprojects (NOT in this repo)

| Project | Location | Status |
|---------|----------|--------|
| Omone.omdala.com | `Omone.omdala.com/` | Separate repo: `github.com/tranhatam-collab/omone` |
| om-ai.omdala.com | `om-ai.omdala.com/` | Separate project (planning repo) |
| omniverse.omdala.com | `omniverse.omdala.com/` | Separate project (source missing) |
| infra | `infra/` | Separate infra configs (docker-compose, scripts) |

**Do NOT merge these into the omdala.com repo.**

---

## 5. Critical Blockers (P0)

| ID | Blocker | Gate | Fix |
|----|---------|------|-----|
| SRC-001 | Primary worktree has no valid HEAD | G0 | Use clean worktree (DONE) |
| SRC-002 | Entire project tree was untracked | G0 | Clean clone (DONE) |
| SEC-001 | Secret-bearing env files in untracked tree | G3.4 | Rotate secrets, add .gitignore |
| CI-001 | CI uses `npm ci` without npm lockfile | G2.2 | Fix CI to use pnpm |
| ROUTE-001 | Duplicate Next.js route groups | G2.3 | Delete `brand-exchange/`, keep `(brand-exchange)/` |
| AUTH-001 | auth.omdala.com serves 404 as 200 | G3.3 | Fix auth route/rendering |

---

## 6. Document Status (G1.2)

All project documents must be marked: `ACTIVE`, `REFERENCE`, `SUPERSEDED`, or `ARCHIVED`.

See `docs/audit/2026-07-19/G1_2_DOCUMENT_STATUS_INDEX.md` for full classification.

---

## 7. Key Decisions (G1.3 — requires Founder lock)

| Decision | Status | ADR |
|----------|--------|-----|
| Global platform model | PROPOSED | ADR-001 |
| Country/region tenant hierarchy | PROPOSED | ADR-002 |
| Database location (D1 vs PostgreSQL) | REQUIRES FOUNDER | ADR-003 |
| Cloudflare account ownership | LOCKED | G0.5 |
| Auth stack (Keycloak vs Auth.js vs CF Access) | REQUIRES FOUNDER | ADR-004 |
| OMCODE repository boundary | REQUIRES FOUNDER | ADR-005 |

---

## 8. How to Work on OMDALA

### Before any code change:
1. Read this file (`START_HERE.md`)
2. Check current gate status (section 3)
3. Verify you're in the clean worktree
4. Check document status (section 6)

### During development:
1. Work only in the clean worktree (`omdala-audit-clean`)
2. Follow the gate sequence (G0 → G1 → G2 → G3 → G4 → G5 → G6)
3. Create receipts for every change
4. No deploy without Founder approval (G6.2)

### Before commit:
1. Run typecheck, lint, tests
2. Verify no secrets in code
3. Verify no build artifacts staged
4. Create receipt for the change

---

## 9. Audit Trail

All audit receipts are in `docs/audit/2026-07-19/`:
- `SOURCE_VERIFICATION_RECEIPT.md` — Phase 0 source verification
- `AUDIT_BASELINE_AND_EXECUTION_BACKLOG.md` — Full audit baseline
- `RELEASE_GATE_MATRIX.md` — Release gate status
- `G0_EXIT_SOURCE_IDENTITY_RECEIPT.md` — G0 completion
- `G0_5_FOUNDER_DECISION_RECEIPT.md` — Founder decisions
- `G0_6_DIFF_RECEIPT.md` — Filesystem diff
- `G0_7_RECONSTRUCTION_PLAN.md` — Reconstruction plan

---

## 10. Contact

- Founder: tranhatam
- Audit agent: Devin (AI delivery agent)
- Repository: github.com/tranhatam-collab/omdala.com

---

*This file is the single source of truth for project navigation. All other documents are REFERENCE unless marked ACTIVE.*
