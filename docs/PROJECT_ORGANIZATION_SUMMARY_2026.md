# PROJECT_ORGANIZATION_SUMMARY_2026.md

**Version**: 1.0
**Status**: FINAL PROJECT ORGANIZATION SUMMARY
**Date**: April 4, 2026
**Audience**: All team members

---

# 1. OMDALA ECOSYSTEM — NEW ORGANIZATION

After April 4, 2026, the OMDALA ecosystem is organized as:

```
omdala.com (root)
│
├── SHARED PLATFORM CORE (Team Platform)
│   ├── auth services
│   ├── billing services
│   ├── workspace services
│   ├── provider routing
│   ├── notifications
│   ├── analytics
│   └── shared docs
│
├── ai-omniverse/ (Team A)
│   ├── mobile/
│   │   ├── ios/
│   │   └── android/
│   ├── web/
│   ├── backend/
│   └── docs/
│
└── ai-om/ (Team B)
    ├── mobile/
    │   ├── ios/
    │   └── android/
    ├── web/
    ├── backend/
    └── docs/
```

---

# 2. PROJECT LOCATIONS

## Root Project: `/Users/tranhatam/Documents/New project/omdala.com/`

This is the monorepo containing both apps + shared core.

## Existing Folders

- `apps/` — OLD structure (being deprecated)
  - `web` → content moves to `ai-omniverse/web` + `ai-om/web`
  - `app` → logic moves to `ai-omniverse/mobile` + `ai-om/mobile`
  - `admin` → moves under each app's `backend/admin`

- `services/` — OLD structure (being deprecated)
  - `api` → content moves to `ai-omniverse/backend` + `ai-om/backend`
  - `auth`, `billing`, etc → move to shared platform

- `packages/` — STAYS (shared core)
  - `core`, `types`, `ui`, `seo` — all remain shared

- `ai.omdala.com/` — OLD project (being deprecated)
  - Existing docs kept for reference
  - Code migrated to new structure

## New Folders (Created April 4)

- `ai-omniverse/` — App 1 (Device + Environment)
  - `mobile/ios/` — iOS codebase
  - `mobile/android/` — Android codebase
  - `web/` — Web app
  - `backend/` — Backend services
  - `docs/` — App-specific documentation

- `ai-om/` — App 2 (AI Human Call + Learning)
  - `mobile/ios/` — iOS codebase
  - `mobile/android/` — Android codebase
  - `web/` — Web app
  - `backend/` — Backend services
  - `docs/` — App-specific documentation

---

# 3. DOCUMENTATION HIERARCHY

## Root Level: `/docs/`

**Core Planning Documents (Batch S1)**:
- ✅ `AI_OM_AND_AI_OMNIVERSE_SPLIT_MASTER_DEV_ADJUSTMENT_2026.md` — Main architecture decision
- ✅ `OMDALA_SHARED_PLATFORM_CORE_BOUNDARY_2026.md` — Shared services spec
- ✅ `DEV_TEAM_SPLIT_AND_RESPONSIBILITY_MATRIX_2026.md` — Team structure
- ✅ `SPLIT_ARCHITECTURE_BATCH_S1_COMPLETION_2026.md` — Batch S1 completion checklist
- ✅ `SPLIT_ARCHITECTURE_BATCH_S1_INDEX_2026.md` — Document index

**Legacy Docs** (keeping for reference):
- `AI_OM_AND_AI_OMNIVERSE_SPLIT_MASTER_DEV_ADJUSTMENT_2026.md` — Original master plan
- `DEVELOPMENT_STATUS_OMDALA_2026_04_04.md` — Dev progress snapshot
- `EMAIL_SYSTEM_STATUS_OMDALA.md` — Email layer status
- (20+ other existing docs)

## App Level: `/omniverse.omdala.com/docs/` and `/om-ai.omdala.com/docs/`

Each app will have its own documentation folder with:
- Product spec
- Technical architecture
- API documentation
- Deployment runbook
- Team handbook

---

# 4. TEAM ASSIGNMENTS (FINAL)

## Team A — AI Omniverse

**Lead**: [TBD]

**Responsibilities**:
- Device control app
- Room/space management
- Scene execution
- Mobile (iOS + Android)
- Web dashboard
- Backend services (devices, rooms, gateways, scenes)

**Size**: 6-8 engineers

**Key Files**:
- Read: `AI_OM_AND_AI_OMNIVERSE_SPLIT_MASTER_DEV_ADJUSTMENT_2026.md` (sections 2A, 5A)
- Read: `DEV_TEAM_SPLIT_AND_RESPONSIBILITY_MATRIX_2026.md` (section 2)

## Team B — AI Om

**Lead**: [TBD]

**Responsibilities**:
- Live call app
- Learning platform
- AI personas
- Mobile (iOS + Android)
- Web dashboard
- Backend services (live call, persona, memory, curriculum, family/school/business)

**Size**: 8-10 engineers

**Key Files**:
- Read: `AI_OM_AND_AI_OMNIVERSE_SPLIT_MASTER_DEV_ADJUSTMENT_2026.md` (sections 2B, 5B)
- Read: `DEV_TEAM_SPLIT_AND_RESPONSIBILITY_MATRIX_2026.md` (section 3)

## Team Platform — Shared Core

**Lead**: [TBD] (likely current CTO)

**Responsibilities**:
- Auth service
- Billing service
- Workspace service
- Provider routing
- Notifications
- Analytics
- Infrastructure

**Size**: 5-7 engineers

**Key Files**:
- Read: `OMDALA_SHARED_PLATFORM_CORE_BOUNDARY_2026.md`
- Read: `DEV_TEAM_SPLIT_AND_RESPONSIBILITY_MATRIX_2026.md` (section 4)

---

