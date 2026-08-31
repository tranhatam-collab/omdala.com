# SHARED_CORE_SCHEMA_2026.md

**Version**: 1.0  
**Status**: DRAFT — PENDING TEAM 1 SIGN-OFF  
**Date**: April 20, 2026  
**Owner**: Team 2 — Omniverse + System Reliability  
**For**: Team 1 (Om AI + User Core) consumption  
**Primary Reference**: `docs/TWO_TEAM_PARALLEL_DEV_MASTER_PLAN_2026-04-09.md`, `docs/DATA_MODEL_OMDALA.md`

---

# 1. MỤC ĐÍCH

File này chốt 3 schema shared platform mà Team 2 sở hữu và Team 1 consume:

1. **Workspace schema** — đơn vị tổ chức dùng chung cho Om AI + Omniverse
2. **Notifications event schema** — event envelope cho mọi thông báo cross-product
3. **Analytics event envelope** — event envelope chung cho tracking, audit, và analytics

Hard rule:
- Team 1 **consume**, không sửa schema ở đây
- Team 2 **sở hữu** và lock schema trước khi broadcast
- Mọi thay đổi schema phải có Team 1 sign-off trước khi áp dụng
- Không extend schema chỉ vì tiện — mỗi field phải có lý do rõ

---

# 2. OWNERSHIP BOUNDARY

| Schema | Owner | Consumer | Status |
|---|---|---|---|
| `Workspace` | Team 2 | Team 1 (Om AI), Team 2 (Omniverse) | DRAFT |
| `Notification` event | Team 2 | Team 1 (Om AI), Team 2 (Omniverse admin) | DRAFT |
| `Analytics` event envelope | Team 2 | Team 1, Team 2, shared infra | DRAFT |

Team 1 không sở hữu:
- workspace schema
- notifications schema
- analytics envelope chung

(Source: `docs/ACCOUNT_BILLING_SOURCE_OF_TRUTH_2026.md` section 2)

---

# 3. WORKSPACE SCHEMA

## 3.1 Mục đích

`Workspace` là đơn vị tổ chức tối thiểu dùng chung:
- Om AI: grouping học viên / business personas theo workspace
- Omniverse: grouping homes / devices / users theo workspace
- Shared platform: billing, permissions, notifications đều scope theo workspace

## 3.2 TypeScript interface (canonical)

```typescript
// packages/core/src/workspace.ts

export type WorkspaceType =
  | 'personal'      // workspace cá nhân — 1 user
  | 'team'          // workspace nhóm — nhiều members
  | 'business'      // workspace doanh nghiệp — có admin role
  | 'education';    // workspace học thuật — teacher/student roles

export type WorkspaceStatus =
  | 'active'
  | 'suspended'
  | 'archived';

export type WorkspaceMemberRole =
  | 'owner'
  | 'admin'
  | 'member'
  | 'viewer';

export interface Workspace {
  id: string;                        // UUID
  name: string;                      // display name
  slug: string;                      // URL-safe identifier, unique per platform
  type: WorkspaceType;
  status: WorkspaceStatus;
  owner_user_id: string;             // FK → User.id
  plan_id: string | null;            // FK → billing plan (Team 1 owns plan logic)
  locale: string;                    // 'en' | 'vi' | 'zh' | 'es' | 'ja' | 'ko'
  metadata: Record<string, unknown>; // product-specific extensions (không dùng cho schema invariants)
  created_at: string;                // ISO 8601
  updated_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;              // FK → Workspace.id
  user_id: string;                   // FK → User.id
  role: WorkspaceMemberRole;
  invited_by_user_id: string | null;
  joined_at: string;
  status: 'active' | 'invited' | 'suspended';
}
```

## 3.3 API contracts (Team 2 sở hữu)

```
GET    /v1/workspaces                    → list workspaces của user hiện tại
POST   /v1/workspaces                    → tạo workspace mới
GET    /v1/workspaces/:id                → get workspace
PATCH  /v1/workspaces/:id                → update workspace (owner/admin only)
DELETE /v1/workspaces/:id                → archive workspace (owner only)

GET    /v1/workspaces/:id/members        → list members
POST   /v1/workspaces/:id/members        → invite member
PATCH  /v1/workspaces/:id/members/:uid   → update member role
DELETE /v1/workspaces/:id/members/:uid   → remove member
```

## 3.4 D1 migration (Omniverse DB)

