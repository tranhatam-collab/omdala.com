# DEVELOPMENT_STANDARDS_2026.md

**Phiên bản**: 1.0
**Trạng thái**: TIÊU CHUẨN PHÁT TRIỂN CHUNG
**Ngày**: April 4, 2026
**Phạm vi**: Tất cả teams (Team A, Team B, Team Platform)
**Mục đích**: Khóa chuẩn DEV để tất cả teams cùng làm việc hiệu quả

---

# 1. NGUYÊN TẮC CHUNG

## 1.1 Single Source of Truth (SSOT)

**Mỗi team phải có:**
- ✅ 1 repository chính (GitHub)
- ✅ 1 cách build (npm/gradle/xcode)
- ✅ 1 cách test (jest/xctest/junit)
- ✅ 1 cách deploy (GitHub Actions + Cloud)
- ✅ 1 bộ tài liệu API (OpenAPI/Swagger)

**Không được:**
- ❌ 2 cách build khác nhau
- ❌ Code tồn tại ở 2 chỗ cùng lúc
- ❌ Tài liệu lỗi thời (phải sync với code)

## 1.2 Transparency (Minh Bạch)

**Tất cả team phải:**
- ✅ Commit thường xuyên (mỗi 1-2 giờ)
- ✅ Push to main/branch hàng ngày
- ✅ Báo cáo blocker ngay (không chờ standup)
- ✅ Log tất cả công việc vào Jira
- ✅ Update progress vào shared dashboard

**Không được:**
- ❌ Code local lâu (>1 ngày không push)
- ❌ Giấu blocker
- ❌ Làm việc không được log

## 1.3 Parallel Execution (Thực Hiện Song Song)

**Teams hoạt động độc lập:**
- ✅ Team A (Omniverse) → `/omniverse.omdala.com/*`
- ✅ Team B (Om AI) → `/om-ai.omdala.com/*`
- ✅ Team Platform → `/shared-core/*`

**Nhưng phải sync:**
- ✅ Shared core API contracts locked (không thay đổi tuỳ ý)
- ✅ Dependency versions locked (tránh conflict)
- ✅ Daily sync meetings (15 min, tìm blocker)

---

# 2. CODE STANDARDS

## 2.1 Language & Naming

### English for Code (Bắt Buộc)
```typescript
// ✅ GOOD
interface DeviceState {
  id: string;
  name: string;
  isOnline: boolean;
  lastUpdated: Date;
}

function toggleDevice(deviceId: string): Promise<void> {
  // implementation
}

// ❌ BAD
interface TrangThaiThietBi {
  id: string;
  ten: string;
  coNguon: boolean;
}

function batTat_Thiet_Bi(id: string) {
  // ...
}
```

### English for Comments (Ưu Tiên)
```typescript
// ✅ PREFERRED
/**
 * Execute a scene with all its associated devices.
 * Returns success/failure for each device in the scene.
 */
async function executeScene(sceneId: string): Promise<SceneResult> {
  // ...
}

// ✅ ACCEPTABLE (with context)
/**
 * Thực thi một scene (Omniverse specific)
 * Trả về success/failure cho từng thiết bị
 *
 * Execute a scene with all devices.
 */
async function executeScene(sceneId: string): Promise<SceneResult> {
  // ...
}

// ❌ BAD (only Vietnamese, no English)
/**
 * Thực thi một scene
 * Trả về success/failure
 */
```

### File & Folder Names (English Only)
```
✅ GOOD:
/omniverse.omdala.com/backend/src/services/device-service/device-control.ts
/om-ai.omdala.com/backend/src/services/call-service/call-handler.ts
/services/auth-service/src/jwt-manager.ts

❌ BAD:
/omniverse.omdala.com/backend/src/services/dich-vu-thiet-bi/dieu-khien.ts
/om-ai.omdala.com/backend/src/services/dich-vu-goi/xu-li-goi.ts
```

---

## 2.2 Code Style & Format

