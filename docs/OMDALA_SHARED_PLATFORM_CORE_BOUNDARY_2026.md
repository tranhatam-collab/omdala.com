# OMDALA_SHARED_PLATFORM_CORE_BOUNDARY_2026.md

**Version**: 1.0
**Status**: SHARED SERVICES ARCHITECTURE LOCK
**Scope**: Định nghĩa ranh giới giữa shared core và domain-specific cho Om AI + AI Omniverse
**Date**: April 4, 2026

---

# 1. OVERVIEW

Sau khi tách thành 2 app (Om AI + AI Omniverse), cả 2 sẽ dùng chung một **Shared Platform Core** bao gồm:

- Authentication
- Account Management
- Billing & Subscription
- Provider Registry & Routing
- Workspace & Organization Identity
- Notifications
- Analytics & Observability
- Design System (CSS/UI tokens)

---

# 2. SHARED CORE SERVICES

## 2.1 Authentication & Auth Service

**Service**: `omdala-auth` (Cloudflare Worker + D1)

**Endpoints**:
- `POST /v1/auth/register` — tạo account
- `POST /v1/auth/login` — login (magic link hoặc password)
- `POST /v1/auth/logout` — logout
- `POST /v1/auth/refresh` — refresh token
- `GET /v1/auth/session` — get current session

**Shared Tables**:
- `users` — id, email, displayName, passwordHash?, roles, createdAt
- `sessions` — id, userId, jwt, expiresAt, device, ipAddress
- `oauth_providers` — id, providerId, email, userId (for future SSO)

**Boundary**:
- Auth không biết app nào (Om AI hay Omniverse)
- Role/permission check là lớp trên của từng app

---

## 2.2 Account Management Service

**Service**: `omdala-account` (Cloudflare Worker + D1)

**Endpoints**:
- `GET /v1/account/profile` — get user profile
- `PUT /v1/account/profile` — update profile
- `GET /v1/account/preferences` — get user preferences
- `PUT /v1/account/preferences` — update preferences
- `GET /v1/account/devices` — get linked devices (phone, tablet, etc)

**Shared Tables**:
- `user_profiles` — id, userId, avatar, bio, timezone, locale
- `user_preferences` — id, userId, theme, notifications, language
- `user_devices` — id, userId, deviceId, deviceName, lastActive

**Boundary**:
- Lưu profile/preference chung cho user
- Không chứa domain-specific data (rooms, personas, lessons, etc)

---

## 2.3 Billing & Subscription Core

**Service**: `omdala-billing` (Cloudflare Worker + D1 + Stripe/PayPal)

**Endpoints**:
- `GET /v1/billing/subscriptions` — list user subscriptions
- `POST /v1/billing/subscriptions` — create subscription
- `PUT /v1/billing/subscriptions/:id` — update subscription
- `DELETE /v1/billing/subscriptions/:id` — cancel subscription
- `GET /v1/billing/usage` — get metered usage
- `POST /v1/billing/invoices/:id/download` — download invoice

**Shared Tables**:
- `subscriptions` — id, userId, appId (om-ai | ai-omniverse), planId, status, billingCycle
- `usage_events` — id, userId, appId, eventType, value, timestamp
- `invoices` — id, subscriptionId, amount, status, pdfUrl

**Boundary**:
- Billing core là generic (không biết chi tiết pricing của từng app)
- Từng app định nghĩa planId riêng (om-ai-pro, omniverse-home, etc)
- Metering là ở tầng shared, tính toán giá riêng ở từng app

---

## 2.4 Provider Registry & Routing

**Service**: `omdala-provider-router` (Cloudflare Worker + D1)

**Endpoints**:
- `GET /v1/providers` — list all providers
- `GET /v1/providers/:id` — get provider details
- `GET /v1/providers/route?app=om-ai&capability=live-call` — route request to best provider

**Shared Tables**:
- `providers` — id, name, type (ai-engine, device-gateway, etc), capabilities, config
- `provider_routing_rules` — id, appId, capabilityId, providerId, priority, conditions
- `provider_usage_stats` — id, providerId, calls, errors, latency, timestamp

