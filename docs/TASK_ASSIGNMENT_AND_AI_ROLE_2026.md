# TASK_ASSIGNMENT_AND_AI_ROLE_2026.md

**Phiên bản**: 1.0
**Trạng thái**: PHÂN CHIA NHIỆM VỤ CHI TIẾT + VAI TRÒ CLAUDE AI
**Ngày**: April 5, 2026
**Kiểm tra code thực tế**: ✅ Hoàn thành

---

# 0. PHÁT HIỆN QUAN TRỌNG TỪ KIỂM TRA

## Cấu trúc kép (cần quyết định)

Hiện tại tồn tại **2 cấu trúc song song**:

```
CẤU TRÚC CŨ (có code thật):
├── apps/web          → Marketing site (Next.js, port 3000) ✅ PRODUCTION
├── apps/app          → Dashboard (Next.js, port 3001) ✅ PRODUCTION
├── apps/admin        → Admin panel (Next.js, port 3002) ✅ PRODUCTION
├── apps/docs         → Docs (Next.js, port 3003) ✅ PRODUCTION
├── services/api      → Main API (Hono/CF Workers, port 8787) ✅ PRODUCTION
├── services/auth-service     → Auth utils ✅
├── services/ai-service       → AI suggestion ✅
├── services/matching-service → Matching algo ✅
├── services/trust-service    → Trust scoring ✅
├── services/notifications-service → Notifications ✅
├── packages/types    → Master data model ✅
├── packages/core     → Config + utils ✅
├── packages/ui       → 2 components ⚠️
└── packages/seo      → SEO utils ✅

ĐÃ XÂY (có code thật, tách riêng):
├── om-ai.omdala.com/
│   ├── backend/      → Fastify API, 8 routes ✅
│   ├── web/          → Vite+React dashboard ✅
│   ├── app/          → React Native, 5 screens ✅
│   ├── ios/          → Swift stubs ⚠️ 10%
│   ├── android/      → Docs only ❌ 0%
│   └── gateway/      → Plugin architecture ✅
│
└── omniverse.omdala.com/
    ├── backend/      → Node.js, 3 endpoints, 3 DB adapters ✅
    ├── app/          → Client SDK only ⚠️
    ├── web/          → README only ❌ 0%
    ├── ios/          → README only ❌ 0%
    └── android/      → README only ❌ 0%

CẤU TRÚC MỚI (empty placeholder):
├── ai-om/            → Empty dirs ❌
└── ai-omniverse/     → Empty dirs ❌
```

## Quyết định cần thiết

**QUAN TRỌNG**: Code thật nằm ở `om-ai.omdala.com/` và `omniverse.omdala.com/`,
KHÔNG PHẢI ở `ai-om/` hay `ai-omniverse/`.

→ **Khuyến nghị**: Giữ `om-ai.omdala.com/` và `omniverse.omdala.com/` là workspace chính.
Xóa `ai-om/` và `ai-omniverse/` (empty placeholders) để tránh nhầm lẫn.

---

# 1. CLAUDE AI — VAI TRÒ VÀ NHIỆM VỤ

## 1.1 Claude AI làm gì?

Claude AI (tôi) hoạt động như **Senior Staff Engineer + Architect** cho cả 3 teams:

### Ở Team Platform (Shared Core) — TÔI LÀM CHÍNH
```
✅ Viết code backend cho shared services
✅ Thiết kế + implement API contracts
✅ Database schema + migrations
✅ CI/CD pipeline setup
✅ Code review automation
✅ Testing infrastructure
✅ Documentation generation
✅ Refactoring + code quality
✅ Security audit + fixes
✅ Performance optimization
```

### Ở Team A (Omniverse) — TÔI HỖ TRỢ
```
✅ Backend API development (Node.js)
✅ Web dashboard development (React)
✅ Database schema + queries
✅ API contracts (OpenAPI)
✅ Testing (unit + integration)
✅ Code review
⚠️ iOS/Android: Chỉ scaffold + architecture (cần human cho native UI/UX)
```

### Ở Team B (Om AI) — TÔI HỖ TRỢ
```
✅ Backend API development (Fastify/Node.js)
✅ Web dashboard development (React/Vite)
✅ WebRTC integration scaffolding
✅ Database schema + queries
✅ API contracts
✅ Testing
✅ React Native app development
⚠️ iOS Swift: Scaffold + architecture (hiện tại 10% stub)
⚠️ Android Kotlin: Cần human lead
⚠️ iai.one integration: Cần API access + human testing
```

