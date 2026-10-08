# AI_OM_REPO_FULL_STRUCTURE_2026.md

Version: 2.0  
Status: Locked repo structure and responsibility map  
Canonical product name: Om AI  
Legacy filename namespace: `AI_OM_*` retained for continuity  
Scope: Monorepo tree + ownership + implementation order  
Date: April 9, 2026

---

# 0. Boundary Normalization - April 9, 2026

This file is normalized to the current Om AI boundary.

- `Om AI` is not `OmCode`
- `Om AI` is not `Omniverse`
- repository structure must optimize for Om AI Live and its supporting product systems
- any old emphasis on devices, scenes, proofs, or gateway-heavy physical execution is now `legacy-transition` or `bridge-only`

---

# 1. Purpose

This file defines the repo structure Om AI should follow so every team can build without inventing architecture on the fly.

Main goals:

- keep iOS, Android, web, backend, and support layers aligned
- keep Om AI product logic centered on live interaction
- make ownership clear
- isolate any future bridge-only integration work from the core Om AI product path

---

# 2. Repo Strategy

The workspace remains a monorepo.

Why:

- shared contracts
- shared product docs
- shared API clients
- aligned release planning
- easier cross-team execution

Top-level principle:

- `backend/` is source of truth for Om AI APIs, sessions, usage, memory, moderation, provider routing, and recap-related contracts
- `web/` is dashboard, review, admin, memory, lesson, and subscription surface
- `ios/` is premium native Om AI call surface
- `android/` is native Om AI call and companion surface
- `gateway/` is not a primary product pillar; it is bridge-only for approved future integrations
- root `*.md` files remain architecture, planning, release, and ownership documents

---

# 3. Current High-Level Repo

```text
om-ai.omdala.com/
├── android/
├── backend/
├── gateway/
├── ios/
├── scripts/
├── web/
├── README.md
├── README_INDEX.md
├── AI_OM_MASTER_SPEC_2026.md
├── AI_OM_DEV_MASTER_EXECUTION_PLAN_2026.md
├── AI_OM_FULL_DEV_EXECUTION_PLAN_IOS_ANDROID_2026.md
└── many supporting spec files
```

Current implementation shape:

- `backend/` has runtime skeleton and Om AI-facing route scaffolding
- `web/` has dashboard shell and typed API usage patterns
- `ios/` has native structure scaffolding
- `android/` is still documentation-first and should be scaffolded against the locked module tree
- `gateway/` exists, but must be treated as optional bridge-only infrastructure for Om AI

---

# 4. Target Top-Level Tree

```text
om-ai.omdala.com/
├── android/
├── backend/
├── gateway/
├── ios/
├── scripts/
├── web/
├── README.md
├── README_INDEX.md
├── AI_OM_MASTER_SPEC_2026.md
├── AI_OM_SHARED_PLATFORM_DEPENDENCY_STATUS_2026.md
├── AI_OM_TEAM_BOUNDARY_AND_DEPENDENCY_MATRIX_2026.md
├── AI_OM_SHARED_RESOURCE_REUSE_PLAN_2026.md
├── AI_OM_PHASED_INTEGRATION_BACKLOG_2026.md
└── supporting product and execution specs
```

Recommended ownership:

- Team Mobile owns `ios/` and `android/`
- Team Web owns `web/`
- Team Backend owns `backend/`
- Team Platform owns deployment and shared infrastructure concerns
- Product and Architecture own root-level canonical docs

`gateway/` belongs to bridge-only integration work unless specifically approved for Om AI scope.

---

# 5. Root-Level Document Rules

Keep at root:

- master specs
- execution plans
- API contracts
- persona, memory, metering, pricing, and router specs
- dependency and boundary docs
- release and onboarding docs

Do not bury source-of-truth planning under app folders.

Reason:

- every team reads the same canonical documents
- cross-team handoff remains fast
- product boundary stays visible

---

# 6. Backend Tree

Recommended backend shape:

