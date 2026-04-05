# DEVELOPMENT_KICKOFF_CHECKLIST_2026.md

**Phiên bản**: 1.0
**Trạng thái**: DANH SÁCH KIỂM TRA KHỞI ĐỘNG PHÁT TRIỂN
**Ngày**: April 4, 2026
**Lệnh khởi động**: April 16, 2026

---

# 1. MỤC ĐÍCH

Chuẩn bị mọi thứ sao cho **April 16 sáng**, cả **Team A** và **Team B** có thể **bắt đầu code** mà không gặp bất kỳ chặn nào.

**Mục tiêu**: 0 blockers, cấu trúc rõ ràng, tất cả tools sẵn sàng.

---

# 2. DANH SÁCH KIỂM TRA CÔNG NGHỆ

## 2.1 Cộng Nghệ Cơ Sở

### Git & GitHub
- [ ] Repository structure finalized (checked April 14)
- [ ] All old branches cleaned up
- [ ] Main branch is stable
- [ ] Branch protection rules set
  - [ ] Require PR review (≥1)
  - [ ] Require status checks to pass
  - [ ] Require branches to be up to date
- [ ] .gitignore updated for new structure
- [ ] Git LFS configured for large files (if needed)

### Node.js & Package Manager
- [ ] Node.js version locked (`.nvmrc` file)
  - Recommended: Node 18 LTS or 20 LTS
- [ ] npm / yarn / pnpm configured
  - [ ] pnpm recommended (fast, efficient)
  - [ ] pnpm-lock.yaml committed
- [ ] Root `package.json` updated with workspaces
- [ ] All workspace package.json files created
- [ ] npm scripts defined:
  - [ ] `npm run build` (build all)
  - [ ] `npm run test` (test all)
  - [ ] `npm run lint` (lint all)
  - [ ] `npm run dev` (dev servers all)

### Monorepo Setup (NX or Turbo)
- [ ] NX or Turbo installed and configured
  - [ ] `nx.json` or `turbo.json` in root
  - [ ] Task definitions for build, test, lint, dev
  - [ ] Cache configured
- [ ] Project structure recognized
  - [ ] `nx list` shows all projects
  - [ ] `turbo run build` works

### TypeScript
- [ ] Root `tsconfig.json` with path mappings
  - [ ] `@shared-core/*` → `shared-core/*`
  - [ ] `@packages/*` → `packages/*`
  - [ ] `@omniverse/*` → `ai-omniverse/*`
  - [ ] `@om-ai/*` → `ai-om/*`
- [ ] Workspace tsconfig.json files created
- [ ] Type checking works
  - [ ] `npm run type-check` passes

### ESLint & Prettier
- [ ] ESLint configured (root + per workspace)
- [ ] Prettier configured
- [ ] Scripts work:
  - [ ] `npm run lint` passes
  - [ ] `npm run format` works
- [ ] Pre-commit hooks (husky) set up
  - [ ] Runs lint on commit
  - [ ] Blocks commits with errors

---

## 2.2 Backend Setup (Shared Core)

### Auth Service (`shared-core/services/auth`)
- [ ] Project structure created
- [ ] Dependencies installed
- [ ] TypeScript configured
- [ ] Environment variables configured
  - [ ] JWT secret
  - [ ] OAuth credentials (Google, GitHub, etc.)
- [ ] API endpoints defined
  - [ ] POST `/v1/auth/login`
  - [ ] GET `/v1/auth/session`
  - [ ] POST `/v1/auth/logout`
  - [ ] POST `/v1/auth/refresh`
- [ ] Database schema created (if needed)
- [ ] Build works: `npm run build --workspace=shared-core/services/auth`
- [ ] Tests pass: `npm run test --workspace=shared-core/services/auth`

### Billing Service
- [ ] Project structure created
- [ ] Dependencies installed
- [ ] Stripe/PayPal integration prepared
- [ ] API endpoints defined
  - [ ] GET `/v1/billing/subscriptions`
  - [ ] POST `/v1/billing/subscriptions`
  - [ ] GET `/v1/billing/usage`