### Ở cả 3 teams — TÔI LÀM
```
✅ Architecture decisions
✅ Code generation (full implementations, not stubs)
✅ Debugging + troubleshooting
✅ Dependency management
✅ Build system optimization
✅ Documentation
✅ Sprint task breakdown
✅ Risk identification
```

## 1.2 Claude AI KHÔNG làm gì?

```
❌ Real device testing (cần physical hardware)
❌ App Store / Play Store submission
❌ Real user interviews / usability testing
❌ Budget allocation / hiring decisions
❌ Marketing / sales
❌ Legal / compliance review
❌ Physical infrastructure management
❌ Third-party API negotiation (Philips, Nest, etc.)
❌ Production deployment approval (cần human sign-off)
```

---

# 2. PHÂN CHIA NHIỆM VỤ CỤ THỂ — TEAM PLATFORM

## Team Platform: Shared Core Services

**Trạng thái hiện tại**: Có code thật ở `services/` và `packages/`

### 2.1 CÁI ĐÃ CÓ (không cần làm lại)

| Service | LOC | Trạng thái | Ghi chú |
|---|---|---|---|
| `services/api` | 762+ | ✅ Production | Hono/CF Workers + PostgreSQL |
| `services/auth-service` | 52 | ✅ Real | Auth utils, magic link draft |
| `services/ai-service` | 54 | ✅ Real | Suggestion engine |
| `services/matching-service` | 128 | ✅ Real | Matching algorithm |
| `services/trust-service` | 146 | ✅ Real | Trust scoring (0-96) |
| `services/notifications-service` | 33 | ✅ Real | Notification generator |
| `packages/types` | 366 | ✅ Master | Full data model |
| `packages/core` | 44 | ✅ Config | Routes, i18n, utils |
| `infra/db/schema.sql` | Full | ✅ Production | PostgreSQL 6 tables |

### 2.2 CẦN LÀM THÊM (Claude AI + Human)