# 5. MIGRATION CHECKLIST

## Phase 1 — Documentation (Week 1)
- ✅ Create Batch S1 documents
- ✅ Create folder structure
- ⏳ Team leads assigned
- ⏳ All team members read documents

## Phase 2 — Code Migration (Week 2-3)
- ⏳ Move `apps/web` → `ai-omniverse/web` + `ai-om/web`
- ⏳ Move `apps/app` → `ai-omniverse/mobile` + `ai-om/mobile`
- ⏳ Move `services/api` → `ai-omniverse/backend` + `ai-om/backend`
- ⏳ Move `services/auth` → shared platform
- ⏳ Move `services/billing` → shared platform
- ⏳ Update CI/CD pipelines
- ⏳ Update monorepo configuration

## Phase 3 — Batch S2 (Week 2-3)
- ⏳ Write `AI_OMNIVERSE_MASTER_DEV_PLAN_2026.md`
- ⏳ Write `AI_OM_MASTER_DEV_PLAN_2026.md`
- ⏳ Write `OMDALA_SHARED_SERVICES_DETAILED_SPEC_2026.md`

## Phase 4 — Batch S3 (Week 3-4)
- ⏳ Write mobile architecture specs for both apps
- ⏳ Write backend domain specs for both apps

## Phase 5 — Development Starts (Week 5)
- ⏳ Codebase ready for dev work
- ⏳ CI/CD fully functional
- ⏳ Teams ready to code

---

# 6. KEY DATES

| Milestone | Date | What |
|---|---|---|
| Batch S1 Complete | 2026-04-04 ✅ | All planning docs done |
| Batch S1 Sign-off | 2026-04-05 | Stakeholders approve |
| Code Migration Start | 2026-04-06 | Begin moving code |
| Code Migration Done | 2026-04-14 | Structure ready |
| Batch S2 Complete | 2026-04-15 | Detailed specs ready |
| Development Starts | 2026-04-16 | Teams begin coding |
| MVP Target | 2026-06-01 | Both apps in beta |

---

# 7. GETTING STARTED — WHAT TO READ

### If you're Product/Leadership:
1. `AI_OM_AND_AI_OMNIVERSE_SPLIT_MASTER_DEV_ADJUSTMENT_2026.md` (full read)
2. `SPLIT_ARCHITECTURE_BATCH_S1_INDEX_2026.md` (quick reference)
3. Relevant team sections in `DEV_TEAM_SPLIT_AND_RESPONSIBILITY_MATRIX_2026.md`

### If you're an Engineer on Team A (Omniverse):
1. `AI_OM_AND_AI_OMNIVERSE_SPLIT_MASTER_DEV_ADJUSTMENT_2026.md` (sections 2A, 5A, 8A)
2. `DEV_TEAM_SPLIT_AND_RESPONSIBILITY_MATRIX_2026.md` (section 2)
3. `OMDALA_SHARED_PLATFORM_CORE_BOUNDARY_2026.md` (sections 1-5)

### If you're an Engineer on Team B (AI Om):
1. `AI_OM_AND_AI_OMNIVERSE_SPLIT_MASTER_DEV_ADJUSTMENT_2026.md` (sections 2B, 5B, 8B)
2. `DEV_TEAM_SPLIT_AND_RESPONSIBILITY_MATRIX_2026.md` (section 3)
3. `OMDALA_SHARED_PLATFORM_CORE_BOUNDARY_2026.md` (sections 1-5)

### If you're on Team Platform (Shared Core):
1. `OMDALA_SHARED_PLATFORM_CORE_BOUNDARY_2026.md` (full read)
2. `DEV_TEAM_SPLIT_AND_RESPONSIBILITY_MATRIX_2026.md` (section 4)
3. `AI_OM_AND_AI_OMNIVERSE_SPLIT_MASTER_DEV_ADJUSTMENT_2026.md` (sections 1-4, 6-7)

---

# 8. FAQ

**Q: Do I need to read all documents?**
A: No. Focus on your team's docs. Use the Index for quick reference.

**Q: What if I have questions about the split?**
A: See section 7. Ask your team lead first. For architecture questions, ask CTO.

**Q: When does code migration happen?**
A: Week of April 6. You'll get detailed instructions.

**Q: Will we lose the old code?**
A: No. We're moving, not deleting. Old `/apps` and `/services` will be archived.

**Q: How long until development starts?**
A: 2 weeks. Batch S1 sign-off (April 5) → Code migration (April 6-14) → Batch S2 (April 6-15) → Dev starts (April 16).

**Q: Can teams share code?**
A: YES, but only shared core (design tokens, auth SDK, analytics SDK). Domain logic stays separate.

**Q: What's the MVP deadline?**
A: Target: June 1, 2026 (8 weeks from April 4).

---

# 9. SUCCESS CRITERIA FOR BATCH S1

Batch S1 is complete when:

- ✅ All 5 documents are written
- ⏳ All stakeholders have signed off
- ⏳ Teams understand their domain & responsibilities
- ⏳ Product positioning is locked
- ⏳ Everyone is ready for Batch S2

**Current Status**: Documentation 100% complete. Awaiting stakeholder sign-off.

---

# 10. NEXT DOCUMENT AFTER THIS

Once this summary is distributed to the team, the next step is:

**Batch S2 — Product Spec Separation**

Expected completion: **April 15, 2026**

Files to create:
1. `AI_OMNIVERSE_MASTER_DEV_PLAN_2026.md`
2. `AI_OM_MASTER_DEV_PLAN_2026.md`
3. `OMDALA_SHARED_SERVICES_DETAILED_SPEC_2026.md`

---

# END OF FILE

**For questions, contact**:
- Product: [TBD]
- Engineering: [TBD]
- Project Manager: [TBD]
