# CODE_MIGRATION_PLAN_2026.md

**Phiên bản**: 1.1
**Trạng thái**: KỀ HOẠCH DI CHUYỂN CODE (APRIL 6-14)
**Ngày**: April 4, 2026 (cập nhật April 5)
**Thời hạn**: April 6 (bắt đầu) → April 14 (xong)
**Thời gian**: 9 ngày (độc lập song song, không chặn)

> ⚠️ **LƯU Ý QUAN TRỌNG (April 5, 2026)**:
> Tài liệu này dùng path `/ai-om/` và `/ai-omniverse/` là kế hoạch ban đầu.
> **Trên thực tế**, code đã được tổ chức tại:
> - `/om-ai.omdala.com/` (Om AI — có code thật)
> - `/omniverse.omdala.com/` (Omniverse — có code thật)
> - `/ai-om/` và `/ai-omniverse/` đã bị XÓA (empty placeholders)
>
> Khi đọc tài liệu này, thay thế:
> - `/ai-om/*` → `/om-ai.omdala.com/*`
> - `/ai-omniverse/*` → `/omniverse.omdala.com/*`

---

# 1. MỤC ĐÍCH

**Chuyển codebase từ cấu trúc cũ → cấu trúc mới** mà không mất bất kỳ code nào.

### Cấu trúc cũ (deprecated):
```
/apps/
├── web/           → di chuyển tới /ai-omniverse/web + /ai-om/web
├── app/           → di chuyển tới /ai-omniverse/mobile + /ai-om/mobile
└── admin/         → di chuyển tới /ai-omniverse/backend/admin + /ai-om/backend/admin

/services/
├── api/           → di chuyển tới /ai-omniverse/backend + /ai-om/backend
├── auth/          → di chuyển tới /shared-core/services/auth
├── billing/       → di chuyển tới /shared-core/services/billing
└── ...
```

### Cấu trúc mới (target):
```
/shared-core/              ← Các dịch vụ chung (Auth, Billing, Workspace, v.v.)
├── services/
│  ├── auth/
│  ├── billing/
│  ├── workspace/
│  ├── provider-router/
│  ├── notifications/
│  ├── analytics/
│  ├── account/
│  └── design-system/

/ai-omniverse/             ← Team A (Device + Environment Control)
├── mobile/
│  ├── ios/
│  └── android/
├── web/
├── backend/
│  ├── services/
│  │  ├── device-service/
│  │  ├── room-service/
│  │  ├── scene-service/
│  │  ├── automation-service/
│  │  └── gateway/
│  └── admin/
└── docs/

/ai-om/                    ← Team B (AI Human Call + Learning)
├── mobile/
│  ├── ios/
│  └── android/
├── web/
├── backend/
│  ├── services/
│  │  ├── call-service/
│  │  ├── persona-service/
│  │  ├── memory-service/
│  │  ├── curriculum-service/
│  │  └── family-service/
│  └── admin/
└── docs/

/packages/                 ← Shared packages (không thay đổi)
├── core/
├── types/
├── ui/
└── seo/
```

---

# 2. DANH SÁCH KIỂM TRA DI CHUYỂN

### Giai đoạn 1: Chuẩn bị (April 6 sáng)
- [ ] Tạo folder structure mới (tất cả các thư mục)
- [ ] Backup code cũ (git archive để lưu trữ)
- [ ] Thông báo tất cả teams (Slack/email)
- [ ] Lock /apps, /services từ các commit mới
- [ ] Chuẩn bị CI/CD config mới

### Giai đoạn 2: Di chuyển Code (April 6-12)
- [ ] **Di chuyển /apps/web**
  - [ ] → /ai-omniverse/web (Omniverse dashboard)
  - [ ] → /ai-om/web (Om AI dashboard)
- [ ] **Di chuyển /apps/app**
  - [ ] → /ai-omniverse/mobile/ios + android (Omniverse mobile)
  - [ ] → /ai-om/mobile/ios + android (Om AI mobile)
- [ ] **Di chuyển /services/api**
  - [ ] → /ai-omniverse/backend (Omniverse backend)
  - [ ] → /ai-om/backend (Om AI backend)