### TypeScript/JavaScript
```typescript
// prettier + eslint enforced

// ✅ Format
const user = await getUserById(userId);
const isActive = user.status === 'active';

if (isActive) {
  await notifyUser(user.email);
}

// Run before commit:
npm run format
npm run lint

// Fix automatically:
npm run lint --fix
```

### Go/Other Languages
```go
// gofmt enforced (standard Go formatter)
// eslint equivalent for your language
```

### Pre-commit Hooks
```bash
# Install husky (npm install husky)
# Add .husky/pre-commit:

#!/bin/sh
npm run lint
npm run test --coverage
npm run type-check

# If any fails → commit blocked
```

---

## 2.3 Testing Requirements

### Unit Tests (Bắt Buộc)
```typescript
// Every function/service needs unit tests

// ✅ Example
describe('DeviceService', () => {
  describe('toggleDevice', () => {
    it('should turn device on when currently off', async () => {
      const device = createTestDevice({ isOn: false });
      const result = await toggleDevice(device.id);

      expect(result.isOn).toBe(true);
    });

    it('should return error when device is offline', async () => {
      const device = createTestDevice({ isOnline: false });
      const result = await toggleDevice(device.id);

      expect(result.error).toBe('DEVICE_OFFLINE');
    });
  });
});

// Minimum coverage: 70% per file
// Run: npm run test --coverage
```

### Integration Tests (Ưu Tiên)
```typescript
// Test API endpoints + database together

// ✅ Example
describe('POST /v2/omniverse/devices/:deviceId/control', () => {
  it('should control device and update status in real-time', async () => {
    // 1. Setup: Create device in DB
    const device = await createDevice({ name: 'Light 1' });

    // 2. Action: Call API
    const response = await api.post(`/v2/omniverse/devices/${device.id}/control`, {
      action: 'toggle',
    });

    // 3. Assert: Check DB + API response
    expect(response.status).toBe(200);
    const updated = await getDevice(device.id);
    expect(updated.isOn).toBe(true);
  });
});

// Run: npm run test:integration
```

### Manual Testing (Bắt Buộc trước Deploy)
```markdown
## Pre-Deploy Checklist

- [ ] Feature tested locally (dev mode)
- [ ] Happy path works (main flow)
- [ ] Error cases handled (invalid input, network down)
- [ ] Edge cases covered (boundary values)
- [ ] No console errors in browser/mobile
- [ ] No memory leaks (check memory profiler if applicable)
```

---

## 2.4 Git Workflow

### Branch Naming
```bash
# Feature
feature/omniverse-device-control
feature/om-ai-live-call-v1

# Bugfix
bugfix/device-offline-status-update
bugfix/scene-execution-timeout

# Task (non-feature, non-bug)
task/refactor-api-client
task/update-dependencies

# Docs
docs/api-documentation-v2
```

### Commit Messages

**Format: `<type>(<scope>): <message>`**

```bash
# ✅ GOOD
feat(omniverse-device): add brightness control for lights
fix(om-ai-call): fix transcript timeout after 30 minutes
docs(shared-core-auth): update JWT refresh flow

refactor(omniverse-web): simplify device card component
test(om-ai-backend): add integration tests for recap generation
chore(dependencies): update react to 18.2.0

# ❌ BAD
updated code
fix bug
new feature
thêm tính năng
```

### PR (Pull Request) Process

**Template** (auto-filled by GitHub):
```markdown
## Description
Brief explanation of what this PR does and why.

## Related Ticket
Closes #123 (Jira ticket)

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing on staging
- [ ] No new console errors

## Checklist
- [ ] Code follows style guide
- [ ] Comments/docs updated
- [ ] No sensitive data in code
- [ ] API changes documented (if applicable)

## Screenshots (if UI change)
[Paste screenshots here]
```

### PR Review Requirements
```markdown
- Minimum 1 approval (peer review)
- CI/CD checks pass (lint, test, build)
- No merge conflicts
- Up-to-date with main branch

Optional:
- 2nd approval for API changes
- CTO review for architecture changes
- Security review if handling auth/payment
```

---

## 2.5 Database & Migrations