- [ ] Usage metering infrastructure ready
- [ ] Build + test pass

### Other Shared Services (Workspace, Provider Router, Notifications, Analytics, Account, Design System)
- [ ] Same checklist as Auth + Billing
- [ ] Each service has its own folder
- [ ] Each has its own package.json + tsconfig.json
- [ ] All builds + tests pass

---

## 2.3 Omniverse Backend (`ai-omniverse/backend`)

### Project Structure
- [ ] Created:
  - [ ] `src/` (source code)
  - [ ] `tests/` (unit + integration tests)
  - [ ] `docs/` (API docs, architecture notes)
  - [ ] `package.json`, `tsconfig.json`, etc.

### Services (Device, Room, Scene, Automation, Gateway)
- [ ] All service folders created
- [ ] Each service has:
  - [ ] `index.ts` (entry point)
  - [ ] `routes.ts` (API endpoints)
  - [ ] `controllers/` (business logic)
  - [ ] `models/` (data models)
  - [ ] `tests/` (unit tests)

### API Endpoints (MVP)
- [ ] Homes: POST/GET `/v2/omniverse/homes`
- [ ] Rooms: POST/GET `/v2/omniverse/homes/:homeId/rooms`
- [ ] Devices: POST/GET `/v2/omniverse/devices`, POST `/v2/omniverse/devices/:deviceId/control`
- [ ] Scenes: POST/GET `/v2/omniverse/scenes`, POST `/v2/omniverse/scenes/:sceneId/execute`
- [ ] Automations: POST/GET `/v2/omniverse/automations`
- [ ] Activity: GET `/v2/omniverse/activity-log`

### Database
- [ ] Database connection configured (D1 or external)
- [ ] Schema created:
  - [ ] `homes`, `rooms`, `devices`, `scenes`, `automations`, `activity_log`, etc.
- [ ] Migrations set up
- [ ] Seeding scripts prepared (for testing)

### WebSocket Real-time
- [ ] WebSocket endpoint: `/v2/omniverse/ws?homeId=...`
- [ ] Events defined: device-update, scene-executed, automation-triggered
- [ ] Connection handler implemented
- [ ] Disconnect handling + reconnect logic

### Build & Test
- [ ] `npm run build --workspace=ai-omniverse/backend` passes
- [ ] `npm run test --workspace=ai-omniverse/backend` passes
- [ ] Linting passes

---

## 2.4 Om AI Backend (`ai-om/backend`)

### Project Structure
- [ ] Same as Omniverse
  - [ ] `src/`, `tests/`, `docs/`
  - [ ] `package.json`, `tsconfig.json`

### Services (Call, Persona, Memory, Recap, Curriculum)
- [ ] All service folders created
- [ ] Each has entry, routes, controllers, models, tests

### API Endpoints (MVP)
- [ ] Personas: GET `/v1/live/personas`
- [ ] Calls: POST `/v1/live/call/start`, POST `/v1/live/call/end`
- [ ] Recaps: GET `/v1/live/recap/:callId`, POST `/v1/live/recap/save`
- [ ] WebSocket: `/v2/live/ws?callId=...` (for real-time transcript)

### Database
- [ ] Connection configured
- [ ] Schema created:
  - [ ] `personas`, `calls`, `transcripts`, `recaps`, `usage_events`
- [ ] Migrations set up
- [ ] Seeding scripts prepared

### iai.one Integration
- [ ] API credentials configured (in .env)
- [ ] SDK installed (if available)
- [ ] Call initiation flow stubbed out
- [ ] Speech synthesis integration prepared

### WebSocket Real-time
- [ ] Endpoint: `/v2/live/ws?callId=...`
- [ ] Events: transcript-update, call-ended, recap-ready
- [ ] Implementation started

### Build & Test
- [ ] Build passes
- [ ] Tests pass
- [ ] Linting passes

---

## 2.5 Web Apps (Omniverse & Om AI)

### Omniverse Web (`ai-omniverse/web`)