- [ ] **Di chuyển /services/auth**
  - [ ] → /shared-core/services/auth
- [ ] **Di chuyển /services/billing**
  - [ ] → /shared-core/services/billing
- [ ] **Di chuyển /services/[other]**
  - [ ] workspace → /shared-core/services/workspace
  - [ ] notifications → /shared-core/services/notifications
  - [ ] analytics → /shared-core/services/analytics
  - [ ] ... (v.v.)

### Giai đoạn 3: Update References (April 12-13)
- [ ] Update import paths (tất cả code)
- [ ] Update package.json dependencies
- [ ] Update monorepo config (nx, lerna, turbo)
- [ ] Update CI/CD pipelines
- [ ] Update deployment scripts

### Giai đoạn 4: Testing & Validation (April 13-14)
- [ ] Verify builds (tất cả packages)
- [ ] Verify tests (tất cả packages)
- [ ] Verify deployments (staging)
- [ ] Fix any broken references
- [ ] Document any issues

### Giai đoạn 5: Finalization (April 14)
- [ ] Remove old /apps, /services (hoặc archive)
- [ ] Update README + documentation
- [ ] Create tag/release branch (migration-complete)
- [ ] Notify all teams (ready for April 16 dev start)

---

# 3. CHI TIẾT DI CHUYỂN TỪng PHẦN

## 3.1 Di chuyển Shared Core Services

**Owner**: Team Platform Lead
**Duration**: April 6-10
**Parallelizable**: Có (mỗi service độc lập)

### Auth Service
```bash
# Source: /services/auth
# Target: /shared-core/services/auth

# Di chuyển toàn bộ:
# - src/ (code)
# - tests/ (unit tests)
# - package.json
# - tsconfig.json
# - README.md

# Update:
# - Import paths: services/* → shared-core/services/auth
# - API paths: /v1/auth/* (không thay đổi)
```

### Billing Service
```bash
# Source: /services/billing
# Target: /shared-core/services/billing

# Tương tự như Auth
# Update:
# - Import paths
# - API paths: /v1/billing/* (không thay đổi)
# - Database references (metering, subscriptions)
```

### Workspace Service
```bash
# Source: /services/workspace (hoặc tạo mới nếu chưa có)
# Target: /shared-core/services/workspace

# Nếu code đã tồn tại trong /services:
# - Di chuyển như Auth
# - API paths: /v1/workspaces/*

# Nếu code chưa tồn tại:
# - Tạo stub để chuẩn bị cho sau
```

### Provider Router
```bash
# Source: /services/provider (hoặc code nằm trong api)
# Target: /shared-core/services/provider-router

# Tách logic router từ /services/api
# - Capability-based routing
# - Provider selection (iai.one, local gateway, v.v.)
# - API paths: /v1/providers/*
```

### Notifications, Analytics, Account, Design System
```bash
# Tương tự như Auth/Billing
# Mỗi service riêng folder, riêng package.json
# API paths: /v1/notifications/*, /v1/analytics/*, /v1/account/*, /v1/design/*
```

---

## 3.2 Di chuyển Omniverse (Team A)

**Owner**: Team A Lead
**Duration**: April 6-12
**Parallelizable**: Có (web, mobile, backend độc lập)

### Mobile (iOS + Android)
```bash
# Source: /apps/app (hoặc /apps/mobile nếu đã tách)
# Target: /ai-omniverse/mobile/ios + /ai-omniverse/mobile/android

# iOS:
# - Di chuyển /apps/app/ios → /ai-omniverse/mobile/ios
# - Update podfile/SPM dependencies
# - Update import paths
# - Update API endpoint (shared auth, billing)

# Android:
# - Di chuyển /apps/app/android → /ai-omniverse/mobile/android
# - Update gradle build files
# - Update dependencies
# - Update API endpoints
```

