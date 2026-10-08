# TWO_TEAM_DEPENDENCY_BOARD_2026.md

**Version**: 1.0  
**Status**: ACTIVE DEPENDENCY BOARD  
**Date**: April 10, 2026  
**Owner**: Team 2 (Omniverse + System Reliability)

---

# 1. MUC TIEU

Board nay lock dependency giua Team 1 va Team 2 cho shared-core:

- `/v1/workspaces/*`
- `/v1/notifications/*`
- `/v1/analytics/*`

Muc tieu la Team 1 co the implement ma khong can doan schema.

---

# 2. CURRENT STATUS

| Dependency | Owner | Status | Note |
|---|---|---|---|
| Workspace schema | Team 2 | Proposed + Implemented baseline | Da co route + type contracts |
| Notifications schema | Team 2 | Proposed + Implemented baseline | Da co route + mark-read flow |
| Analytics envelope | Team 2 | Proposed + Implemented baseline | Da co track + dashboard summary |
| Team 1 sign-off | Team 1 | Pending | Can xac nhan naming/event list |

---

# 3. LOCKED CONTRACT (T2-1 BASELINE)

## 3.1 Workspaces

- `GET /v1/workspaces`
- `GET /v1/workspaces/:workspaceId`
- `POST /v1/workspaces`

Response envelope:

```json
{
  "ok": true,
  "data": {
    "schemaVersion": "2026-04-10",
    "workspaces": [],
    "total": 0
  }
}
```

Core fields:

- `workspace.id`
- `workspace.slug`
- `workspace.name`
- `workspace.type`: `family | organization | school | business`
- `workspace.ownerId`
- `workspace.members[]`: `userId`, `role`, `status`, `joinedAt`

## 3.2 Notifications

- `GET /v1/notifications`
- `POST /v1/notifications/mark-read/:notificationId`

Core fields:

- `notification.id`
- `notification.userId`
- `notification.workspaceId` (optional)
- `notification.type`: `system | workspace_invite | device_alert | billing_alert | reminder`
- `notification.title`
- `notification.body`
- `notification.appId`: `om-ai | omniverse | omdala-platform`
- `notification.deeplink`
- `notification.readAt` (optional)

## 3.3 Analytics

- `POST /v1/analytics/track`
- `GET /v1/analytics/dashboard`

Track payload baseline:

```json
{
  "appId": "omniverse",
  "eventName": "omniverse.device.state.changed",
  "source": "api",
  "workspaceId": "ws_xxx",
  "sessionId": "session_xxx",
  "properties": {}
}
```

Allowed:

- `appId`: `om-ai | omniverse | omdala-platform`
- `source`: `web | app | admin | docs | api | worker`

---

# 4. IMPLEMENTATION ANCHORS

- `packages/types/src/index.ts`
  - `WorkspaceRecord`
  - `SharedNotificationRecord`
  - `AnalyticsEventEnvelope`
- `services/api/src/index.ts`
  - shared-core routes under `/v1/workspaces`, `/v1/notifications`, `/v1/analytics`
- `services/api/src/shared-core-contracts.test.ts`
  - contract tests for bearer auth + workspace/notification/analytics endpoints

---

# 5. TEAM 1 ACTION NEEDED

Team 1 can review and sign-off these points:

1. `eventName` naming convention for Om AI usage events in shared analytics envelope
2. any additional required workspace fields for Om AI private beta
3. whether notification `type` list needs Om AI specific subtype now or post-beta

---

# 6. NEXT STEP AFTER SIGN-OFF

- Team 2 moves to `T2-2` (Omniverse product execution)
- Team 1 starts consuming locked shared-core contracts in DEV without waiting

---

# 7. TEAM 1 SIGN-OFF CHECKLIST (NGAN)

Team 1 chi can confirm 4 diem sau:

- [ ] Dong y `schemaVersion: "2026-04-10"` cho workspace/notifications/analytics baseline
- [ ] Dong y `analytics.eventName` namespace (prefix theo app: `om-ai.*`, `omniverse.*`, `omdala-platform.*`)
- [ ] Dong y danh sach `notification.type` baseline hien tai (bo sung subtype sau beta neu can)
- [ ] Dong y consume route set hien tai khong can cho them endpoint moi de bat dau DEV

Neu 4 muc tren pass, T2-1 duoc xem la locked cho private beta phase.

---

# END OF FILE