### Schema Management
```sql
-- ✅ GOOD: Version-controlled migrations
-- File: migrations/001_create_devices_table.sql

CREATE TABLE devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id UUID NOT NULL REFERENCES homes(id),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  manufacturer VARCHAR(100),
  is_online BOOLEAN DEFAULT false,
  last_seen TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- File: migrations/002_add_device_battery_level.sql
ALTER TABLE devices ADD COLUMN battery_level INTEGER;
ALTER TABLE devices ADD COLUMN battery_updated_at TIMESTAMP;

-- Run migrations
npm run migrate

-- Rollback if needed
npm run migrate:rollback
```

### Data Integrity
```typescript
// ✅ Always use transactions for multi-step changes
async function executeScene(sceneId: string) {
  const transaction = await db.transaction();
  try {
    // Step 1: Get scene
    const scene = await transaction.query(...);

    // Step 2: Update all devices (atomic)
    for (const device of scene.devices) {
      await transaction.update(...);
    }

    // Step 3: Log execution
    await transaction.insert(...);

    // Commit all or nothing
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
```

---

# 3. DEPLOYMENT STANDARDS

## 3.1 Environments

**3 environments tất cả apps:**

### Development (Local)
```bash
# Mỗi engineer có environment local
# Database: Local SQLite/Postgres
# API: http://localhost:3000 (backend)
# Web: http://localhost:3001
# Mobile: Build locally

npm run dev
# hoặc
npm run dev:omniverse
npm run dev:om-ai
```

### Staging
```bash
# Deployed automatically on main branch
# Database: Copy of production schema (but test data)
# API: https://staging-api.omniverse.omdala.com
# Web: https://staging.omniverse.omdala.com
# Mobile: Build uploaded to TestFlight/Google Play internal

# Deploy via GitHub Action (automatic)
# Verify before deploying to production
```

### Production
```bash
# Manual deployment approval required
# Database: Real production data
# API: https://api.omniverse.omdala.com
# Web: https://app.omniverse.omdala.com
# Mobile: Published to App Store / Play Store

# Deployment checklist:
# [ ] All tests pass
# [ ] Staging tested
# [ ] Stakeholder approval
# [ ] Deployment runbook reviewed
# [ ] Rollback plan ready
```

---

## 3.2 Deployment Checklist

**Before deploying to PRODUCTION:**

```markdown
## Pre-Deployment Verification

### Code Quality
- [ ] All unit tests pass (npm run test)
- [ ] All integration tests pass
- [ ] Code coverage > 70%
- [ ] Linting passes (npm run lint)
- [ ] No console errors/warnings

### Functionality
- [ ] Feature tested on staging
- [ ] Happy path works
- [ ] Error cases handled
- [ ] Mobile app tested on device (if applicable)

### Performance
- [ ] Lighthouse score > 80 (web)
- [ ] API response time < 500ms
- [ ] No N+1 database queries
- [ ] Cache properly configured

### Security
- [ ] No secrets in code
- [ ] All API endpoints authenticated
- [ ] Input validation present
- [ ] SQL injection prevented
- [ ] CORS properly configured

### Infrastructure
- [ ] Database migrations run
- [ ] Environment variables set
- [ ] Monitoring + alerting active
- [ ] Logs configured
- [ ] Backup ready

### Sign-off
- [ ] Product Lead approved
- [ ] Tech Lead approved
- [ ] DevOps reviewed
```

---

## 3.3 Rollback Procedure

If production deployment fails:

```bash
# 1. STOP: Revert to previous version
git revert <commit-hash>  # or git reset --hard <previous-tag>

# 2. FIX: Investigate issue
npm run test
npm run lint

# 3. VERIFY: Test fix locally + staging
npm run dev:staging

# 4. DEPLOY: Re-deploy fixed version
npm run deploy:production

# 5. MONITOR: Watch for errors (5-10 min)
# [ ] Error rate normal
# [ ] Response times normal
# [ ] Database queries normal

# 6. NOTIFY: Tell stakeholders
Slack: "Production rollback completed. Root cause: ..."
```