### Web
```bash
# Source: /apps/web (hoặc tách từ /apps/web nếu shared)
# Target: /ai-omniverse/web

# Tách web Om AI từ web Omniverse nếu chưa tách
# - Nếu chung 1 codebase:
#   - Tạo 2 folder: /ai-omniverse/web + /ai-om/web
#   - Copy common code
#   - Split component, style, route riêng
#
# - Nếu đã tách:
#   - Move /apps/web/omniverse → /ai-omniverse/web

# Update:
# - import paths (shared-core, packages)
# - API endpoints (/v2/omniverse/*)
# - .env files (API_BASE_URL, WS_URL)
```

### Backend
```bash
# Source: /services/api (hoặc tách từ /services/api)
# Target: /ai-omniverse/backend

# Tách Omniverse backend từ shared core:
# - Device service (device discovery, control, status)
# - Room service (room management)
# - Scene service (scene builder, execution)
# - Automation service (automation setup, trigger)
# - Gateway (device communication, MQTT/CoAP)

# Update:
# - API paths: /v2/omniverse/* (không phải /v1/*)
# - Database tables (homes, rooms, devices, scenes, automations)
# - Dependencies (shared-core/auth, shared-core/billing)
```

### Admin
```bash
# Source: /apps/admin (hoặc code nằm trong /services/api)
# Target: /ai-omniverse/backend/admin

# Tách admin Omniverse:
# - Device template management
# - User analytics
# - Device issue tracking
# - System health monitoring

# Có thể share UI code từ /ai-omniverse/web
```

---

## 3.3 Di chuyển Om AI (Team B)

**Owner**: Team B Lead
**Duration**: April 6-12
**Parallelizable**: Có (web, mobile, backend độc lập)

### Mobile (iOS + Android)
```bash
# Source: /apps/app (di chuyển phần Om AI)
# Target: /ai-om/mobile/ios + /ai-om/mobile/android

# Tương tự như Omniverse mobile
# Nhưng focus vào:
# - WebRTC audio setup (AVFoundation, ExoPlayer)
# - Call UI (avatar, transcript panel)
# - Persona selection
```

### Web
```bash
# Source: /apps/web (di chuyển phần Om AI)
# Target: /ai-om/web

# Nếu chưa tách:
# - Copy từ /apps/web
# - Tách Om AI-specific components, routes, styles

# Update:
# - API endpoints (/v1/live/*, /v1/billing/*)
# - WebSocket URL (transcript updates)
```

### Backend
```bash
# Source: /services/api (di chuyển phần Om AI)
# Target: /ai-om/backend

# Tách Om AI backend:
# - Call service (WebRTC signaling, call management)
# - Persona service (persona data, profiles)
# - Memory service (conversation history, learning progress)
# - Recap service (transcript generation, summary, key topics)
# - Curriculum service (lesson paths, content) - Phase A2+

# Update:
# - API paths: /v1/live/*, /v2/live/* (khác Omniverse)
# - Database tables (personas, calls, transcripts, recaps)
# - Dependencies (iai.one provider, shared-core)
```

### Admin
```bash
# Source: /apps/admin (hoặc code nằm trong /services/api)
# Target: /ai-om/backend/admin

# Tách admin Om AI:
# - Persona management (create, edit, delete, analytics)
# - User analytics (DAU, retention, conversion)
# - Organization management (schools, businesses) - Phase A2+
# - Support ticket system
```

---

# 4. MONOREPO CONFIG UPDATES

### package.json (root)
```json
{
  "name": "omdala",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "packages/*",
    "shared-core/services/*",
    "ai-omniverse/mobile/ios",
    "ai-omniverse/mobile/android",
    "ai-omniverse/web",
    "ai-omniverse/backend",
    "ai-om/mobile/ios",
    "ai-om/mobile/android",
    "ai-om/web",
    "ai-om/backend"
  ]
}
```