**Framework Setup**:
- [ ] Next.js 14+ installed
- [ ] TypeScript configured
- [ ] Tailwind CSS set up
- [ ] Folder structure:
  - [ ] `app/` (App Router)
  - [ ] `components/`
  - [ ] `lib/`
  - [ ] `public/`

**Routes Created** (MVP):
- [ ] `/` (landing/marketing)
- [ ] `/login`, `/signup` (auth)
- [ ] `/app` (home selection)
- [ ] `/app/homes/:homeId` (dashboard)
- [ ] `/app/homes/:homeId/rooms` (room management)
- [ ] `/app/homes/:homeId/devices` (device list)
- [ ] `/app/homes/:homeId/scenes` (scenes)
- [ ] `/app/homes/:homeId/automations` (automations)
- [ ] `/app/homes/:homeId/activity` (activity log)
- [ ] `/app/settings` (account settings)
- [ ] `/admin` (admin dashboard - if MVP includes)

**UI Components Created**:
- [ ] Sidebar, Navbar
- [ ] Device card, controls
- [ ] Scene card, builder
- [ ] Automation builder
- [ ] Tables, modals, forms

**API Client** (`lib/api.ts`):
- [ ] Fetch wrapper for API calls
- [ ] Auth token handling
- [ ] Error handling
- [ ] Type-safe API calls

**Real-time**:
- [ ] WebSocket client (`lib/websocket.ts`)
- [ ] Auto-reconnect logic
- [ ] Device status subscriptions

**Build & Test**:
- [ ] `npm run build --workspace=ai-omniverse/web` passes
- [ ] `npm run dev --workspace=ai-omniverse/web` starts dev server
- [ ] Tests pass (if included)

### Om AI Web (`ai-om/web`)

**Same structure as Omniverse Web**, but routes:
- [ ] `/` (landing)
- [ ] `/login`, `/signup`
- [ ] `/app` (persona selection or my calls)
- [ ] `/app/personas` (persona library)
- [ ] `/app/personas/:personaId` (persona detail)
- [ ] `/app/call/:personaId` (live call interface)
- [ ] `/app/calls` (call history)
- [ ] `/app/calls/:callId` (recap view)
- [ ] `/app/account` (profile settings)
- [ ] `/admin` (admin dashboard - if MVP includes)

**Special Components**:
- [ ] Live call interface (WebRTC, transcript panel)
- [ ] Persona card & grid
- [ ] Recap view
- [ ] Subscription modal

---

## 2.6 Mobile Apps (iOS & Android)

### Omniverse Mobile

**iOS Setup**:
- [ ] Xcode project created
- [ ] CocoaPods or SPM configured
- [ ] Swift version set to 5.9+
- [ ] Minimum iOS version: 15
- [ ] Key pods installed:
  - [ ] Alamofire (networking)
  - [ ] Kingfisher (image caching)
  - [ ] SwiftUI (UI framework)
- [ ] Folder structure:
  - [ ] `Sources/` (app code)
  - [ ] `Tests/` (unit tests)
  - [ ] `Podfile` / `Package.swift`
- [ ] Core Bluetooth framework added (for device pairing)
- [ ] Build + tests pass

**Android Setup**:
- [ ] Android Studio project created
- [ ] Kotlin version: 1.9+
- [ ] Min API: 26, Target API: 34
- [ ] Key dependencies:
  - [ ] Retrofit + OkHttp (networking)
  - [ ] Compose (UI framework)
  - [ ] BLE APIs
- [ ] Folder structure:
  - [ ] `app/src/main/` (app code)
  - [ ] `app/src/test/`, `app/src/androidTest/`
  - [ ] `build.gradle`
- [ ] Build + tests pass

### Om AI Mobile

**Same as Omniverse**, but includes:
- [ ] **iOS**: AVFoundation framework added (audio)
- [ ] **iOS**: WebRTC framework (for calls)
- [ ] **Android**: ExoPlayer added
- [ ] **Android**: WebRTC Android SDK

---

## 2.7 CI/CD & Deployment