---

# 4. COMMUNICATION STANDARDS

## 4.1 Daily Standup (15 min)

**Format**: Per-team (Team A, Team B, Team Platform)

**Template**:
```markdown
## Standup Report - Team A (Omniverse)
**Date**: April 16, 2026
**Attendees**: [Team Lead, iOS Lead, Android Lead, Web Lead, Backend Lead]

### Yesterday (April 15)
- Completed: Device discovery API endpoints
- In Progress: Device control UI (web)
- Blockers: None

### Today (April 16)
- Plan: Finish device control, start scene builder
- Risk: iOS build might take longer than expected

### Blockers
- None currently
- Will update if any arise

### Metrics (optional)
- Commits: 12
- PRs merged: 3
- Tests passing: 98%
- Build time: 2 min
```

## 4.2 Weekly Tech Sync (30 min)

**Cross-team meeting**: Team Lead (A, B, Platform) + CTO

**Topics**:
- [ ] Shared core status (Platform team)
- [ ] API contract changes (if any)
- [ ] Cross-team dependencies
- [ ] Blockers that need CTO help
- [ ] Performance/scalability concerns

---

## 4.3 Escalation Path

**Blocker found?**
1. **Immediate** (same-day) → Slack #dev-blockers
2. **Within 1 hour** → Notify team lead + CTO
3. **If not resolved** → Unblock during daily standup
4. **If still blocked** → CTO makes decision (pivot/workaround/new priority)

**Example**:
```
Problem: "Omniverse device gateway not responding, blocking device control integration"

Escalation:
- 10:30 AM: Posted to Slack
- 10:45 AM: Pinged Team A Lead + Platform Lead
- 11:00 AM: Team A Lead investigates
- 11:30 AM: Platform team deploys fix
- 12:00 PM: Resolved, resume work
```

---

# 5. MONITORING & OBSERVABILITY STANDARDS

## 5.1 Logging

**All apps must log:**

```typescript
// ✅ STRUCTURED LOGGING (JSON)
import { logger } from '@shared-core/logger';

// Info
logger.info('Device toggled', {
  deviceId: 'dev-123',
  action: 'toggle',
  previousState: 'off',
  newState: 'on',
  duration: 250, // milliseconds
  timestamp: new Date().toISOString(),
});

// Error
logger.error('Device control failed', {
  deviceId: 'dev-123',
  action: 'toggle',
  error: 'DEVICE_OFFLINE',
  statusCode: 503,
  timestamp: new Date().toISOString(),
});

// Warning
logger.warn('Slow query detected', {
  query: 'SELECT * FROM devices WHERE home_id = ?',
  duration: 2500, // > 1s threshold
  timestamp: new Date().toISOString(),
});

// Debug
logger.debug('Processing device event', {
  deviceId: 'dev-123',
  event: 'battery_low',
  batteryLevel: 15,
  timestamp: new Date().toISOString(),
});

// All logs collected in Sentry / CloudWatch / DataDog
```

## 5.2 Metrics

**Key metrics to track:**

```typescript
// Omniverse
- Device control success rate (%)
- Scene execution success rate (%)
- Device discovery time (seconds)
- API response latency (ms)

// Om AI
- Call connection success rate (%)
- Transcript update latency (ms)
- Recap generation time (seconds)
- Audio quality score (1-5)

// Shared Core
- Auth token generation time (ms)
- Billing API latency (ms)
- Database query time (ms)
- Cache hit rate (%)
```

---

# 6. DOCUMENTATION STANDARDS

## 6.1 API Documentation

**Every API endpoint must be documented:**

```yaml
# ✅ OpenAPI/Swagger format
/v2/omniverse/devices/{deviceId}/control:
  post:
    summary: Control a smart device
    description: Send a control command to a device (toggle, set brightness, etc.)

    parameters:
      - in: path
        name: deviceId
        required: true
        schema:
          type: string
          format: uuid

    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              action:
                type: string
                enum: [toggle, set]
              params:
                type: object
                additionalProperties: true

    responses:
      200:
        description: Device controlled successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                success: boolean
                newState: object

      400:
        description: Invalid request

      404:
        description: Device not found

      503:
        description: Device offline
```