| Task | Ai Làm | Human Làm | Ưu tiên |
|---|---|---|---|
| **Mở rộng Auth service** — Thêm JWT, session management, OAuth | Claude viết code | Human review + test | 🔴 CRITICAL |
| **Mở rộng Billing service** — Stripe integration, metering | Claude viết code | Human cấu hình Stripe API keys | 🔴 CRITICAL |
| **Workspace service** — Org identity, family, school | Claude viết code | Human review | 🟡 HIGH |
| **Provider Router** — Capability-based routing to AI engines | Claude viết code | Human review | 🟡 HIGH |
| **Analytics service** — Event tracking, dashboard data | Claude viết code | Human review | 🟢 MEDIUM |
| **Design System** — Mở rộng @omdala/ui từ 2 → 20+ components | Claude viết code | Human review UI/UX | 🟡 HIGH |
| **Database migrations** — Thêm tables cho Om AI + Omniverse | Claude viết SQL | Human verify | 🔴 CRITICAL |
| **API Gateway** — Route splitting /v1/* vs /v2/* | Claude viết code | Human test | 🟡 HIGH |
| **WebSocket infrastructure** — Real-time events | Claude viết code | Human test | 🟡 HIGH |

### 2.3 AI LÀM NGAY (có thể code ngay bây giờ)

```
SPRINT 1 — Claude AI Tasks:
1. ✅ Mở rộng services/auth-service → JWT + session + magic link full
2. ✅ Tạo services/billing-service → Stripe integration skeleton
3. ✅ Tạo services/workspace-service → Org/family/school models
4. ✅ Mở rộng packages/types → Thêm types cho Om AI + Omniverse
5. ✅ Database migrations → Thêm tables personas, calls, homes, devices
6. ✅ Mở rộng packages/ui → Button, Card, Modal, Sidebar, Table, etc.
```

---

# 3. PHÂN CHIA NHIỆM VỤ CỤ THỂ — TEAM A (OMNIVERSE)

## Team A: AI Omniverse

**Trạng thái hiện tại**: Backend có 3 endpoints + 3 DB adapters, web/mobile = 0%

### 3.1 CÁI ĐÃ CÓ

| Component | Trạng thái | Chi tiết |
|---|---|---|
| Backend server | ✅ Real | Node.js HTTP server |
| Auth middleware | ✅ Real | Bearer token + workspace validation |
| Login service | ✅ Real | Auth via shared core |
| Room state service | ✅ Real | Room/device state retrieval |
| Session store | ✅ Real | In-memory session management |
| DB adapters (3) | ✅ Real | PostgreSQL + D1 + InMemory |
| OpenAPI spec | ✅ Real | O1 endpoints documented |
| JSON Schema | ✅ Real | Domain models defined |
| Tests (4) | ✅ Passing | Integration tests |
| Client SDK | ✅ Real | loginToRoomState client |

### 3.2 CẦN LÀM

| Task | Ai Làm | Human Làm | Ưu tiên |
|---|---|---|---|
| **Device service** — CRUD, control, status | Claude viết code | Human test với thiết bị thật | 🔴 CRITICAL |
| **Room service mở rộng** — CRUD rooms, assign devices | Claude viết code | Human review | 🔴 CRITICAL |
| **Scene service** — Scene builder, execution engine | Claude viết code | Human review | 🔴 CRITICAL |
| **Automation service** — Triggers, conditions, actions | Claude viết code | Human review | 🟡 HIGH |
| **Gateway runtime** — Device communication | Claude viết code | Human test hardware | 🟡 HIGH |
| **Web dashboard** — React, device control UI | Claude viết code | Human review UI/UX | 🔴 CRITICAL |
| **iOS app** — Swift, device pairing, BLE | Claude scaffold | Human implement native | 🟡 HIGH |
| **Android app** — Kotlin, BLE APIs | Claude scaffold | Human implement native | 🟡 HIGH |
| **WebSocket** — Real-time device status | Claude viết code | Human test | 🟡 HIGH |
| **Tests** — Mở rộng từ 4 → 30+ tests | Claude viết tests | Human review | 🟢 MEDIUM |

### 3.3 AI LÀM NGAY

```
SPRINT 1 — Claude AI Tasks cho Omniverse:
1. ✅ Mở rộng backend: thêm device CRUD endpoints
2. ✅ Mở rộng backend: thêm home management endpoints
3. ✅ Mở rộng backend: thêm scene service
4. ✅ Tạo web dashboard: React + Vite (tương tự om-ai web)
5. ✅ Database schema: thêm homes, rooms, devices, scenes, automations
6. ✅ Tests: thêm 20+ integration tests
```

---

# 4. PHÂN CHIA NHIỆM VỤ CỤ THỂ — TEAM B (OM AI)

## Team B: Om AI

**Trạng thái hiện tại**: Backend 8 routes, Web MVP, Mobile 5 screens, iOS 10%

### 4.1 CÁI ĐÃ CÓ

| Component | Trạng thái | Chi tiết |
|---|---|---|
| Backend (Fastify) | ✅ Real | 8 route modules, all working |
| - Health routes | ✅ | /health, /ready |
| - Device routes | ✅ | CRUD + execute |
| - Scene routes | ✅ | CRUD + run with proof |
| - Run routes | ✅ | History with pagination |
| - Transition routes | ✅ | Plan + execute with policy |
| - Approval routes | ✅ | Full workflow |
| - Proof routes | ✅ | Retrieval |
| - Memory routes | ✅ | Profile, aliases, preferences |
| Persistence | ✅ | JSON file store (207 lines) |
| Auth | ✅ | Magic link + bearer token |
| Policy Engine | ✅ | Allow/deny based on role |
| Web (Vite+React) | ✅ | Full MVP dashboard (17KB App.tsx) |
| - All hooks | ✅ | 6 hooks (planner, runs, approvals, devices, scenes, plan details) |
| - API client | ✅ | 10 functions |
| - UI components | ✅ | Card, Alert, Button, Input |
| Mobile (React Native) | ✅ | 5 screens (SignIn, Timeline, RunDetail, Scenes, Settings) |
| - API layer | ✅ | 7/10 functions |
| - Session store | ✅ | Auth state management |
| iOS (Swift) | ⚠️ 10% | Stub views, minimal API client |
| Android | ❌ 0% | Docs only |
| Gateway | ✅ | Plugin architecture (BLE, Serial, Local IP) |
| CI/CD | ✅ | 3 GitHub Actions workflows |
| Tests | ✅ | Backend + app (60-70% coverage) |
| Scripts | ✅ | 15 scripts (deploy, verify, smoke, rollback) |

### 4.2 QUAN TRỌNG: PIVOT CẦN THIẾT

**Backend hiện tại** là cho "Reality/Omniverse" concept (devices, scenes, transitions, proofs).
**Om AI theo plan mới** cần: Live calls, Personas, Transcripts, Recaps.

→ **CẦN REFACTOR**: Giữ infrastructure (Fastify, auth, persistence, CI/CD),
nhưng thêm **Om AI domain services**: Call, Persona, Recap, Memory.

| Cần giữ | Cần thêm mới | Cần loại bỏ/di chuyển |
|---|---|---|
| Fastify server | Call service (WebRTC) | Device routes → Omniverse |
| Auth system | Persona service | Scene routes → Omniverse |
| Persistence layer | Recap/Transcript service | Transition routes → refactor |
| CI/CD pipeline | Memory service (mở rộng) | Approval routes → refactor |
| Test infrastructure | Billing integration | - |
| Deploy scripts | WebSocket real-time | - |

### 4.3 CẦN LÀM

| Task | Ai Làm | Human Làm | Ưu tiên |
|---|---|---|---|
| **Persona service** — 3 personas, profiles, system prompts | Claude viết code | Human review | 🔴 CRITICAL |
| **Call service** — WebRTC signaling, call lifecycle | Claude viết code | Human test audio | 🔴 CRITICAL |
| **Transcript service** — Real-time speech-to-text | Claude viết integration | Human test với iai.one | 🔴 CRITICAL |
| **Recap service** — Summary generation, key topics | Claude viết code | Human review quality | 🔴 CRITICAL |
| **Memory service mở rộng** — Conversation history, learning | Claude viết code | Human review | 🟡 HIGH |
| **Billing integration** — Free 30min/day, Pro $9.99/month | Claude viết code | Human setup Stripe | 🔴 CRITICAL |
| **Web refactor** — Từ dashboard → persona library + call UI | Claude viết code | Human review UI/UX | 🔴 CRITICAL |
| **Mobile refactor** — Từ timeline → persona + call screens | Claude viết code | Human test trên device | 🟡 HIGH |
| **iOS implementation** — Từ 10% → 80% | Claude viết Swift | Human test trên device | 🟡 HIGH |
| **Android implementation** — Từ 0% → 80% | Claude scaffold | Human implement native | 🟡 HIGH |
| **iai.one integration** — Live call provider | Claude viết wrapper | Human cấu hình API keys | 🔴 CRITICAL |
| **WebSocket** — Transcript real-time updates | Claude viết code | Human test | 🟡 HIGH |

### 4.4 AI LÀM NGAY

```
SPRINT 1 — Claude AI Tasks cho Om AI:
1. ✅ Thêm persona service (data model + API endpoints)
2. ✅ Thêm call service skeleton (WebRTC signaling API)
3. ✅ Thêm recap service (transcript storage + summary)
4. ✅ Mở rộng memory service (conversation history)
5. ✅ Refactor web: thêm persona library page
6. ✅ Database: thêm personas, calls, transcripts tables
```

---

# 5. CLAUDE AI — THỨ TỰ ƯU TIÊN TỔNG THỂ

## Sprint 1 (Tuần 1): Foundation

**Mục tiêu**: Tất cả 3 teams có thể bắt đầu dev

### CRITICAL PATH (làm trước):

```
Ngày 1-2: PLATFORM
├── [1] Mở rộng packages/types → Thêm Om AI types (Persona, Call, Transcript, Recap)
├── [2] Mở rộng packages/types → Thêm Omniverse types (Home, Room, Device, Scene, Automation)
├── [3] Database migrations → Thêm tất cả tables mới
└── [4] Mở rộng services/auth-service → JWT + session full implementation

Ngày 2-3: OM AI
├── [5] Thêm backend routes: /v1/live/personas (GET list, GET detail)
├── [6] Thêm backend routes: /v1/live/call (POST start, POST end)
├── [7] Thêm backend routes: /v1/live/recap (GET by callId)
└── [8] Refactor web App.tsx → Thêm persona library page

Ngày 3-4: OMNIVERSE
├── [9] Thêm backend routes: /v2/omniverse/homes (CRUD)
├── [10] Thêm backend routes: /v2/omniverse/devices (CRUD + control)
├── [11] Thêm backend routes: /v2/omniverse/scenes (CRUD + execute)
└── [12] Tạo web dashboard (React + Vite, tương tự om-ai web)

Ngày 4-5: INTEGRATION
├── [13] WebSocket infrastructure (shared)
├── [14] Billing service skeleton
├── [15] Tests cho tất cả endpoints mới
└── [16] CI/CD update cho cả 3 workspaces
```

### NON-CRITICAL (làm sau Sprint 1):

```
Sprint 2: iOS/Android scaffolding
Sprint 3: WebRTC + iai.one integration
Sprint 4: UI polish + design system expansion
Sprint 5-6: Full features
Sprint 7-8: QA + performance + launch
```

---

# 6. PORT CONFLICT ALERT

**Phát hiện**: Port 3001 bị conflict giữa:
- `apps/app` (Next.js dashboard) → port 3001
- `om-ai.omdala.com/backend` (Fastify) → port 3001

**Fix**: Đổi om-ai backend sang port 3010 hoặc 4000

---

# 7. FOLDER CLEANUP NEEDED

### Xóa (empty placeholders, gây nhầm lẫn):
```
✅ /ai-om/ và /ai-omniverse/ đã được XÓA (April 5, 2026) — chỉ là empty placeholder
   → Code thật duy nhất ở /om-ai.omdala.com/ và /omniverse.omdala.com/
```

### Giữ (có code thật):
```
✅ /om-ai.omdala.com/     → Om AI workspace chính
✅ /omniverse.omdala.com/  → Omniverse workspace chính
✅ /apps/                  → Monorepo apps (web, app, admin, docs)
✅ /services/              → Shared services
✅ /packages/              → Shared packages
✅ /infra/                 → Infrastructure
✅ /docs/                  → Planning documents
```

---

# 8. TÓM TẮT: AI LÀM GÌ CHO MỖI TEAM?

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLAUDE AI ROLE MAP                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  TEAM PLATFORM (Shared Core)                                    │
│  ████████████████████████ 90% Claude AI                         │
│  ░░░ 10% Human (review + API keys + deploy approval)            │
│                                                                 │
│  Claude viết: Auth, Billing, Workspace, Types, DB, UI, Tests    │
│  Human làm: Stripe config, deploy approval, security review     │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  TEAM A — OMNIVERSE                                             │
│  ████████████████░░░░░░░░ 65% Claude AI                         │
│  ░░░░░░░░░░░░░░░ 35% Human                                     │
│                                                                 │
│  Claude viết: Backend API, Web dashboard, DB, Tests, Contracts  │
│  Human làm: iOS/Android native, device testing, UI/UX review,   │
│             manufacturer API negotiation, hardware pairing      │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  TEAM B — OM AI                                                 │
│  ██████████████░░░░░░░░░░ 60% Claude AI                         │
│  ░░░░░░░░░░░░░░░░ 40% Human                                    │
│                                                                 │
│  Claude viết: Backend API, Web refactor, React Native, Tests    │
│  Human làm: iOS/Android native, WebRTC audio testing,           │
│             iai.one integration testing, persona voice tuning,   │
│             real user testing, App Store submission              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

# 9. BẮT ĐẦU NGAY — CLAUDE AI ACTION PLAN

Nếu bạn muốn tôi bắt đầu code ngay, tôi sẽ làm theo thứ tự:

## Bước 1 (ngay bây giờ): Platform Foundation
```
→ Mở rộng packages/types (thêm Om AI + Omniverse types)
→ Database migrations (thêm tables mới)
→ Fix port conflict (om-ai backend 3001 → 3010)
→ Xóa empty placeholders (ai-om/, ai-omniverse/)
```

## Bước 2: Om AI Backend
```
→ Thêm persona service + routes
→ Thêm call service + routes
→ Thêm recap service + routes
→ Refactor web → persona library
```

## Bước 3: Omniverse Backend
```
→ Thêm device service + routes
→ Thêm home/room management
→ Thêm scene service
→ Tạo web dashboard
```

## Bước 4: Integration + Testing
```
→ WebSocket real-time
→ Billing skeleton
→ Tests cho tất cả
→ CI/CD updates
```

---

# END OF FILE

**Tác giả**: Claude AI (Architect)
**Lần cập nhật cuối**: April 5, 2026
**Trạng thái**: Sẵn sàng bắt đầu code
