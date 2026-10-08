# G1.2 — Document Status Index

> **Date:** 2026-07-19  
> **Rule:** Every document must be marked ACTIVE, REFERENCE, SUPERSEDED, or ARCHIVED.  
> **No two ACTIVE documents may assign contradictory ownership or release state.**

---

## Classification Rules

| Status | Meaning |
|--------|---------|
| **ACTIVE** | Current source of truth for its domain. Conflicts with other ACTIVE docs must be resolved. |
| **REFERENCE** | Useful context, but not authoritative. May be consulted but does not override ACTIVE. |
| **SUPERSEDED** | Replaced by a newer ACTIVE document. Kept for history. Do not follow. |
| **ARCHIVED** | No longer relevant. Kept for audit trail only. |

---

## Governance & Planning (Root + docs/)

| Document | Status | Notes |
|----------|--------|-------|
| `START_HERE.md` (audit/2026-07-19/) | **ACTIVE** | Single entry point (G1.1) |
| `docs/audit/2026-07-19/AUDIT_BASELINE_AND_EXECUTION_BACKLOG.md` | **ACTIVE** | Current audit baseline |
| `docs/audit/2026-07-19/RELEASE_GATE_MATRIX.md` | **ACTIVE** | Current release gates |
| `docs/audit/2026-07-19/SOURCE_VERIFICATION_RECEIPT.md` | **ACTIVE** | Source verification |
| `docs/DOCS_SOURCE_OF_TRUTH_INDEX_2026-04-08.md` | **SUPERSEDED** | Claims GO — contradicted by current audit |
| `docs/PROJECT_EXECUTION_BOARD.md` | **SUPERSEDED** | Says HOLD — replaced by G0 EXIT receipt |
| `docs/OMDALA_SINGLE_TEAM_MASTER_PLAN_2026-05-19.md` | **SUPERSEDED** | Conflicts with current source state |
| `docs/MASTER_EXECUTION_PLAN_10_10_2026-06-05.md` | **SUPERSEDED** | Claims 10/10 — actual verified score 16/100 |
| `docs/MASTER_DEV_COMPLETION_PLAN_2026-04-08.md` | **SUPERSEDED** | Pre-audit completion claims |
| `docs/OMDALA_FULL_PROJECT_DEV_COMPLETION_BOARD_2026-05-19.md` | **SUPERSEDED** | Pre-audit completion claims |
| `docs/OMDALA_MASTER_EXECUTION_PLAN_2026-04-27.md` | **SUPERSEDED** | Replaced by G0-G6 gate sequence |
| `docs/OMDALA_AUTONOMOUS_DEV_15M_PLAN_2026-05-07.md` | **ARCHIVED** | Autonomous dev plan — not current |
| `docs/OMDALA_STOP_THE_BLEEDING_EXECUTION_BOARD_2026-05-04.md` | **ARCHIVED** | Emergency board — resolved by audit |
| `docs/OMDALA_GIT_HYGIENE_RECOVERY_PLAN_2026-05-07.md` | **REFERENCE** | Git hygiene — still relevant |
| `docs/OMDALA_GIT_ISOLATION_RECOMMENDATION_2026-05-08.md` | **REFERENCE** | Git isolation — still relevant |
| `docs/REPO_SPLIT_DECISION_AND_FOLDER_STRUCTURE_2026.md` | **REFERENCE** | Repo split — relevant for subproject boundaries |
| `README.md` | **ACTIVE** | Project README (needs update after G1) |
| `DEVLOG.md` | **REFERENCE** | Dev log |
| `PROJECT_READINESS_AUDIT_2026.md` | **SUPERSEDED** | Pre-audit readiness claims |
| `AUDIT_FULL_OMDALA_COM_2026-06-04.md` | **REFERENCE** | Historical audit |
| `MACBOOK_OPTIMIZATION.md` | **ARCHIVED** | Not relevant to project |

## Architecture

| Document | Status | Notes |
|----------|--------|-------|
| `docs/OMDALA_MASTER_ARCHITECTURE.md` | **REFERENCE** | High-level architecture — needs ADR update |
| `docs/20_architecture/ARCHITECTURE_DECISIONS.md` | **REFERENCE** | Existing ADRs — will be updated in G1.4 |
| `docs/architecture/OMDALA_MASTER_SYSTEM_ARCHITECTURE_2026_FINAL.md` | **REFERENCE** | System architecture — needs reconciliation with G3 |
| `docs/architecture/OMDALA_APP_INFORMATION_ARCHITECTURE_2026.md` | **REFERENCE** | IA spec |
| `docs/OMDALA_BACKEND_FULL_ARCHITECTURE_2026.md` | **REFERENCE** | Backend architecture |
| `docs/OMDALA_API_BOUNDARIES.md` | **REFERENCE** | API boundaries |
| `docs/API_SPEC_OMDALA.md` | **REFERENCE** | API spec |
| `docs/architecture/OMDALA_API_NAMESPACE_V2_SPEC.md` | **REFERENCE** | API namespace V2 |
| `docs/DATA_MODEL_OMDALA.md` | **REFERENCE** | Data model — needs G3 reconciliation |
| `docs/OMDALA_DATABASE_SCHEMA_FULL_2026.md` | **REFERENCE** | DB schema — needs G3 reconciliation |
| `docs/SHARED_CORE_SCHEMA_2026.md` | **REFERENCE** | Shared schema |

