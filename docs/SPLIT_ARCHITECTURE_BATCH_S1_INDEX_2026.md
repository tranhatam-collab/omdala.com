# SPLIT_ARCHITECTURE_BATCH_S1_INDEX_2026.md

**Version**: 1.0
**Status**: BATCH S1 DOCUMENT INDEX
**Purpose**: Central navigation point for all Batch S1 files
**Date**: April 4, 2026

---

# Overview

**OMDALA** is splitting from 1 app into **2 independent products**:

1. **AI Omniverse** — Device + Environment + Reality Control
2. **Om AI** — AI Human Call + Learning + Communication

This document index helps you navigate all Batch S1 planning files.

---

# Batch S1 Files (Read in This Order)

## 1. Main Architecture Decision

**File**: [`OM_AI_AND_AI_OMNIVERSE_SPLIT_MASTER_DEV_ADJUSTMENT_2026.md`](./OM_AI_AND_AI_OMNIVERSE_SPLIT_MASTER_DEV_ADJUSTMENT_2026.md)

**Read this if**: You need to understand **why we're splitting** and **what each app does**

**Key sections**:
- Why split 2 apps (product reasons, technical reasons)
- AI Omniverse definition (scope, features, users)
- Om AI definition (scope, features, users)
- App roadmaps (4 phases each)
- Pricing strategy
- Hard rules for dev team
- Go/no-go checklist

**Owner**: Product / Architecture

**Audience**: Everyone (Product, Engineering, Leadership)

**Read time**: 20 min

---

## 2. Shared Platform Core Architecture

**File**: [`OMDALA_SHARED_PLATFORM_CORE_BOUNDARY_2026.md`](./OMDALA_SHARED_PLATFORM_CORE_BOUNDARY_2026.md)

**Read this if**: You need to understand **what's shared vs app-specific** in the backend

**Key sections**:
- 8 shared core services (Auth, Billing, Workspace, Provider, Notifications, Analytics, Account, etc)
- Data models for each shared service
- API contracts and endpoints
- How apps communicate via shared core
- API gateway pattern
- Deployment architecture
- Shared core roadmap

**Owner**: Engineering / Platform Lead

**Audience**: Backend engineers, platform team, team leads

**Read time**: 25 min

**Dependencies**: Read main architecture decision first

---

## 3. Team Structure & Responsibilities

**File**: [`DEV_TEAM_SPLIT_AND_RESPONSIBILITY_MATRIX_2026.md`](./DEV_TEAM_SPLIT_AND_RESPONSIBILITY_MATRIX_2026.md)

**Read this if**: You need to know **who owns what** and **how teams are organized**

**Key sections**:
- Team A structure (Omniverse: iOS, Android, Web, Backend leads)
- Team B structure (Om AI: iOS, Android, Web, Backend leads)
- Team Platform structure (Shared core: Auth, Billing, Workspace, Infra, etc)
- Responsibilities matrix (who owns which service)
- Decision authority matrix (who decides what)
- Communication cadence
- Onboarding checklist
- Success metrics per team
- Escalation path

**Owner**: Engineering Manager / CTO

**Audience**: Engineering team, team leads, HR

**Read time**: 20 min

**Dependencies**: Read main architecture decision first

---

## 4. Batch S1 Completion Checklist

**File**: [`SPLIT_ARCHITECTURE_BATCH_S1_COMPLETION_2026.md`](./SPLIT_ARCHITECTURE_BATCH_S1_COMPLETION_2026.md)

**Read this if**: You're **completing Batch S1** and need to **sign off** before moving to Batch S2

**Key sections**:
- What is Batch S1?
- Batch S1 file checklist (done vs pending)
- Batch S1 deliverables
- Remaining files to create (2 more)
- Implementation checklist
- Sign-off template
- Transition plan to Batch S2

**Owner**: Project Manager / CTO

**Audience**: Leadership, engineering team

**Read time**: 15 min

**Dependencies**: Read all other Batch S1 files first

---

# Quick Reference Tables

## App Definitions (2-min Summary)

| Aspect | AI Omniverse | Om AI |
|---|---|---|
| **Focus** | Physical reality control | AI human interaction |
| **Core Feature** | Device + Room + Scene control | Live AI call + learning |
| **Users** | Families, offices, businesses (hardware owners) | Students, learners, businesses (communication users) |
| **Key UX** | Dashboard, voice commands, automation | Live call, persona browsing, lessons |
| **Pricing** | Free/Home Pro/Business Space | Free/Pro/Family/School/Business |
| **KPI** | DAU control, device success rate | Call sessions, retention, conversion |

## Team Assignments (2-min Summary)

| Team | Owns |
|---|---|
| **Team A (Omniverse)** | Omniverse mobile, web, backend domain |
| **Team B (Om AI)** | Om AI mobile, web, backend domain |
| **Team Platform** | Auth, Billing, Workspace, Provider routing, Infra |

## Shared vs App-Specific (2-min Summary)

| Layer | Shared? | Who Maintains? |
|---|---|---|
| Auth & Sessions | ✅ Shared | Team Platform |
| Billing | ✅ Shared | Team Platform |
| Workspace Identity | ✅ Shared | Team Platform |
| Provider Routing | ✅ Shared | Team Platform |
| Notifications | ✅ Shared | Team Platform |
| Analytics | ✅ Shared | Team Platform |
| Device/Room/Scene (Omniverse) | ❌ Domain-specific | Team A |
| Live Call/Persona/Lesson (Om AI) | ❌ Domain-specific | Team B |

