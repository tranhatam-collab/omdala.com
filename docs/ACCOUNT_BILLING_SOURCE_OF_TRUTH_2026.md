# ACCOUNT_BILLING_SOURCE_OF_TRUTH_2026.md

**Version**: 1.2  
**Status**: CANONICAL TEAM 1 ACCOUNT / BILLING LOCK  
**Date**: April 9, 2026  
**Scope**: Source-of-truth cho `account/profile + billing/subscription` của Team 1

---

# 1. MỤC ĐÍCH

File này khóa `T1-2` cho Team 1.

Mục tiêu:

- chốt ownership
- chốt API contracts
- chốt data boundaries
- chốt những gì Team 1 được làm và chưa được làm
- tránh việc Team 1 suy diễn từ nhiều docs rời

---

# 2. OWNERSHIP CHUẨN

## Team 1 sở hữu

- `account/profile`
- `account/preferences`
- `billing/subscriptions`
- `billing/usage`
- app-facing integration cho Om AI
- UI assumptions ở `apps/app` và `om-ai.omdala.com` khi đụng account/billing

## Team 1 không sở hữu

- workspace schema
- notifications schema
- analytics envelope chung
- Omniverse pricing logic
- release/infra hardening chung

Các phần trên thuộc Team 2 hoặc shared dependency lane.

---

# 3. CONTRACT CHUẨN

Nguồn chính:

- `docs/OMDALA_SHARED_PLATFORM_CORE_BOUNDARY_2026.md`
- `docs/OM_AI_MASTER_DEV_PLAN_2026.md`
- `docs/TWO_TEAM_PARALLEL_DEV_MASTER_PLAN_2026-04-09.md`

Contract dùng cho Team 1:

## 3.1 Account

```text
GET /v1/account/profile
PUT /v1/account/profile
GET /v1/account/preferences
PUT /v1/account/preferences
GET /v1/account/devices
```

## 3.2 Billing

```text
GET /v1/billing/subscriptions
POST /v1/billing/subscriptions
PUT /v1/billing/subscriptions/:id
DELETE /v1/billing/subscriptions/:id
GET /v1/billing/usage
POST /v1/billing/invoices/:id/download
```

Hiện Team 1 đã nối live API-facing path tối thiểu cho:

- `GET /v1/account/profile`
- `PUT /v1/account/profile`
- `GET /v1/account/preferences`
- `PUT /v1/account/preferences`
- `GET /v1/billing/subscriptions`
- `GET /v1/billing/usage`

## 3.3 Om AI-specific billing usage

Om AI dùng `billing core`, nhưng plan/product logic vẫn riêng:

- `appId = om-ai`
- `planId = om-ai-pro` hoặc plan Om AI khác
- usage events phản ánh call usage, recap usage, hoặc metered premium behavior

---

# 4. DATA BOUNDARY CHUẨN

## 4.1 Account tables

```text
user_profiles
user_preferences
user_devices
```

Account layer chỉ giữ:

- profile chung
- preferences chung
- linked devices/account surfaces

Không giữ:

- personas
- lessons
- calls
- recap
- memory
- rooms / devices / scenes

## 4.2 Billing tables

```text
subscriptions
usage_events
invoices
```

Billing core là generic.

Không encode trực tiếp business logic sâu của từng app vào shared billing tables.

---

# 5. TEAM 1 IMPLEMENTATION RULES

1. Team 1 được khóa contract trước, không cần chờ full implementation của Team 2.
2. Om AI chỉ dùng `account/profile` và `billing` qua shared contracts, không nhúng logic billing local tùy tiện.
3. Team 1 định nghĩa:
   - `appId`
   - `planId`
   - event names cho usage
4. Team 1 không đổi schema generic của billing nếu chưa sync dependency board.

---

# 6. MINIMUM SHAPE TEAM 1 CẦN

## 6.1 Account profile response

```json
{
  "id": "user_123",
  "email": "operator@omdala.com",
  "displayName": "OMDALA Operator",
  "avatar": "https://...",
  "bio": "string",
  "timezone": "Asia/Ho_Chi_Minh",
  "locale": "vi"
}
```

## 6.2 Preferences response

```json
{
  "language": "vi",
  "theme": "system",
  "notifications": {
    "email": true,
    "push": true
  }
}
```

## 6.3 Subscription response

```json
{
  "id": "sub_123",
  "appId": "om-ai",
  "planId": "om-ai-pro",
  "status": "active",
  "billingCycle": "monthly",
  "expiresAt": "2026-05-09T00:00:00.000Z"
}
```

## 6.4 Usage response

```json
{
  "appId": "om-ai",
  "quota": {
    "callMinutesDaily": 30
  },
  "used": {
    "callMinutesToday": 12
  },
  "remaining": {
    "callMinutesToday": 18
  }
}
```

---

# 7. OM AI EVENT NAMING CHUẨN

Tối thiểu Team 1 nên dùng:

- `om-ai.call.started`
- `om-ai.call.ended`
- `om-ai.recap.generated`
- `om-ai.subscription.changed`
- `om-ai.usage.minute-recorded`

Lưu ý:

- event names này thuộc Team 1 ownership
- envelope analytics chung vẫn phải sync với Team 2

---

# 8. FILES TEAM 1 PHẢI NHÌN KHI LÀM T1-2

- `docs/OMDALA_SHARED_PLATFORM_CORE_BOUNDARY_2026.md`
- `docs/OM_AI_MASTER_DEV_PLAN_2026.md`
- `docs/TWO_TEAM_PARALLEL_DEV_MASTER_PLAN_2026-04-09.md`
- `docs/TEAM_1_PROGRESS_2026.md`
- `apps/app/app/(dashboard)/profile/page.tsx`
- `apps/app/app/(dashboard)/settings/page.tsx`
- `apps/app/lib/runtime-data.ts`
- `apps/app/lib/account-billing-client.ts`
- `packages/core/src/om-ai-billing.ts`
- `packages/types/src/om-ai.ts`

## 8.1 Implementation anchors đã khóa

`T1-2` hiện đã có implementation anchors dùng để giữ source-of-truth đồng bộ giữa docs và app shell:

- `packages/core/src/om-ai-billing.ts`
- `packages/types/src/om-ai.ts`
- `apps/app/lib/runtime-data.ts`
- `apps/app/lib/account-billing-client.ts`
- `apps/app/app/(dashboard)/profile/page.tsx`
- `apps/app/app/(dashboard)/settings/page.tsx`
- `services/api/src/index.ts`

Các file này hiện được xem là lớp implementation reference chính cho Om AI account/profile + billing/subscription trong app shell.

---

# 9. DEFINITION OF DONE CHO T1-2

`T1-2` chỉ được xem là xong khi:

1. account/billing ownership rõ
2. account/billing contracts rõ
3. Om AI `appId` + `planId` + usage naming rõ
4. Team 1 không còn phải đoán billing/profile shape
5. docs/board đã phản ánh đúng trạng thái đó

---

# 10. KẾT LUẬN

Team 1 làm `account/profile + billing/subscription` theo hướng:

- shared contract rõ
- Om AI product logic rõ
- không trộn workspace/notifications/analytics vào cùng batch

Đây là cách để T1-2 đi nhanh mà không đâm Team 2.

---

# END OF FILE