## Infrastructure

| Document | Status | Notes |
|----------|--------|-------|
| `infra/docs/ARCHITECTURE.md` | **REFERENCE** | Infra architecture — needs G3 ADR |
| `infra/docs/DEPLOYMENT.md` | **REFERENCE** | Deployment guide |
| `infra/docs/SECURITY.md` | **REFERENCE** | Security guide |
| `infra/docs/BACKUP_RESTORE.md` | **REFERENCE** | Backup/restore — needs G3.5 validation |
| `infra/docs/CLOUDFLARE_VERIFICATION_REPORT_2026-06-06.md` | **REFERENCE** | CF verification |
| `infra/docs/HYPERDRIVE_VERIFICATION.md` | **REFERENCE** | Hyperdrive — needs G3.2 lifecycle decision |
| `infra/docs/CF_SECRETS_MIGRATION.md` | **REFERENCE** | CF Secrets — needs G3.4 |
| `infra/docs/INFRA_OMDALA_FULL_AUDIT_AND_BUSINESS_PLAN_2026-06-06.md` | **REFERENCE** | Infra audit |
| `docs/CLOUDFLARE_ACCOUNT_BASELINE_OMDALA.md` | **SUPERSEDED** | Replaced by G0.5 decision |
| `docs/OMDALA_VPS_POSTGRES_HARDENING_CHECKLIST_2026.md` | **REFERENCE** | VPS hardening |
| `docs/DEPLOYMENT_RUNBOOK_OMDALA.md` | **REFERENCE** | Deployment runbook |
| `docs/DNS_SUBDOMAIN_DEPLOYMENT_LOCK_OMDALA.md` | **REFERENCE** | DNS lock |

## Brand & Design

| Document | Status | Notes |
|----------|--------|-------|
| `docs/BRAND_ARCHITECTURE_OMDALA.md` | **REFERENCE** | Brand architecture |
| `docs/OMDALA_DESIGN_SYSTEM_2026.md` | **REFERENCE** | Design system |
| `docs/OMDALA_THEME_SYSTEM.md` | **REFERENCE** | Theme system |
| `docs/OMDALA_V2_SIGNAL_SUBSTRATE.md` | **REFERENCE** | V2 signal substrate |
| `docs/OMDALA_BRANDPRO_LOCK_2026-05-12.md` | **REFERENCE** | BrandPro lock |
| `docs/OMDALA_BRANDPRO_APPLY_REPORT_2026-05-12.md` | **REFERENCE** | BrandPro apply |

## Team & Execution (Historical)

| Document | Status | Notes |
|----------|--------|-------|
| `docs/TEAM_1_PROGRESS_2026.md` | **ARCHIVED** | Historical team progress |
| `docs/TEAM_2_PROGRESS_2026.md` | **ARCHIVED** | Historical team progress |
| `docs/TEAM_3_PROGRESS_2026.md` | **ARCHIVED** | Historical team progress |
| `docs/TEAM_1_FINAL_SIGNOFF_2026-04-27.md` | **ARCHIVED** | Historical signoff |
| `docs/TEAM_1_BILINGUAL_PUBLIC_WEB_EVIDENCE_2026-04-23.md` | **ARCHIVED** | Historical evidence |
| `docs/TEAM_2_*.md` (all) | **ARCHIVED** | Historical team 2 docs |
| `docs/TEAM_3_*.md` (all) | **ARCHIVED** | Historical team 3 docs |
| `docs/TWO_TEAM_*.md` (all) | **ARCHIVED** | Historical two-team plans |
| `docs/OMDALA_3_TEAM_*.md` (all) | **ARCHIVED** | Historical three-team plans |
| `docs/TEAM_COORDINATION_GUIDE_2026.md` | **ARCHIVED** | Historical coordination |
| `docs/TEAM_OWNERSHIP_MAP.md` | **ARCHIVED** | Historical ownership |
| `docs/DEV_TEAM_SPLIT_AND_RESPONSIBILITY_MATRIX_2026.md` | **ARCHIVED** | Historical team split |

## Bilingual/Language