## 6.2 README Standards

**Every project must have README.md:**

```markdown
# Omniverse Backend

Brief description of what this service does.

## Quick Start

### Prerequisites
- Node.js 18+
- npm/pnpm

### Installation
```bash
npm install
cp .env.example .env
npm run dev
```
```

## 6.3 Code Comments

```typescript
// ✅ GOOD: Explain WHY, not WHAT

/**
 * Retry device control up to 3 times if connection fails.
 * Some devices like Zigbee bulbs have unstable WiFi, so we retry
 * with exponential backoff (100ms, 200ms, 400ms).
 */
async function controlDeviceWithRetry(deviceId: string, action: string) {
  let attempt = 0;
  while (attempt < 3) {
    try {
      return await controlDevice(deviceId, action);
    } catch (error) {
      if (error.code === 'CONNECTION_TIMEOUT') {
        await sleep(100 * Math.pow(2, attempt));
        attempt++;
      } else {
        throw error;
      }
    }
  }
  throw new Error('Max retries exceeded');
}

// ❌ BAD: Obvious from code, no value-add

// loop 3 times
for (let i = 0; i < 3; i++) {
  // try to control device
  try {
    // call control function
    return controlDevice(...);
  } catch (error) {
    // if error, sleep and retry
    await sleep(100);
  }
}
```

---

# 7. QUALITY GATES

**All code must pass these gates before merging to main:**

```markdown
## Automatic Checks (must pass)
- [ ] Linting (ESLint, Prettier)
- [ ] Type checking (TypeScript)
- [ ] Unit tests (>70% coverage)
- [ ] Build succeeds (no build errors)
- [ ] No secrets in code (secret scanner)

## Manual Review (peer review required)
- [ ] Code is readable + maintainable
- [ ] Architecture decisions explained
- [ ] No duplicate code
- [ ] Error handling present
- [ ] Performance acceptable
- [ ] Security reviewed (if sensitive)

## Deployment (before production)
- [ ] Works on staging
- [ ] All tests pass
- [ ] Manual testing completed
- [ ] Stakeholder approval
- [ ] Rollback plan ready
```

---

# 8. ISSUE TRACKING (Jira)

**All work must be tracked in Jira:**

```markdown
## Epic (big feature)
- Name: "Device Control MVP"
- Status: In Progress
- Timeline: 2 weeks

## Story (user-facing work)
- Title: "As a user, I can toggle a light on/off"
- Acceptance Criteria:
  - [ ] Light toggle button visible in device card
  - [ ] Click button sends command to backend
  - [ ] Light updates within 1 second
  - [ ] Error message if device offline
- Estimated: 3 story points
- Assigned to: iOS Lead + Web Lead
- Status: In Progress

## Task (non-user-facing work)
- Title: "Refactor device service API client"
- Estimated: 2 story points
- Assigned to: Backend Lead
- Status: To Do

## Bug
- Title: "Device status doesn't update in real-time"
- Severity: Critical (blocks user)
- Assigned to: Backend Lead
- Status: In Progress
```

---

# 9. TEAM-SPECIFIC NOTES

## Team A (Omniverse)
- Focus: Device control reliability (99%+ success)
- Priority: Device discovery, device control, scene execution
- Not priority: Advanced features (Matter, ML scheduling)

## Team B (Om AI)
- Focus: Call quality (95%+ success), transcript accuracy
- Priority: Live call, personas, recap generation
- Not priority: Custom personas, video calls, curriculum (Phase A2+)

## Team Platform
- Focus: Shared core stability (99.9% uptime)
- Priority: Auth, Billing, WebSocket real-time
- Support: Unblock both teams daily

---

# END OF FILE

**Tác giả**: CTO / Engineering Standards Committee
**Lần cập nhật cuối**: April 4, 2026
**Trạng thái**: Bắt buộc cho tất cả teams từ April 16