**Boundary**:
- Provider registry là trung tâm, giống marketplace
- Om AI gọi `/route?app=om-ai&capability=live-call` → get best AI provider
- Omniverse gọi `/route?app=omniverse&capability=device-gateway` → get best gateway provider

---

## 2.5 Workspace & Organization Identity

**Service**: `omdala-workspace` (Cloudflare Worker + D1)

**Endpoints**:
- `GET /v1/workspaces` — list user's workspaces
- `POST /v1/workspaces` — create workspace
- `GET /v1/workspaces/:id` — get workspace
- `PUT /v1/workspaces/:id` — update workspace
- `POST /v1/workspaces/:id/invite` — invite member

**Shared Tables**:
- `workspaces` — id, ownerId, name, type (family | organization | school | business), createdAt
- `workspace_members` — id, workspaceId, userId, role (owner | manager | member), joinedAt
- `workspace_invites` — id, workspaceId, email, token, expiresAt

**Boundary**:
- Workspace là lớp tổ chức (gia đình, công ty, trường học, v.v.)
- Từng app có thể dùng workspace scope (ví dụ: lesson progress per workspace cho Om AI)
- Không chứa app-specific data (rooms, personas, lessons, etc)

---

## 2.6 Notifications Core

**Service**: `omdala-notifications` (Cloudflare Worker + D1)

**Endpoints**:
- `GET /v1/notifications` — list notifications
- `POST /v1/notifications/subscribe` — subscribe to push notifications
- `POST /v1/notifications/mark-read/:id` — mark notification as read

**Shared Tables**:
- `notifications` — id, userId, type, title, body, appId, deeplink, readAt, createdAt
- `notification_subscriptions` — id, userId, endpoint, auth, p256dh (for Web Push)

**Boundary**:
- Notifications generic (không biết nội dung cụ thể)
- Từng app gửi notification qua `/push-notification?appId=om-ai&userId=...`

---

## 2.7 Analytics & Observability Core

**Service**: `omdala-analytics` (Cloudflare Worker + D1 + Tinybird/BigQuery)

**Endpoints**:
- `POST /v1/analytics/track` — track event
- `GET /v1/analytics/dashboard` — get summary dashboard
- `GET /v1/analytics/reports/:type` — get specific report

**Shared Tables**:
- `analytics_events` — id, userId, appId, eventName, properties, timestamp
- `analytics_sessions` — id, userId, appId, startTime, endTime, deviceInfo

**Boundary**:
- Event schema generic (appId, eventName, properties)
- Từng app định nghĩa event names riêng (om-ai.live-call-started, omniverse.device-controlled, etc)
- Dashboard tổng hợp, report riêng theo app

---

## 2.8 Design System & UI Tokens

**Package**: `@omdala/design-system` (NPM + monorepo)

**Contents**:
- CSS variables (colors, spacing, typography, shadows)
- UI component library (Button, Card, Modal, etc)
- Design tokens (shared across web, iOS, Android)
- Figma integration for design-code sync

**Boundary**:
- Shared design language
- Từng app có themed version (omniverse colors ≠ om-ai colors)
- Component behavior generic, styling theme-able

---

# 3. DOMAIN-SPECIFIC SERVICES (KHÔNG CHIA SẺ)

## 3.1 AI Omniverse Domain

**Services**:
- `omniverse-device-service` — device management
- `omniverse-room-service` — room/space management
- `omniverse-scene-service` — scene execution
- `omniverse-gateway-service` — gateway runtime
- `omniverse-automation-service` — automation rules
- `omniverse-physical-proof-service` — proof logging

**Databases**:
- Riêng D1 instance hoặc schema riêng

---

## 3.2 Om AI Domain

**Services**:
- `om-ai-live-service` — live call management
- `om-ai-persona-service` — persona library
- `om-ai-memory-service` — memory & recap
- `om-ai-curriculum-service` — lesson paths
- `om-ai-family-service` — family controls
- `om-ai-school-service` — school admin
- `om-ai-business-service` — business training

**Databases**:
- Riêng D1 instance hoặc schema riêng

---

# 4. COMMUNICATION BETWEEN APPS VIA SHARED CORE

## 4.1 Use Case: Om AI calls need to know workspace info