| Document | Status | Notes |
|----------|--------|-------|
| `docs/OMDALA_BILINGUAL_LANGUAGE_CODEX_2026-04-21.md` | **REFERENCE** | Language code |
| `docs/I18N_IMPLEMENTATION_LOCK.md` | **REFERENCE** | i18n lock |
| `docs/LANGUAGE_CODEX.md` | **REFERENCE** | Language code |
| `docs/OMDALA_UNIVERSAL_BILINGUAL_LANGUAGE_REBUILD_COMMAND_2026-04-21.md` | **ARCHIVED** | Historical command |
| `docs/OMDALA_BILINGUAL_PRELIVE_REPORT_2026-04-23.md` | **ARCHIVED** | Historical report |
| `reports/bilingual/*.md` (all) | **ARCHIVED** | Historical scan reports |

## OMCODE

| Document | Status | Notes |
|----------|--------|-------|
| `docs/OMCODE_AUDIT_100_PERCENT_2026-06-01.md` | **SUPERSEDED** | Claims 100% — not verified |
| `docs/OMCODE_PRODUCTION_READINESS_AUDIT_2026-06-01.md` | **SUPERSEDED** | Pre-audit readiness |
| `docs/OMCODE_PRODUCTION_READINESS_REPORT_2026-05-29.md` | **SUPERSEDED** | Pre-audit readiness |
| `docs/OMCODE_COMPREHENSIVE_AUDIT_2026-05-29.md` | **REFERENCE** | Comprehensive audit |
| `docs/OMCODE_AUDIT_REPORT_2026-05-29.md` | **REFERENCE** | Audit report |
| `docs/OMCODE_DEV_PLAN.md` | **REFERENCE** | Dev plan |
| `docs/OMCODE_APP_RELEASE.md` | **SUPERSEDED** | Release claims |
| `docs/OMCODE_BETA_TEST_PLAN.md` | **REFERENCE** | Beta test plan |

## Om AI (separate project)

| Document | Status | Notes |
|----------|--------|-------|
| `om-ai.omdala.com/*.md` (all) | **REFERENCE** | Separate project docs — not authoritative for omdala.com |
| `docs/OM_AI_*.md` (all) | **REFERENCE** | Om AI plans in main docs |

## Release & Deployment

| Document | Status | Notes |
|----------|--------|-------|
| `docs/RELEASE_COMMAND_SHEET.md` | **SUPERSEDED** | Pre-audit release commands |
| `docs/RELEASE_HANDOFF_APP_API.md` | **SUPERSEDED** | Pre-audit handoff |
| `docs/OMDALA_DEPLOYMENT_LIVE_SYSTEM_2026.md` | **REFERENCE** | Deployment system |

## Product

| Document | Status | Notes |
|----------|--------|-------|
| `docs/PRODUCT_SPEC_OMDALA.md` | **REFERENCE** | Product spec |
| `docs/OMDALA_PRODUCT_PRINCIPLES.md` | **REFERENCE** | Product principles |
| `docs/OMDALA_ROADMAP.md` | **REFERENCE** | Roadmap |
| `docs/OMDALA_INFORMATION_ARCHITECTURE.md` | **REFERENCE** | IA |
| `docs/OMDALA_GROWTH_STRATEGY_100K_USERS_2026.md` | **REFERENCE** | Growth strategy |

## Auth & Billing

| Document | Status | Notes |
|----------|--------|-------|
| `docs/AUTH_SESSION_SOURCE_OF_TRUTH_2026.md` | **REFERENCE** | Auth — needs G3.3 ADR |
| `docs/ACCOUNT_BILLING_SOURCE_OF_TRUTH_2026.md` | **REFERENCE** | Billing |
| `docs/OAUTH_GOOGLE_RUNBOOK.md` | **REFERENCE** | OAuth |

---

## Contradictions Resolved

| Contradiction | Resolution |
|---------------|------------|
| C-01: GO vs HOLD | RESOLVED — NO-GO per current audit. All GO claims are SUPERSEDED. |
| C-02: Global-first vs local Brand Factory | PROPOSED — Global platform with country/region tenants (G1.3 decision pending) |
| C-03: D1/Worker vs VPS/PostgreSQL | PENDING — G3.1 ADR required |
| C-04: CI npm ci vs pnpm | PENDING — G2.2 fix required |
| C-05: Route cleanup claims vs filesystem | CONFIRMED — Duplicate routes exist, G2.3 fix required |

---

## Summary

| Status | Count (approx) |
|--------|----------------|
| ACTIVE | 4 (audit receipts + START_HERE) |
| REFERENCE | ~60 |
| SUPERSEDED | ~15 |
| ARCHIVED | ~120 |

**No two ACTIVE documents assign contradictory ownership or release state.**