### GitHub Actions
- [ ] `.github/workflows/` directory created
- [ ] Workflows for each app:
  - [ ] `omniverse-deploy.yml` (triggers on omniverse/** changes)
  - [ ] `om-ai-deploy.yml` (triggers on ai-om/** changes)
  - [ ] `shared-core-deploy.yml` (triggers on shared-core/** changes)
- [ ] Each workflow:
  - [ ] Installs dependencies
  - [ ] Lints code
  - [ ] Runs tests
  - [ ] Builds project
  - [ ] (Optionally) deploys to staging

### Deployment Targets
- [ ] **Cloudflare Pages** configured:
  - [ ] API token in GitHub Secrets
  - [ ] Account ID in GitHub Secrets
  - [ ] Deploy scripts ready
- [ ] **Cloudflare Workers** (for backend):
  - [ ] Wrangler configured
  - [ ] Environment set up (dev, staging, prod)
- [ ] **Mobile**: Build artifacts ready
  - [ ] iOS: .ipa for TestFlight
  - [ ] Android: .apk for Google Play Beta

### Environment Variables
- [ ] Production `.env` configured
- [ ] Staging `.env` configured
- [ ] GitHub Secrets set for:
  - [ ] API keys
  - [ ] Database credentials
  - [ ] Deployment tokens
- [ ] No secrets in code (all via .env)

---

# 3. DANH SÁCH KIỂM TRA NƯỚC NGOÀI / INTEGRATION

## 3.1 External Services

### iai.one (Om AI Live Calls)
- [ ] Account created + API key obtained
- [ ] API credentials stored in secrets
- [ ] Documentation reviewed
- [ ] Sandbox/test environment ready
- [ ] Integration plan documented

### Stripe (Billing)
- [ ] Test account created
- [ ] API keys (publishable + secret) in secrets
- [ ] Webhook configured (for payment events)
- [ ] Test card numbers documented
- [ ] Payment flow documented

### Device Manufacturers (Omniverse)
- [ ] **Philips Hue**: API docs reviewed, credentials obtained
- [ ] **Nest**: API docs reviewed, OAuth flow documented
- [ ] **TP-Link**: API docs reviewed, credentials obtained
- [ ] **LIFX**: API docs reviewed, credentials obtained
- [ ] **Other**: (at least 5-10 device types documented)
- [ ] Manufacturer API wrapper ready (or plan for it)

### Analytics (Segment)
- [ ] Write key obtained
- [ ] SDK installed
- [ ] Events documented (sign-up, call-start, device-control, upgrade, etc.)

### Error Tracking (Sentry)
- [ ] Project created
- [ ] DSN (Data Source Name) obtained
- [ ] SDK installed (for both web + mobile)
- [ ] Source maps configured

---

## 3.2 Database & Infrastructure

### Database
- [ ] **D1 (Cloudflare)** OR **external database** choice made
- [ ] Connection string in secrets
- [ ] Schemas created (all tables)
- [ ] Migrations tool set up (Drizzle, Typeorm, or raw SQL)
- [ ] Backups configured (if external DB)
- [ ] Development database available

### Caching (Redis or Cloudflare KV)
- [ ] Service chosen
- [ ] Connection configured
- [ ] Key naming conventions documented

### Storage (Cloudflare R2 or AWS S3)
- [ ] Service chosen
- [ ] Bucket created
- [ ] Credentials in secrets
- [ ] Upload/download flow documented

---

# 4. DANH SÁCH KIỂM TRA TEAM & OPERATIONS

## 4.1 Team Setup

### Team A (Omniverse)
- [ ] **Team Lead**: Confirmed
- [ ] **iOS Lead** (2-3 engineers): Confirmed
- [ ] **Android Lead** (2-3 engineers): Confirmed
- [ ] **Web Lead** (1 engineer): Confirmed
- [ ] **Backend Lead** (1-2 engineers): Confirmed
- [ ] **Total**: 6-8 engineers confirmed
- [ ] Team Slack channel created: `#team-omniverse`
- [ ] GitHub team created: `team-a-omniverse`

### Team B (Om AI)
- [ ] **Team Lead**: Confirmed
- [ ] **iOS Lead** (2-3 engineers): Confirmed
- [ ] **Android Lead** (2-3 engineers): Confirmed
- [ ] **Web Lead** (1-2 engineers): Confirmed
- [ ] **Backend Lead** (2-3 engineers): Confirmed
- [ ] **Total**: 8-10 engineers confirmed
- [ ] Team Slack channel created: `#team-om-ai`
- [ ] GitHub team created: `team-b-om-ai`

### Team Platform (Shared Core)
- [ ] **Team Lead**: Confirmed
- [ ] **Auth Lead**: Confirmed
- [ ] **Billing Lead**: Confirmed
- [ ] **Infrastructure Lead**: Confirmed
- [ ] **Total**: 5-7 engineers confirmed
- [ ] Team Slack channel created: `#team-platform`
- [ ] GitHub team created: `team-platform`

### Project Managers & Leadership
- [ ] **Product Lead**: Confirmed
- [ ] **CTO / Tech Lead**: Confirmed
- [ ] **Project Manager**: Confirmed
- [ ] **Engineering Manager**: Confirmed

---

## 4.2 Documentation & Knowledge Transfer

### Batch S1 Documentation
- [ ] All 5 Batch S1 files distributed to teams
- [ ] Batch S1 Index circulated
- [ ] Teams read docs (log completion)
- [ ] Q&A session held (if needed)

### Batch S2 Documentation
- [ ] All 4 Batch S2 files distributed
- [ ] App-specific: Team A reads Omniverse doc, Team B reads Om AI doc
- [ ] Tech leads understand shared core
- [ ] Teams ready to code

### Additional Docs
- [ ] API documentation (auto-generated or manual)
- [ ] Architecture diagrams (ERD, system architecture, deployment)
- [ ] Developer setup guide (how to clone, install, run locally)
- [ ] Contributing guidelines (code style, PR process, testing)
- [ ] Deployment runbook (how to deploy to staging/prod)

---

## 4.3 Communication & Ceremonies

### Daily Standup
- [ ] Time locked: [time] (9am recommended)
- [ ] Duration: 15 min
- [ ] Format: What I did yesterday, what I'm doing today, blockers
- [ ] Per-team (Team A, Team B, Team Platform) + optionally shared

### Weekly Tech Sync (Cross-team)
- [ ] Time locked: [day] [time]
- [ ] Duration: 30-45 min
- [ ] Topics: Shared core updates, cross-team dependencies, blockers, lessons learned
- [ ] Attendees: Team leads + tech leads

### Weekly All-Hands
- [ ] Time locked: [day] [time]
- [ ] Duration: 30 min
- [ ] Topics: Progress, wins, upcoming challenges, company updates
- [ ] Attendees: Everyone (product, engineering, leadership)

### Bi-weekly Sprint Reviews
- [ ] Time locked: [day] [time]
- [ ] Demos of completed features
- [ ] Retrospectives
- [ ] Sprint planning for next sprint

---

## 4.4 Jira / Project Management

### Sprints
- [ ] Sprint 1 (Week 1): Named, created, dates set
- [ ] Sprint 2-8: Sequentially planned (to June 1 target)
- [ ] Sprint capacity: Estimated per team

### Epics (per app)
- [ ] **Omniverse Epic 1**: Home/Room Management
- [ ] **Omniverse Epic 2**: Device Onboarding
- [ ] **Omniverse Epic 3**: Device Control
- [ ] **Omniverse Epic 4**: Scenes
- [ ] ... (and so on)
- [ ] **Om AI Epic 1**: Live Call Service
- [ ] **Om AI Epic 2**: Persona Library
- [ ] ... (and so on)

### Stories
- [ ] Stories created for each epic
- [ ] Acceptance criteria defined
- [ ] Story points estimated
- [ ] Assigned to team members

### Board Setup
- [ ] Backlog, To Do, In Progress, In Review, Done columns
- [ ] Automated transitions (PR merged → Done, etc.)
- [ ] Filters for per-team board (if needed)

---

# 5. DANH SÁCH KIỂM TRA CÁCH LÀMVIỆC (Development Workflow)

## 5.1 Git & PR Workflow

### Branch Strategy
- [ ] Main branch: Long-lived, production-ready
- [ ] Feature branches: `feature/omniverse-device-control`, `feature/om-ai-live-call`, etc.
- [ ] Bugfix branches: `bugfix/...`
- [ ] Release branches: `release/1.0.0` (for versioning)

### PR Process
- [ ] Create PR with description (what + why)
- [ ] Link to Jira ticket
- [ ] Assign reviewer (≥1)
- [ ] Wait for CI to pass (build, test, lint)
- [ ] Respond to review comments
- [ ] Squash merge to main (or conventional strategy)
- [ ] Auto-close linked ticket

### Code Review
- [ ] Rubric defined (performance, security, testing, style)
- [ ] Estimated turnaround: < 24 hours
- [ ] Remote review OK (asynchronous is fine)
- [ ] Two-tier: Peer review + optional tech lead review (for API/core logic)

---

## 5.2 Testing & Quality

### Unit Tests
- [ ] Jest configured (for Node/React)
- [ ] XCTest / JUnit configured (for iOS/Android)
- [ ] Coverage target: > 70% (per module)
- [ ] Pre-commit: Run tests on staged files

### Integration Tests
- [ ] API integration tests (test backend endpoints)
- [ ] Web integration tests (test components + API)
- [ ] Run on every push to main

### E2E Tests (optional for MVP)
- [ ] Playwright or Cypress (if time permits)
- [ ] At least happy path for critical flows

### Performance Testing
- [ ] Lighthouse score (web): > 80
- [ ] Mobile app: No ANRs (Android Not Responding)
- [ ] Call latency: < 200ms
- [ ] API response time: < 500ms

---

## 5.3 Deployment & Releases

### Staging Deploys
- [ ] Automatic on main branch merge
- [ ] Can deploy + test on staging before prod
- [ ] Staging = exact copy of prod schema/data

### Production Deploys
- [ ] Manual approval (by Tech Lead or Product)
- [ ] Deployment checklist (verified April 16)
- [ ] Rollback plan documented
- [ ] Monitoring + alerting active

### Versioning
- [ ] Semantic versioning: MAJOR.MINOR.PATCH
- [ ] Tag each release: `v0.1.0`, `v0.1.1`, `v0.2.0`
- [ ] Release notes: Auto-generated from commit messages or manual

---

# 6. DANH SÁCH KIỂM TRA AN TOÀN & COMPLIANCE

## 6.1 Security

### Secret Management
- [ ] No secrets in code (`.env` files not committed)
- [ ] GitHub Secrets configured for all sensitive data
- [ ] Rotation policy documented (how often to rotate keys)
- [ ] Audit log of who accessed what secret

### API Security
- [ ] Rate limiting configured (prevent abuse)
- [ ] CORS properly configured (only allow trusted origins)
- [ ] HTTPS enforced (no HTTP)
- [ ] JWT validation on protected routes
- [ ] Input validation (prevent injection attacks)

### Data Security
- [ ] Database encryption at rest (if possible)
- [ ] Data encryption in transit (TLS/SSL)
- [ ] GDPR compliance review (if EU users expected)
- [ ] Data retention policy documented

### Access Control
- [ ] Role-based access (admin vs user)
- [ ] API permissions checked (user can only access their own data)
- [ ] Mobile app auth token refresh

---

## 6.2 Monitoring & Observability

### Logging
- [ ] Structured logging (JSON format)
- [ ] Logs sent to centralized system (if available)
- [ ] Log retention policy set
- [ ] Sensitive data not logged (passwords, tokens)

### Metrics
- [ ] Application metrics exported (request count, latency, errors)
- [ ] System metrics available (CPU, memory, disk)
- [ ] Business metrics tracked (DAU, calls, conversions)

### Alerting
- [ ] Alert rules defined:
  - [ ] API error rate > 5%
  - [ ] API latency > 1000ms
  - [ ] Server CPU > 80%
  - [ ] Database disk > 90%
- [ ] Alert recipients configured (on-call engineer)
- [ ] Alert response SLA documented (should respond within 15 min)

### Dashboards
- [ ] Real-time dashboard with key metrics
- [ ] Per-team dashboard (if needed)
- [ ] On-call dashboard (current issues)

---

# 7. READY TO BUILD CHECKLIST

On **April 16 morning**, verify:

### Infrastructure
- [ ] Staging environment accessible
- [ ] Production environment ready (but not live yet)
- [ ] Databases initialized
- [ ] CI/CD pipelines working
- [ ] Monitoring + alerting armed

### Code
- [ ] All repositories cloned
- [ ] Branches created per team
- [ ] Latest main branch pulled
- [ ] Local environments set up (all engineers)
- [ ] Can run locally: `npm run dev` works

### Communications
- [ ] Slack channels ready
- [ ] Daily standup scheduled
- [ ] First sprint planning meeting scheduled
- [ ] Product Lead + CTO available for questions

### Documentation
- [ ] All engineers have read relevant docs
- [ ] Q&A session completed
- [ ] Developer setup guide works (tested by 1-2 engineers)
- [ ] Deployment runbook reviewed

### Budget & Timeline
- [ ] Budget approved + allocated
- [ ] Timeline locked (8 weeks to MVP)
- [ ] Team capacity confirmed
- [ ] No competing priorities (teams can focus)

---

# 8. APRIL 16 MORNING KICKOFF

**Time**: 9:00 AM (all teams)

**Agenda**:
1. (5 min) Welcome + quick recap
2. (5 min) Today's goal: First feature branches created
3. (5 min) Architecture walkthrough (CTO)
4. (5 min) Sprint 1 breakdown (Product Lead)
5. (5 min) Questions?
6. (10 min) Teams break out → start coding

**Expected Output by End of Day (April 16)**:
- Team A: 2-3 branches created, initial commits pushed
- Team B: 2-3 branches created, initial commits pushed
- Team Platform: Auth service scaffolding completed
- No blockers reported

---

# 9. FIRST WEEK MILESTONES (APRIL 16-20)

### Team A (Omniverse)
- [ ] Day 1 (Wed): Project setup, folder structure, dependencies
- [ ] Day 2 (Thu): Home + Room API endpoints stubbed
- [ ] Day 3 (Fri): Device discovery backend started
- [ ] EOW: Can create a home + add rooms via API

### Team B (Om AI)
- [ ] Day 1: Project setup, folder structure
- [ ] Day 2: Persona data + Calls table schema
- [ ] Day 3: Call initiation API stubbed
- [ ] EOW: Can start a call (backend)

### Team Platform
- [ ] Day 1: Auth service completed + tested
- [ ] Day 2: Billing service endpoints stubbed
- [ ] Day 3: Workspace service started
- [ ] EOW: All 3 services passing tests

---

# 10. RISKS & MITIGATIONS

| Risk | Mitigation |
|---|---|
| Setup takes longer than expected | Build buffer into week 1; pair junior engineers with seniors |
| Environment variable issues | Pre-populate .env templates; test before April 16 |
| Git/GitHub issues | Have DevOps support on standby Monday morning |
| Engineer missing setup | Pair them with someone; provide step-by-step guide |
| Unclear requirements | Q&A session pre-April 16; Batch S2 docs + demos |
| Dependency conflicts | Lock versions in package.json; test locally before pushing |

---

# 11. SUCCESS CRITERIA (APRIL 16)

Development is **ready to go** when:

✅ All engineers can run projects locally
✅ CI/CD pipelines working
✅ Slack + Jira set up
✅ First code committed
✅ No blockers reported
✅ Teams confident in codebase structure
✅ 0 critical bugs on first day

---

# END OF FILE

**Tác giả**: CTO / DevOps
**Lần cập nhật cuối**: April 4, 2026
**Trạng thái**: Sẵn sàng cho lệnh khởi động April 16
