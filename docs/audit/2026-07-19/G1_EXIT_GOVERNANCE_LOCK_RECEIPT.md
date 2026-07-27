# G1 EXIT — Governance Lock Receipt

## Date: 2026-07-19
## Status: G1 COMPLETE

## G1 Gate Summary

| Task | Status | Receipt |
|------|--------|---------|
| G1.1 START_HERE.md | PASS | `START_HERE.md` |
| G1.2 Document status index | PASS | `G1_2_DOCUMENT_STATUS_INDEX.md` — ~200 docs classified |
| G1.3 Decision lock | PASS | `G1_3_DECISION_LOCK.md` — 6 decisions locked by Founder |
| G1.4 Architecture + data-ownership ADRs | PASS | `ADRS_G1_4.md` — ADR-001 through ADR-006 |

## Locked Decisions

| ADR | Decision | Choice |
|-----|----------|--------|
| ADR-001 | Product model | Global platform with tenant hierarchy |
| ADR-002 | Tenant hierarchy | Global → Country → Province → City → LocalNode → Brand/Place |
| ADR-003 | Database | Cloudflare D1 only |
| ADR-004 | Cloudflare account | Tranhatam@gmail.com |
| ADR-005 | Auth stack | Auth.js (NextAuth) only |
| ADR-006 | OMCODE boundary | Separate repo |

## Contradiction Resolution

| ID | Conflict | Status |
|----|----------|--------|
| C-01 | GO vs HOLD | RESOLVED — NO-GO |
| C-02 | Global-first vs local Brand Factory | RESOLVED — Global platform |
| C-03 | D1 vs PostgreSQL | RESOLVED — D1 only |
| C-04 | Auth stack fragmentation | RESOLVED — Auth.js only |
| C-05 | CI npm ci vs pnpm | PENDING — G2.2 |
| C-06 | OMCODE boundary | RESOLVED — Separate repo |

## Document Classification

| Status | Count |
|--------|-------|
| ACTIVE | 4 |
| REFERENCE | ~60 |
| SUPERSEDED | ~15 |
| ARCHIVED | ~120 |

**No two ACTIVE documents assign contradictory ownership or release state.**

## G1 Verdict
**PASS** — Governance lock established. Single entry point (START_HERE.md), document classification complete, 6 ADRs locked, contradictions resolved.

## Next Gate
**G2 — Reproducible Build and CI**
