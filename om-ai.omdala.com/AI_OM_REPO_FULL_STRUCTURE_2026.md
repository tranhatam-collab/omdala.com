# AI_OM_REPO_FULL_STRUCTURE_2026.md

Version: 1.0  
Status: Locked repo structure and responsibility map  
Scope: Monorepo tree + file ownership + implementation order  
Products: AI Om Core + AI Om Live  
Master brand: OMDALA  
Date: April 4, 2026

---

# 1. Purpose

This file defines the full repo structure that DEV can follow immediately without inventing architecture while building.

It serves 4 goals:
- keep iOS, Android, Web, Backend, and Gateway aligned
- separate `AI Om Core` from `AI Om Live` cleanly
- make ownership clear by directory and module
- reduce architecture drift during parallel implementation

---

# 2. Repo Strategy

The repo should remain a monorepo.

Why:
- shared contracts
- shared product docs
- shared naming and policy layers
- easier cross-platform handoff
- easier aligned release planning

Top-level principle:
- `backend/` is source of truth for APIs, policy, metering, memory, and routing
- `web/` is orchestration, admin, memory, lesson, reporting, and control surface
- `ios/` is premium native call surface for iPhone and iPad
- `android/` is native Android call surface and companion admin surface
- `gateway/` is local runtime and device/integration bridge
- root `*.md` files remain architecture, product, release, and governance specs

---

# 3. Current High-Level Repo

Current important directories already present:

```text
ai.omdala.com/
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

Current implementation status:
- `backend/` already has Fastify runtime skeleton and core reality routes
- `web/` already has Vite React shell and typed API hooks
- `gateway/` already has plugin-based runtime skeleton
- `ios/` already has native structure scaffold
- `android/` currently holds docs and should be scaffolded next

---

# 4. Target Top-Level Tree

```text
ai.omdala.com/
├── android/
├── backend/
├── gateway/
├── ios/
├── scripts/
├── web/
├── docs-or-root-specs/*.md
├── Makefile
├── docker-compose.yml
├── README.md
└── README_INDEX.md
```

Recommended ownership:
- Team Mobile owns `ios/` and `android/`
- Team Web owns `web/`
- Team Backend owns `backend/`
- Team Platform / Integration owns `gateway/`, deployment, and provider adapter infra
- Product / Architecture owns root-level master specs

---

# 5. Root-Level Files

Root-level files should stay documentation-first and execution-first.

## 5.1 Keep at root

- master specs
- execution plans
- API contracts
- pricing / persona / router / memory / metering specs
- launch / release / security checklists
- onboarding docs
- handoff docs

## 5.2 Do not move into app folders

Do not bury core source-of-truth specs inside `ios/`, `android/`, or `web/`.

Reason:
- all teams need the same source docs
- cross-team execution should start from root

---

# 6. Backend Structure

## 6.1 Current backend tree

```text
backend/
├── data/
├── migrations/
├── src/
│   ├── app.ts
│   ├── auth.ts
│   ├── bootstrap.ts
│   ├── e2e.ts
│   ├── index.ts
│   ├── persistence.ts
│   ├── persistence/
│   ├── policyEngine.ts
│   ├── proofStore.ts
│   ├── response.ts
│   ├── routes.ts
│   ├── routes/
│   ├── schemas.ts
│   ├── server.ts
│   ├── types.ts
│   └── utils.ts
├── package.json
└── tsconfig.json
```

## 6.2 Target backend tree

```text
backend/
├── data/
├── migrations/
├── src/
│   ├── index.ts
│   ├── server.ts
│   ├── app.ts
│   ├── response.ts
│   ├── auth.ts
│   ├── schemas/
│   │   ├── common.ts
│   │   ├── live.ts
│   │   ├── reality.ts
│   │   └── billing.ts
│   ├── services/
│   │   ├── auth/
│   │   ├── personas/
│   │   ├── sessions/
│   │   ├── realtime/
│   │   ├── memory/
│   │   ├── curriculum/
│   │   ├── usage/
│   │   ├── billing/
│   │   ├── moderation/
│   │   ├── analytics/
│   │   └── providers/
│   ├── routes/
│   │   ├── health.ts
│   │   ├── devices.ts
│   │   ├── scenes.ts
│   │   ├── runs.ts
│   │   ├── transitions.ts
│   │   ├── memory.ts
│   │   ├── proofs.ts
│   │   ├── approvals.ts
│   │   └── live/
│   │       ├── auth.ts
│   │       ├── workspaces.ts
│   │       ├── personas.ts
│   │       ├── sessions.ts
│   │       ├── realtime.ts
│   │       ├── usage.ts
│   │       ├── plans.ts
│   │       ├── memory.ts
│   │       ├── curriculum.ts
│   │       ├── moderation.ts
│   │       ├── avatar.ts
│   │       ├── family.ts
│   │       ├── school.ts
│   │       └── business.ts
│   ├── persistence/
│   │   ├── sqliteAdapter.ts
│   │   ├── postgresAdapter.ts
│   │   └── repositories/
│   ├── integrations/
│   │   ├── openai/
│   │   ├── tavus/
│   │   ├── heygen/
│   │   ├── cios/
│   │   └── byo/
│   └── tests/
├── package.json
└── tsconfig.json
```

## 6.3 Backend responsibility map

- `src/routes/live/`: API surface only
- `src/services/`: business logic
- `src/integrations/`: vendor and external adapters
- `src/persistence/repositories/`: DB access only
- `src/schemas/`: typed request/response and validation shape

Hard rule:
- provider logic must not live directly inside route files

---

# 7. Web Structure

## 7.1 Current web tree

```text
web/
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── styles.css
│   ├── api/
│   ├── components/ui/
│   ├── config/
│   ├── hooks/
│   ├── state/
│   └── types/
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 7.2 Target web tree

```text
web/
├── src/
│   ├── app/
│   │   ├── router.tsx
│   │   ├── providers.tsx
│   │   └── layout/
│   ├── pages/
│   │   ├── dashboard/
│   │   ├── personas/
│   │   ├── lessons/
│   │   ├── sessions/
│   │   ├── memory/
│   │   ├── family/
│   │   ├── school/
│   │   ├── business/
│   │   ├── billing/
│   │   └── settings/
│   ├── api/
│   │   ├── client.ts
│   │   ├── auth.ts
│   │   ├── live.ts
│   │   ├── reality.ts
│   │   └── contracts.ts
│   ├── features/
│   │   ├── personas/
│   │   ├── sessions/
│   │   ├── lessons/
│   │   ├── memory/
│   │   ├── usage/
│   │   ├── plans/
│   │   └── admin/
│   ├── components/
│   │   ├── ui/
│   │   ├── live/
│   │   ├── dashboard/
│   │   └── forms/
│   ├── hooks/
│   ├── state/
│   ├── config/
│   ├── styles/
│   └── types/
├── package.json
└── vite.config.ts
```

## 7.3 Web responsibility map

- `pages/`: route-level composition
- `features/`: domain UI and state logic
- `api/`: backend communication only
- `components/ui/`: design primitives only
- `components/live/`: session cards, recap cards, persona tiles, usage panels

---

# 8. iOS Structure

## 8.1 Current iOS tree

```text
ios/
├── AIOmApp.swift
├── ContentView.swift
├── README.md
└── AIOmApp/
    ├── AI_OM_APP.md
    ├── AppShell/
    ├── Approval/
    ├── Core/
    │   ├── Models/
    │   ├── Network/
    │   └── Store/
    ├── Features/
    │   ├── Activity/
    │   ├── Home/
    │   ├── Memory/
    │   ├── Rooms/
    │   ├── Scenes/
    │   ├── Settings/
    │   └── Voice/
    ├── PlannerClient/
    ├── ProofClient/
    ├── RealityMap/
    ├── Rooms/
    ├── Scenes/
    ├── Settings/
    └── Voice/
```

## 8.2 Target iOS tree

```text
ios/
├── AIOmApp.swift
├── ContentView.swift
├── README.md
└── AIOmApp/
    ├── AppShell/
    ├── Core/
    │   ├── Models/
    │   ├── Networking/
    │   ├── State/
    │   ├── Audio/
    │   ├── Realtime/
    │   └── Billing/
    ├── Features/
    │   ├── Home/
    │   ├── Personas/
    │   ├── LiveCall/
    │   ├── Lessons/
    │   ├── Memory/
    │   ├── Family/
    │   ├── Subscription/
    │   ├── Settings/
    │   └── Reality/
    ├── Integrations/
    │   ├── CallKit/
    │   ├── Speech/
    │   ├── AppIntents/
    │   └── WebRTC/
    └── SharedUI/
```

## 8.3 iOS responsibility map

- `Features/LiveCall/`: active call UI and state machine
- `Core/Audio/`: AVAudioSession and routing
- `Core/Realtime/`: WebRTC session client and interrupt handling
- `Integrations/CallKit/`: call surface bridge
- `Features/Family/`: parent controls and child-safe policy UI

---

# 9. Android Structure

## 9.1 Current Android tree

```text
android/
└── README.md
```

## 9.2 Target Android tree

```text
android/
├── README.md
├── settings.gradle.kts
├── build.gradle.kts
├── gradle.properties
├── app/
│   ├── build.gradle.kts
│   └── src/main/
│       ├── AndroidManifest.xml
│       ├── java/com/omdala/aiom/
│       │   ├── App.kt
│       │   ├── MainActivity.kt
│       │   ├── core/
│       │   │   ├── model/
│       │   │   ├── network/
│       │   │   ├── state/
│       │   │   ├── audio/
│       │   │   ├── realtime/
│       │   │   └── billing/
│       │   ├── features/
│       │   │   ├── home/
│       │   │   ├── personas/
│       │   │   ├── livecall/
│       │   │   ├── lessons/
│       │   │   ├── memory/
│       │   │   ├── family/
│       │   │   ├── subscription/
│       │   │   └── settings/
│       │   ├── integrations/
│       │   │   ├── telecom/
│       │   │   ├── speech/
│       │   │   └── webrtc/
│       │   └── ui/
│       └── res/
└── docs/
```

## 9.3 Android responsibility map

- `core/audio/`: microphone, speaker, Bluetooth, focus management
- `integrations/telecom/`: ConnectionService, notifications, ongoing-call state
- `core/realtime/`: WebRTC and session client
- `features/livecall/`: compose screens and call state
- `features/family/`: parent control UI and child profile views

Hard rule:
- Android must not be treated as secondary spec-wise; only rollout may lag behind iOS

---

# 10. Gateway Structure

## 10.1 Current gateway tree

```text
gateway/
├── src/
│   ├── dispatcher.ts
│   ├── index.ts
│   ├── plugin.ts
│   ├── registry.ts
│   └── plugins/
│       ├── blePlugin.ts
│       ├── localIpPlugin.ts
│       └── serialPlugin.ts
├── package.json
└── tsconfig.json
```

## 10.2 Target gateway tree

```text
gateway/
├── src/
│   ├── index.ts
│   ├── dispatcher.ts
│   ├── registry.ts
│   ├── plugin.ts
│   ├── plugins/
│   │   ├── blePlugin.ts
│   │   ├── localIpPlugin.ts
│   │   ├── serialPlugin.ts
│   │   ├── dashboardPlugin.ts
│   │   ├── speechDevicePlugin.ts
│   │   └── futureConnectorPlugin.ts
│   ├── adapters/
│   └── runtime/
├── package.json
└── tsconfig.json
```

## 10.3 Gateway responsibility map

- local discovery and control for reality layer
- optional local device bridge for audio or room surfaces later
- safe separation from direct business logic

---

# 11. Scripts Structure

Recommended `scripts/` usage:

```text
scripts/
├── bootstrap-dev.sh
├── smoke-test.sh
├── generate-release-notes.sh
├── scaffold-live-routes.sh
├── scaffold-android-app.sh
└── verify-handoff-links.sh
```

Rules:
- scripts should automate repo setup, smoke tests, scaffolding, and verification
- scripts should not become hidden business logic containers

---

# 12. Docs and Specs Map

Recommended doc categories at root:

1. Strategy docs  
Examples: master spec, full execution plans, roadmap

2. Build contracts  
Examples: API contract, provider router, persona schema, memory model, metering, pricing

3. Surface specs  
Examples: iOS structure, Android structure, web dashboard, realtime runtime

4. Governance docs  
Examples: release, security, retention, permissions, launch checklist

5. Handoff docs  
Examples: README index, handoff index, onboarding quickstart, final handoff summary

---

# 13. File Naming Rules

Use these conventions:
- `AI_OM_*` for shared platform docs and contracts
- keep legacy filenames where already referenced widely
- use suffixes intentionally:
  - `_SPEC` for design and behavioral requirements
  - `_PLAN` for execution and sequencing
  - `_CONTRACT` for interfaces and schemas
  - `_MODEL` for domain data structure
  - `_CHECKLIST` for release or operational verification

Avoid:
- vague filenames like `notes.md`
- duplicate docs with overlapping but unclear authority

---

# 14. Ownership by Team

## 14.1 Team Mobile

Owns:
- `ios/`
- `android/`
- mobile session UI
- audio routing
- native platform integrations

## 14.2 Team Web

Owns:
- `web/`
- dashboard UI
- admin and reporting UI
- memory and lesson control surfaces

## 14.3 Team Backend

Owns:
- `backend/src/routes/live/`
- `backend/src/services/`
- `backend/src/persistence/repositories/`
- entitlement, memory, metering, moderation, provider decisions

## 14.4 Team AI / Integrations

Owns:
- `backend/src/integrations/`
- avatar adapters
- provider health and routing integrations
- future CIOS bridge adapters

## 14.5 Team Platform / Infra

Owns:
- deployment and runtime health
- logs and monitoring
- `gateway/` runtime stability
- CI/CD, release hygiene, and secret handling

---

# 15. Recommended Implementation Order

## Phase A - Lock contracts first

1. `AI_OM_LIVE_API_CONTRACT_V1.md`
2. `AI_OM_PROVIDER_ROUTER_ARCHITECTURE_2026.md`
3. `AI_OM_PERSONA_SCHEMA_V1.md`
4. `AI_OM_MEMORY_MODEL_V1.md`
5. `AI_OM_USAGE_METERING_AND_FREE_30_MIN_RULES.md`
6. `AI_OM_PRICING_AND_PLAN_LOGIC_2026.md`

## Phase B - Scaffold runtime folders

1. `backend/src/routes/live/`
2. `backend/src/services/*`
3. `android/app/src/main/...`
4. `ios/AIOmApp/Features/LiveCall/`
5. `web/src/pages/*` and `web/src/features/*`

## Phase C - Build MVP path

1. sessions
2. realtime bootstrap
3. audio-only call
4. usage metering
5. recap
6. upgrade prompts

---

# 16. Hard Rules for DEV

1. Do not let route files become business-logic dumps.
2. Do not mix provider adapters with plan logic in one file.
3. Do not keep Android as docs-only after mobile scaffolding starts.
4. Do not store product-critical logic in frontend-only state.
5. Do not split one domain across random directories without clear ownership.
6. Do not create duplicate source-of-truth docs with conflicting authority.

---

# 17. Final Lock

This repo should be treated as one coordinated monorepo with five execution surfaces:
- backend truth layer
- web control layer
- iOS premium native layer
- Android native expansion layer
- gateway integration layer

The structure above is the build map DEV should follow before broad feature implementation begins.
