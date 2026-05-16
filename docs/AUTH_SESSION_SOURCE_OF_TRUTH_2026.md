# AUTH_SESSION_SOURCE_OF_TRUTH_2026.md

**Version**: 1.0  
**Status**: CANONICAL AUTH / SESSION FLOW LOCK  
**Date**: April 9, 2026  
**Scope**: Team 1 auth/session source-of-truth across `apps/auth`, `apps/app`, and `services/api`

---

# 1. KẾT LUẬN CHUẨN

Từ thời điểm này, Team 1 phải hiểu auth/session như sau:

1. `auth.omdala.com` là **entry host chuẩn** cho đăng nhập
2. `api.omdala.com` là nơi:
   - gửi magic-link
   - verify token
   - exchange token thành cookie session
   - đọc session hiện tại
   - refresh / logout
3. `app.omdala.com` là nơi dùng session đã có sẵn, không phải host chuẩn để khởi tạo auth flow

---

# 2. NGUỒN SỰ THẬT

## 2.1 Source of truth cho auth entry

- `apps/auth`

## 2.2 Source of truth cho session server-state

- cookie HttpOnly scoped `.omdala.com`
- đọc qua `GET /v1/auth/session`

## 2.3 Source of truth cho token exchange

- `POST /v1/auth/session/exchange`

## 2.4 Source of truth cho app gate

- `apps/app/app/(dashboard)/DashboardAuthGate.tsx`
- gate phải tin `server session`, không tin local-only session

---

# 3. CHUỖI FLOW CHUẨN

```text
app.omdala.com
  -> redirect sang auth.omdala.com/login?next=...
auth.omdala.com
  -> POST /v1/auth/magic-link/request
email magic-link
  -> mở auth.omdala.com/login?token=...&next=...
auth.omdala.com
  -> POST /v1/auth/session/exchange
api.omdala.com
  -> set cookie .omdala.com
auth.omdala.com
  -> redirect về app.omdala.com/...
app.omdala.com
  -> GET /v1/auth/session để gate và unlock dashboard
```

---

# 4. QUY TẮC TEAM 1

1. Không tạo auth flow mới trực tiếp từ `app` nếu chưa có lý do rõ ràng.
2. Nếu `app` giữ fallback token handling, fallback đó vẫn phải đi qua `session/exchange`, không được chỉ verify token rồi tự coi là authenticated.
3. Local storage session chỉ là convenience mirror, không phải auth source-of-truth.
4. Mọi auth redirect phải quay về path nội bộ bắt đầu bằng `/`.

---

# 5. ENV / ORIGIN CHUẨN

- `OMDALA_AUTH_ORIGIN = https://auth.omdala.com`
- `OMDALA_APP_ORIGIN = https://app.omdala.com`
- `OMDALA_API_ORIGIN = https://api.omdala.com`
- `NEXT_PUBLIC_API_URL` chỉ là override runtime; nếu không có thì dùng `OMDALA_API_ORIGIN`

---

# 6. FILES TEAM 1 PHẢI XEM KHI ĐỤNG AUTH

- `apps/auth/app/login/AuthLoginForm.tsx`
- `apps/app/app/(auth)/login/page.tsx`
- `apps/app/app/(auth)/login/MagicLinkLoginForm.tsx`
- `apps/app/app/(dashboard)/DashboardAuthGate.tsx`
- `apps/app/lib/session-client.ts`
- `apps/app/lib/api-client.ts`
- `services/api/src/index.ts`

---

# 7. KẾT LUẬN

Đừng để Team 1 đi hai luồng:

- một luồng cookie server session
- một luồng local-only pseudo session

Luồng chuẩn duy nhất là:

**auth host -> api exchange -> cookie session -> app gate**

---

# END OF FILE