```text
backend/
├── src/
│   ├── app.ts
│   ├── server.ts
│   ├── routes/
│   │   ├── health.ts
│   │   ├── live/
│   │   │   ├── personas.ts
│   │   │   ├── sessions.ts
│   │   │   ├── realtime.ts
│   │   │   ├── memory.ts
│   │   │   ├── usage.ts
│   │   │   ├── plans.ts
│   │   │   ├── moderation.ts
│   │   │   ├── avatar.ts
│   │   │   └── provider.ts
│   ├── services/
│   │   ├── persona/
│   │   ├── session/
│   │   ├── realtime/
│   │   ├── provider-router/
│   │   ├── usage-metering/
│   │   ├── billing/
│   │   ├── memory/
│   │   ├── curriculum/
│   │   ├── moderation/
│   │   └── recap/
│   ├── schemas/
│   ├── lib/
│   └── plugins/
├── test/
└── package.json
```

Rules:

- Om AI live routes are primary
- shared account or billing dependencies are consumed through contracts, not duplicated ad hoc
- old reality routes, if any still exist, are transitional only and must not define the repo direction

---

# 7. Web Tree

Recommended web shape:

```text
web/
├── src/
│   ├── app/
│   │   ├── home/
│   │   ├── personas/
│   │   ├── lessons/
│   │   ├── activity/
│   │   ├── memory/
│   │   ├── family/
│   │   ├── subscription/
│   │   └── admin/
│   ├── components/
│   ├── api/
│   ├── hooks/
│   ├── state/
│   └── styles/
└── package.json
```

Web is primarily:

- dashboard
- memory and recap review
- lesson and admin surface
- family or org control surface

It is not the deepest premium call surface.

---

# 8. iOS Tree

Recommended iOS shape:

```text
ios/
├── OmAIApp/
│   ├── App/
│   ├── Features/
│   │   ├── Home/
│   │   ├── Calls/
│   │   ├── Personas/
│   │   ├── Lessons/
│   │   ├── Activity/
│   │   ├── Memory/
│   │   ├── Family/
│   │   └── Settings/
│   ├── Services/
│   │   ├── Auth/
│   │   ├── LiveSession/
│   │   ├── Realtime/
│   │   ├── Audio/
│   │   ├── Avatar/
│   │   ├── UsageBilling/
│   │   └── Memory/
│   ├── Intents/
│   └── Shared/
└── project files
```

Rules:

- live call path is first-class
- lessons, recap, and family are first-class
- bridge-only work must not dominate native structure

---

# 9. Android Tree

Recommended Android shape:

```text
android/
├── app/
│   └── src/main/java/.../appshell
├── feature-home/
├── feature-calls/
├── feature-personas/
├── feature-lessons/
├── feature-activity/
├── feature-memory/
├── feature-family/
├── feature-settings/
├── feature-subscription/
├── core-ui/
├── core-design/
├── core-model/
├── core-network/
├── core-auth/
├── core-realtime/
├── core-audio/
├── core-avatar/
├── core-analytics/
├── core-persistence/
└── core-bridge/
```

Rules:

- Android mirrors Om AI live-product priorities
- `core-bridge` exists only for approved future integration work
- no first-class `rooms`, `scenes`, or `device-control` modules in Om AI Android

---

# 10. Gateway Tree

Recommended gateway stance:

```text
gateway/
├── src/
│   ├── server.ts
│   ├── adapters/
│   ├── bridge/
│   └── plugins/
└── package.json
```

Gateway is not a required primary Om AI runtime pillar.

It may be used for:

- future bridge adapters
- approved local integration experiments
- transitional compatibility layers

It must not force Om AI product planning back into a device-control-first architecture.

---

# 11. Shared Platform Dependencies

Om AI may align with shared platform for:

- account/profile
- account/preferences
- billing/subscriptions
- billing/usage
- common naming and envelope patterns

Om AI must keep ownership of:

- personas
- live sessions
- provider routing
- metering behavior
- memory behavior
- recap behavior
- family, school, and business semantics

---

# 12. Implementation Order

Recommended build order:

1. root contract and boundary docs
2. backend live API and metering path
3. iOS and Android call-first skeletons
4. web dashboard and review surfaces
5. shared dependency wiring
6. bridge-only integrations later

This order protects MVP velocity.

---

# 13. Hard Rules

- do not let bridge infrastructure redefine Om AI scope
- do not restore old reality-first directory assumptions into mobile apps
- do not duplicate shared account or billing contracts carelessly
- do not let legacy route names decide current product architecture

---

# 14. Final Lock

The canonical Om AI repo structure is now:

- live-product-first
- mobile native for call quality
- web for control and review
- backend as source of truth
- gateway as bridge-only
- legacy reality scope treated as non-primary