### tsconfig.json (root)
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@shared-core/*": ["shared-core/*"],
      "@packages/*": ["packages/*"],
      "@omniverse/*": ["ai-omniverse/*"],
      "@om-ai/*": ["ai-om/*"]
    }
  }
}
```

### nx.json (nếu dùng NX) hoặc turbo.json (nếu dùng Turbo)
```json
{
  "version": 2,
  "projects": {
    "shared-core-auth": { "root": "shared-core/services/auth" },
    "shared-core-billing": { "root": "shared-core/services/billing" },
    "ai-omniverse-web": { "root": "ai-omniverse/web" },
    "ai-omniverse-backend": { "root": "ai-omniverse/backend" },
    "ai-om-web": { "root": "ai-om/web" },
    "ai-om-backend": { "root": "ai-om/backend" }
  }
}
```

---

# 5. CI/CD PIPELINE UPDATES

### GitHub Actions (mỗi app riêng workflow)

**File**: `.github/workflows/omniverse-deploy.yml`
```yaml
name: Deploy Omniverse
on:
  push:
    branches: [main]
    paths:
      - 'ai-omniverse/**'
      - 'shared-core/**'
      - 'packages/**'

jobs:
  build-web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run build --workspace=ai-omniverse/web
      - run: npm run test --workspace=ai-omniverse/web
      - name: Deploy to Cloudflare
        # ... deploy steps

  build-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run build --workspace=ai-omniverse/backend
      - run: npm run test --workspace=ai-omniverse/backend
      - name: Deploy to Cloudflare Workers
        # ... deploy steps
```

**File**: `.github/workflows/om-ai-deploy.yml`
```yaml
name: Deploy Om AI
on:
  push:
    branches: [main]
    paths:
      - 'ai-om/**'
      - 'shared-core/**'
      - 'packages/**'

jobs:
  # Similar to omniverse-deploy.yml
```

**File**: `.github/workflows/shared-core-deploy.yml`
```yaml
name: Deploy Shared Core
on:
  push:
    branches: [main]
    paths:
      - 'shared-core/**'

jobs:
  build-auth:
    # Test + build shared-core auth
  build-billing:
    # Test + build shared-core billing
  # ... other services
```

---

# 6. TESTING & VALIDATION CHECKLIST

### April 13-14: Verify All Builds

```bash
# Shared Core
npm run build --workspace=shared-core/services/auth
npm run build --workspace=shared-core/services/billing
npm run build --workspace=shared-core/services/workspace
# ... other services

# Omniverse
npm run build --workspace=ai-omniverse/web
npm run build --workspace=ai-omniverse/backend
npm run build --workspace=ai-omniverse/mobile/ios  (pod install)
npm run build --workspace=ai-omniverse/mobile/android  (gradle)

# Om AI
npm run build --workspace=ai-om/web
npm run build --workspace=ai-om/backend
npm run build --workspace=ai-om/mobile/ios
npm run build --workspace=ai-om/mobile/android

# Packages
npm run build --workspace=packages/core
npm run build --workspace=packages/types
npm run build --workspace=packages/ui
```

### Run Tests
```bash
# Tất cả tests
npm run test

# Hoặc per workspace
npm run test --workspace=ai-omniverse/backend
npm run test --workspace=ai-om/backend
npm run test --workspace=shared-core/services/auth
```

### Deploy to Staging
```bash
# Verify staging deploys work
npm run deploy:staging --workspace=ai-omniverse/web
npm run deploy:staging --workspace=ai-omniverse/backend
npm run deploy:staging --workspace=ai-om/web
npm run deploy:staging --workspace=ai-om/backend
```

### Manual Testing
- [ ] Omniverse web loads on staging
- [ ] Omniverse mobile builds + runs
- [ ] Om AI web loads on staging
- [ ] Om AI mobile builds + runs
- [ ] Auth flow works (shared core)
- [ ] Billing flow works (shared core)
- [ ] API calls route correctly

---

# 7. GIT STRATEGY

### Branching
```
main
├── omniverse-migration (Team A)
├── om-ai-migration (Team B)
└── shared-core-migration (Team Platform)

# Sau khi xong migration:
# - Merge tất cả vào main (April 14)
# - Tag: v1.0.0-migration-complete
```

### Commits
```bash
# Atomic commits, descriptive messages:
# Team A:
git commit -m "chore(omniverse): move web to ai-omniverse/web"
git commit -m "chore(omniverse): move backend to ai-omniverse/backend"
git commit -m "chore(omniverse): update imports and package.json"

# Team B:
git commit -m "chore(om-ai): move web to ai-om/web"
git commit -m "chore(om-ai): move backend to ai-om/backend"
git commit -m "chore(om-ai): update imports and package.json"

# Team Platform:
git commit -m "chore(shared-core): move auth service"
git commit -m "chore(shared-core): move billing service"
git commit -m "chore(shared-core): update monorepo config"
```

---

# 8. ROLLBACK PLAN

Nếu migration có vấn đề lớn:

1. **Revert tất cả commits** (git revert hoặc reset)
2. **Restore từ backup** (git archive backup từ April 5)
3. **Notify all teams** (Slack/email)
4. **Investigate issue** (post-mortem)
5. **Restart migration** (với fix cho issue)

**Timeline**: Xử lý trong vòng 2-4 giờ, không ảnh hưởng tới April 16 dev start.

---

# 9. COMMUNICATION PLAN

### April 6 Sáng
- [ ] Slack announcement: "Code migration starts TODAY"
- [ ] Pinned message: Link tới tài liệu này
- [ ] Mute /apps, /services from commits (CI check)

### Hàng ngày (April 6-14)
- [ ] Daily standup: Report migration progress
- [ ] Slack updates: "Team A 50% done", "Team B 30% done", v.v.
- [ ] Flag any blockers immediately

### April 14 Chiều
- [ ] Final announcement: "Migration complete, all systems GO for April 16"
- [ ] Send updated repo structure overview
- [ ] Confirm all teams ready to start coding

### April 15-16
- [ ] April 16 morning: "Development officially starts"
- [ ] Teams confirm code structure is clear
- [ ] Ready to merge feature branches

---

# 10. DETAILED TIMELINE (APRIL 6-14)

### April 6 (Thứ 4)
| Giờ | Hoạt động |
|---|---|
| 08:00 | Announcement + kickoff meeting |
| 09:00 | Teams start migration (parallel) |
| 17:00 | EOD checkpoint: Report progress |

### April 7-10 (Thứ 5-Thứ 2)
| Ngày | Team A | Team B | Team Platform |
|---|---|---|---|
| **April 7 (Th5)** | Move mobile/web | Move mobile/web | Move auth + billing |
| **April 8 (Th6)** | Move backend | Move backend | Move workspace + provider |
| **April 9 (Th7)** | Update imports | Update imports | Update imports |
| **April 10 (Th2)** | Fix references | Fix references | Fix references |

### April 11 (Thứ 3)
| Hoạt động |
|---|
| Run all builds |
| Run all tests |
| Flag errors + start fixes |

### April 12 (Thứ 4)
| Hoạt động |
|---|
| Deploy to staging |
| Manual testing |
| Fix remaining issues |

### April 13 (Thứ 5)
| Hoạt động |
|---|
| Final verification |
| Document any gotchas |
| Prepare for dev start |

### April 14 (Thứ 6)
| Hoạt động |
|---|
| Merge all branches to main |
| Tag release |
| Final announcement |

---

# 11. RISKS & MITIGATION

| Risk | Impact | Mitigation |
|---|---|---|
| Broken imports | Build failure | Automated linter check before merge |
| Lost code | Critical | Git backup + archive before start |
| Merge conflicts | Delay | Clear responsibilities per team |
| API path confusion | Runtime error | Double-check path mappings |
| CI/CD not updated | Deploy failure | Test deploy to staging first |

---

# 12. SUCCESS CRITERIA

Di chuyển được coi là **thành công** khi:

- ✅ Tất cả code được chuyển (không mất code nào)
- ✅ Tất cả builds pass (no build errors)
- ✅ Tất cả tests pass (no test failures)
- ✅ Staging deployments work
- ✅ Manual testing on staging OK
- ✅ Teams understand new folder structure
- ✅ Ready to start coding April 16

---

# END OF FILE

**Tác giả**: DevOps / Architecture
**Lần cập nhật cuối**: April 4, 2026
**Trạng thái**: Sẵn sàng thực thi April 6