```sql
-- migrations/0016_workspace.sql

CREATE TABLE IF NOT EXISTS workspaces (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  slug         TEXT NOT NULL UNIQUE,
  type         TEXT NOT NULL DEFAULT 'personal',
  status       TEXT NOT NULL DEFAULT 'active',
  owner_user_id TEXT NOT NULL,
  plan_id      TEXT,
  locale       TEXT NOT NULL DEFAULT 'en',
  metadata     TEXT NOT NULL DEFAULT '{}',
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workspace_members (
  id                  TEXT PRIMARY KEY,
  workspace_id        TEXT NOT NULL REFERENCES workspaces(id),
  user_id             TEXT NOT NULL,
  role                TEXT NOT NULL DEFAULT 'member',
  invited_by_user_id  TEXT,
  joined_at           TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'active',
  UNIQUE(workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_workspaces_owner ON workspaces(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON workspace_members(user_id);
```

## 3.5 Rules cho Team 1

- Om AI có thể dùng `workspace_id` để scope personas, sessions, và billing
- Om AI không tự tạo workspace logic riêng — dùng `/v1/workspaces` endpoints
- `plan_id` trên workspace là reference sang billing layer của Team 1 — Team 1 sở hữu plan semantics
- `metadata` field dùng để extend product-specific data mà không làm thay đổi schema invariants

---

# 4. NOTIFICATIONS EVENT SCHEMA

## 4.1 Mục đích

Một event envelope dùng chung cho mọi notification cross-product:
- Om AI: thông báo session sắp hết, recap sẵn sàng, subscription reminder
- Omniverse: thông báo device offline, automation triggered, alert
- Shared platform: billing events, account events

## 4.2 TypeScript interface (canonical)

```typescript
// packages/core/src/notification.ts

export type NotificationChannel =
  | 'in_app'    // hiển thị trong app shell
  | 'push'      // mobile push notification
  | 'email'     // email delivery
  | 'webhook';  // internal webhook (system-to-system)

export type NotificationPriority =
  | 'low'
  | 'normal'
  | 'high'
  | 'critical';

export type NotificationStatus =
  | 'pending'
  | 'sent'
  | 'delivered'
  | 'failed'
  | 'dismissed';

export interface NotificationEvent {
  id: string;                         // UUID — idempotency key
  workspace_id: string | null;        // nullable — platform-level notifications không có workspace
  user_id: string;                    // recipient
  product: 'om_ai' | 'omniverse' | 'platform'; // nguồn gốc event
  event_type: string;                 // e.g. 'session.ending_soon', 'device.offline', 'billing.invoice_ready'
  channel: NotificationChannel;
  priority: NotificationPriority;
  status: NotificationStatus;
  title: string;                      // short display title (localized nếu có)
  body: string;                       // notification body (localized nếu có)
  locale: string;                     // 'en' | 'vi' | ...
  action_url: string | null;          // deep link URL (nếu có)
  metadata: Record<string, unknown>;  // product-specific payload
  created_at: string;                 // ISO 8601
  sent_at: string | null;
  delivered_at: string | null;
}
```

## 4.3 Event type naming convention

Format: `<domain>.<event>` — lowercase, snake_case

Om AI events (Team 1 define, Team 2 route):
```
om_ai.session.starting
om_ai.session.ending_soon
om_ai.session.ended
om_ai.recap.ready
om_ai.billing.usage_warning
om_ai.billing.subscription_expiring
om_ai.billing.subscription_renewed
om_ai.billing.payment_failed
```

Omniverse events (Team 2 define và route):
```
omniverse.device.offline
omniverse.device.online
omniverse.automation.triggered
omniverse.automation.failed
omniverse.scene.activated
omniverse.alert.triggered
```

Platform events (shared):
```
platform.account.created
platform.account.suspended
platform.workspace.member_invited
platform.workspace.member_joined
```

## 4.4 API contracts

```
POST   /v1/notifications                          → gửi notification (internal, auth-gated)
GET    /v1/notifications                          → list notifications của user hiện tại
PATCH  /v1/notifications/:id/dismiss              → dismiss notification
GET    /v1/notifications/unread-count             → unread count cho badge
```

## 4.5 Rules