---

# Batch S1 Workflow

```
┌─ Start: April 4, 2026
│
├─ Read: OM_AI_AND_AI_OMNIVERSE_SPLIT_MASTER_DEV_ADJUSTMENT_2026.md
├─ Read: OMDALA_SHARED_PLATFORM_CORE_BOUNDARY_2026.md
├─ Read: DEV_TEAM_SPLIT_AND_RESPONSIBILITY_MATRIX_2026.md
│
├─ Complete: Product Checkpoint
├─ Complete: Engineering Checkpoint
├─ Complete: Leadership Checkpoint
│
├─ Sign-off: All stakeholders
│
├─ Document: SPLIT_ARCHITECTURE_BATCH_S1_COMPLETION_2026.md
│
└─ Ready for Batch S2: Product Spec Separation (April 15)
```

---

# Key Decisions Locked in Batch S1

1. ✅ 2 apps (AI Omniverse + Om AI) — **NOT 1 app**
2. ✅ Shared core for Auth/Billing/Workspace (5-7 services)
3. ✅ Domain-specific backends for each app
4. ✅ Team structure (Team A, Team B, Team Platform)
5. ✅ Roadmap per app (4 phases each)
6. ✅ Pricing strategy (separate pricing per app)
7. ✅ Go-live target: **2026-06-01** (8-10 weeks from now)

---

# Common Questions

### Q: Should we keep 1 monorepo or split into 2 repos?
**A**: Answered in `REPO_SPLIT_DECISION_AND_FOLDER_STRUCTURE_2026.md`.

### Q: Can Team A and Team B share code?
**A**: YES, but only at shared layer (design tokens, auth SDK, analytics SDK). Domain logic must stay separate.

### Q: When do we integrate CIOS?
**A**: Phase A3 (Om AI → CIOS bridge). Omniverse integration is Phase O4.

### Q: What about pricing? Can users buy both apps together?
**A**: No separate bundle yet. Each app has independent pricing. Bundle considered in later phases.

### Q: Who decides if a feature goes into Omniverse vs Om AI?
**A**: Product lead, with input from team leads. Use the hard rules in main file as guide.

### Q: What if a team needs to borrow engineer from other team?
**A**: Talk to Engineering Manager. Cross-team lending OK for short sprints, but ownership must stay clear.

---

# Important Dates

| Milestone | Date | Deliverable |
|---|---|---|
| Batch S1 Sign-off | 2026-04-05 | All 4 files + stakeholder approval |
| Batch S2 Start | 2026-04-06 | Detailed product specs |
| Batch S2 Complete | 2026-04-15 | Product & architecture locked |
| MVP Development Starts | 2026-04-16 | Coding begins |
| MVP Release (Target) | 2026-06-01 | Both apps in beta |

---

# Document Status

| File | Status | Author | Last Updated |
|---|---|---|---|
| OM_AI_AND_AI_OMNIVERSE_SPLIT_MASTER_DEV_ADJUSTMENT_2026.md | ✅ Complete | Product/Arch | 2026-04-04 |
| OMDALA_SHARED_PLATFORM_CORE_BOUNDARY_2026.md | ✅ Complete | Engineering | 2026-04-04 |
| DEV_TEAM_SPLIT_AND_RESPONSIBILITY_MATRIX_2026.md | ✅ Complete | CTO/HR | 2026-04-04 |
| SPLIT_ARCHITECTURE_BATCH_S1_COMPLETION_2026.md | ✅ Complete | PM | 2026-04-04 |
| SPLIT_ARCHITECTURE_BATCH_S1_INDEX_2026.md | ✅ Complete | PM | 2026-04-04 |

---

# How to Use This Index

1. **New to split architecture?** → Read main architecture file first
2. **Engineer joining Team A?** → Read main file + team responsibilities file
3. **Completing sign-off?** → Read completion checklist file
4. **Need decision reference?** → Use quick reference tables in this index
5. **Need file list for presentation?** → Use document status table

---

# Next Steps After Batch S1

Once Batch S1 is complete and signed off:

1. **Batch S2 (Product Spec Separation)**
   - File: `AI_OMNIVERSE_MASTER_DEV_PLAN_2026.md`
   - File: `OM_AI_MASTER_DEV_PLAN_2026.md`
   - File: `OMDALA_SHARED_SERVICES_DETAILED_SPEC_2026.md`

2. **Batch S3 (Mobile & Backend Architecture)**
   - File: `AI_OMNIVERSE_IOS_ANDROID_ARCHITECTURE_PLAN.md`
   - File: `OM_AI_IOS_ANDROID_ARCHITECTURE_PLAN.md`
   - File: `AI_OMNIVERSE_BACKEND_DOMAIN_SPEC.md`
   - File: `OM_AI_BACKEND_DOMAIN_SPEC.md`

3. **Batch S4 (Release & Growth Planning)**
   - File: `AI_OMNIVERSE_RELEASE_PLAN_V1.md`
   - File: `OM_AI_RELEASE_PLAN_V1.md`
   - File: `OMDALA_GROWTH_AND_MONETIZATION_PLAN_2026.md`

---

# Support & Questions

- **Architecture questions?** → Ask CTO or read main architecture file
- **Team assignments questions?** → Ask Engineering Manager
- **Product direction questions?** → Ask Product Lead
- **Timeline questions?** → Ask Project Manager

---

# END OF FILE