```
Om AI Live Service
  → /v1/auth/session (verify user)
  → /v1/account/profile (get user name)
  → /v1/workspaces?userId=... (get workspaces)
  → Proceed with live call
```

## 4.2 Use Case: Omniverse needs to notify user

```
Omniverse Device Service (device goes offline)
  → POST /v1/notifications (send notification)
  → Target: appId=ai-omniverse, userId=..., type=alert
  → User receives notification on device
```

## 4.3 Use Case: Both apps track usage for billing

```
Om AI Live Service (session ends)
  → POST /v1/billing/usage
     { appId: "om-ai", eventType: "call-session", value: 45 minutes }

Omniverse Device Service (device action executed)
  → POST /v1/billing/usage
     { appId: "ai-omniverse", eventType: "device-action", value: 1 }

Billing Core aggregates and charges per subscription.
```

---

# 5. API GATEWAY PATTERN FOR SHARED CORE

All shared core endpoints should be behind a single API gateway:

```
api.omdala.com/v1/auth/* → omdala-auth worker
api.omdala.com/v1/account/* → omdala-account worker
api.omdala.com/v1/billing/* → omdala-billing worker
api.omdala.com/v1/providers/* → omdala-provider-router worker
api.omdala.com/v1/workspaces/* → omdala-workspace worker
api.omdala.com/v1/notifications/* → omdala-notifications worker
api.omdala.com/v1/analytics/* → omdala-analytics worker

# App-specific APIs
api.omdala.com/v2/live/* → om-ai-live-service
api.omdala.com/v2/omniverse/* → omniverse-device-service
```

---

# 6. DATA ISOLATION RULES

## 6.1 User owns their data across apps

User ID `user-123` may have:
- Om AI subscriptions + sessions + memories
- AI Omniverse subscriptions + devices + rooms
- Workspace memberships spanning both apps

**All sharing happens via workspaceId or userId, never cross-app user data.**

## 6.2 Workspace-scoped data

School workspace `workspace-school-1`:
- Om AI: lesson assignments, progress, family members
- AI Omniverse: office devices, room bookings

**Data within workspace never crosses app boundary except via workspace identity.**

---

# 7. DEPLOYMENT ARCHITECTURE

```
Shared Core Layer (Cloudflare Workers)
├── omdala-auth-worker
├── omdala-account-worker
├── omdala-billing-worker
├── omdala-provider-router-worker
├── omdala-workspace-worker
├── omdala-notifications-worker
└── omdala-analytics-worker

Shared Database (Cloudflare D1)
├── users
├── sessions
├── user_profiles
├── subscriptions
├── providers
├── workspaces
├── notifications
└── analytics_events

App Domain Layer (Separate Workers)
├── om-ai-live-service (or iai.one integration)
├── om-ai-persona-service
├── om-ai-memory-service
├── omniverse-device-service
├── omniverse-room-service
├── omniverse-gateway-service
└── (others)

App Database (Separate D1 or managed DB)
├── om-ai DB (personas, sessions, curriculum, etc)
└── omniverse DB (devices, rooms, scenes, automation, etc)
```

---

# 8. SHARED CORE ROADMAP

## Phase 1 — Foundation Lock (Week 1)
- [ ] Finalize shared core services list
- [ ] Design API contracts
- [ ] Design DB schema

## Phase 2 — Implementation (Week 2-3)
- [ ] Implement auth service
- [ ] Implement account service
- [ ] Implement billing core
- [ ] Implement workspace service
- [ ] Test integration

## Phase 3 — Hardening (Week 4)
- [ ] Add authorization checks
- [ ] Add rate limiting
- [ ] Add observability
- [ ] Security audit

---

# 9. HARD BOUNDARIES

❌ **Shared Core CANNOT contain:**
- App-specific domain logic (personas, rooms, lessons, devices)
- App-specific UI (should be in app layer)
- App-specific analytics events (should route through generic events)

✅ **Shared Core CAN contain:**
- Generic identity (users, sessions, profiles)
- Generic billing (subscriptions, usage events)
- Generic workspace identity
- Generic notifications
- Generic analytics events (with appId + eventName only)
- Generic provider routing

---

# END OF FILE