- `event_type` phải thuộc danh sách đã khai báo — không được invent tự do
- Product team (Team 1) định nghĩa event types trong domain của mình, Team 2 route
- `metadata` field dùng để pass payload product-specific — không thêm vào top-level schema
- `workspace_id` là nullable — platform-level notifications không cần workspace context

---

# 5. ANALYTICS EVENT ENVELOPE

## 5.1 Mục đích

Một event envelope chuẩn cho mọi tracking event cross-product:
- Om AI: track session starts, lesson completions, subscription upgrades
- Omniverse: track device actions, automation runs, dashboard views
- Shared: track user registration, workspace creation, billing events

## 5.2 TypeScript interface (canonical)

```typescript
// packages/core/src/analytics.ts

export type AnalyticsEventCategory =
  | 'user_action'    // user tương tác trực tiếp
  | 'system_event'   // platform / automation tự trigger
  | 'billing_event'  // subscription, payment, usage
  | 'error_event';   // errors, failures, fallbacks

export interface AnalyticsEvent {
  // Envelope fields — bắt buộc, không được bỏ
  event_id: string;           // UUID — idempotency key
  event_type: string;         // e.g. 'session.started', 'device.action.sent'
  event_category: AnalyticsEventCategory;
  product: 'om_ai' | 'omniverse' | 'platform';
  timestamp: string;          // ISO 8601

  // Identity context
  user_id: string | null;     // nullable cho anonymous events
  workspace_id: string | null;
  session_id: string | null;  // session-level grouping nếu có

  // Client context
  platform: 'web' | 'ios' | 'android' | 'server';
  app_version: string | null;
  locale: string;

  // Payload — product-specific, không enforce schema
  properties: Record<string, unknown>;
}
```

## 5.3 Event type naming convention

Format: `<noun>.<verb>` — lowercase, snake_case

Bắt buộc dùng đúng format. Không được invent format riêng.

Ví dụ hợp lệ:
```
session.started
session.ended
lesson.completed
device.action.sent
device.action.failed
automation.triggered
workspace.created
subscription.upgraded
payment.completed
page.viewed
```

## 5.4 Ingestion endpoint

```
POST /v1/analytics/events        → batch ingest (max 100 events/request)
POST /v1/analytics/event         → single event
```

Request body cho single event:
```json
{
  "event_type": "session.started",
  "event_category": "user_action",
  "product": "om_ai",
  "timestamp": "2026-04-20T10:00:00Z",
  "user_id": "usr_abc123",
  "workspace_id": "ws_xyz789",
  "session_id": "sess_111",
  "platform": "ios",
  "app_version": "1.0.0",
  "locale": "vi",
  "properties": {
    "persona_id": "persona_en_coach",
    "plan_tier": "pro"
  }
}
```

## 5.5 Rules

- Tất cả teams phải dùng envelope này — không được tạo analytics endpoint riêng
- `event_id` là UUID bắt buộc — dùng cho deduplication
- `properties` field là nơi duy nhất để extend — không thêm field mới vào top-level envelope mà không có Team 2 approval
- Client-side events phải pass qua `/v1/analytics/events` endpoint — không post thẳng vào D1
- Server-side events có thể write trực tiếp nếu trong cùng Worker

---

# 6. SHARED PACKAGES LOCATION

Schema trên phải được implement trong `packages/core`:

```
packages/core/src/
├── workspace.ts       ← Workspace, WorkspaceMember types
├── notification.ts    ← NotificationEvent type + event type constants
├── analytics.ts       ← AnalyticsEvent type + category constants
└── index.ts           ← re-export tất cả
```

Team 1 và Team 2 đều import từ `@omdala/core`, không tự define lại.

---

# 7. SIGN-OFF REQUIRED

Trước khi Team 1 implement bất kỳ dependency nào vào các schema trên, cần có:

- [ ] Team 1 lead xác nhận `Workspace` schema đủ cho Om AI use case
- [ ] Team 1 lead xác nhận `Notification` event types cho Om AI domain
- [ ] Team 1 lead xác nhận `Analytics` event envelope đủ
- [ ] Team 2 lead chốt lần cuối và bump version lên `1.1 LOCKED`

Sau khi locked:
- không ai thay đổi top-level schema mà không có sign-off từ cả 2 teams
- field additions phải backward-compatible
- field removals là breaking change — cần migration plan

---

# 8. CHANGELOG

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0 DRAFT | 2026-04-20 | Initial draft — workspace + notifications + analytics | Team 2 |

---

# END OF FILE
