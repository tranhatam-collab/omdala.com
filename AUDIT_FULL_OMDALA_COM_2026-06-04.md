# OMDALA.COM — Audit Toàn Bộ 100%
**Ngày audit:** 2026-06-04
**Scope:** `services/api/`, `apps/web/`, `apps/app/`, `apps/admin/`, `apps/auth/`
**Không bao gồm:** Bất kỳ dự án nào khác

---

## 1. Executive Summary

| Layer | Score | Trạng thái |
|-------|-------|------------|
| Backend Auth (`services/api/`) | 6/10 | Flow đầy đủ nhưng thiếu `/v1/auth/check`, logout không revoke |
| App Dashboard (`apps/app/`) | 2/10 | 100% mock data, billing hết hạn, landing SEO = 0 |
| Admin Panel (`apps/admin/`) | 3/10 | Mock session, mock moderation, hardcode `en` |
| Public Web (`apps/web/`) | 7/10 | SEO metadata OK, sitemap OK, `LocaleLink` thiếu `hreflang` |
| Auth Surface (`apps/auth/`) | 2/10 | Chỉ redirect, không xử lý magic link token |

**Tổng kết:** Hệ thống chưa production-ready. Backend có đủ routes nhưng frontend chưa kết nối. Auth surface `apps/auth/` chưa hoàn thiện. Dashboard hoàn toàn là mock data.

---

## 2. Backend `services/api/` — Auth & API Flow

### 2.1 Các routes đã triển khai

```
POST /v1/auth/access-request              — Yêu cầu early access
POST /v1/auth/magic-link/request            — Gửi magic link email
GET  /v1/auth/magic-link?token=&next=       — Verify magic token
POST /v1/auth/session/exchange              — Đổi magic token → session cookies
GET  /v1/auth/session                       — Lấy session hiện tại
POST /v1/auth/refresh                       — Refresh access token
POST /v1/auth/logout                        — Clear cookies (client-side only)
GET  /v1/auth/google/start                  — Google OAuth init
GET  /v1/auth/google/callback               — Google OAuth callback
GET  /v1/account/profile                    — Profile user (auth required)
```

### 2.2 🔴 P0 — Không có `/v1/auth/check` và `/v1/auth/me`

`@/Users/tranhatam/Documents/Devnewproject/omdala.com/services/api/src/index.ts`

Không có endpoint nào trả về trạng thái bảo vệ (is_unlocked), vai trò (roles), hoặc gói dịch vụ (plan). Dashboard frontend cần endpoint này để quyết định route guards.

**Đề xuất:** Tạo `GET /v1/auth/me` trả về:
```json
{
  "authenticated": true,
  "email": "...",
  "displayName": "...",
  "roles": ["member"],
  "plan": "free",
  "is_unlocked": true
}
```

### 2.3 🔴 P0 — Magic link flow chưa kết nối đến `apps/auth/`

`@/Users/tranhatam/Documents/Devnewproject/omdala.com/apps/app/app/(auth)/login/page.tsx:6-7`
```tsx
const draft = createPasswordlessDraft();
const authEntry = `https://auth.omdala.com/login?next=${encodeURIComponent(draft.redirectTo)}`;
```

`@/Users/tranhatam/Documents/Devnewproject/omdala.com/apps/auth/app/page.tsx:1-6`
```tsx
import { redirect } from "next/navigation";
export default function AuthHomePage() {
  redirect("/login");
}
```

**Vấn đề:**
1. `apps/auth/app/page.tsx` chỉ redirect `/login` — không xử lý query param `?token=` từ email
2. Magic link gửi user đến `auth.omdala.com/login?token=xxx&next=xxx`
3. Auth surface phải verify token qua `/v1/auth/magic-link` và redirect về app, nhưng không có code xử lý

**Hệ quả:** User click magic link trong email → đến trang login → không có gì xảy ra. Flow đứt đoạn.

### 2.4 🟠 P1 — Logout không revoke server-side

`@/Users/tranhatam/Documents/Devnewproject/omdala.com/services/api/src/index.ts:2533-2536`
```ts
app.post("/v1/auth/logout", async (c) => {
  // Stateless MVP: no server-side revocation store.
  // Client must clear tokens on their side.
  // Always returns 200 so the client can safely proceed with local cleanup.
});
```

Access token TTL = 60 phút, refresh token TTL = 7 ngày. Sau logout, token vẫn valid đến hết TTL. Nếu user logout ở máy công cộng, attacker có thể dùng token còn lại.

**Fix:** Thêm token blacklist table (D1) hoặc giảm access token TTL xuống 5 phút + sliding refresh.

### 2.5 🟠 P1 — MAGIC_LINK_SECRET dùng cho cả hai mục đích

`@/Users/tranhatam/Documents/Devnewproject/omdala.com/services/api/src/index.ts:256-261`
```ts
async function createMagicLinkToken(env: ApiBindings, payload: MagicLinkPayload) {
  if (!env.MAGIC_LINK_SECRET) { throw new Error("..."); }
  // ... HMAC sign
}
```

`@/Users/tranhatam/Documents/Devnewproject/omdala.com/services/api/src/index.ts:319-324`
```ts
async function createSessionToken(env: ApiBindings, payload: SessionTokenPayload) {
  if (!env.MAGIC_LINK_SECRET) { throw new Error("..."); }
  // ... HMAC sign
}
```

Cùng 1 secret cho magic link và session token. Nếu secret bị lộ, cả hai hệ thống đều compromise.

**Fix:** Tách thành `MAGIC_LINK_SECRET` và `SESSION_SECRET` riêng biệt.

### 2.6 🟡 P2 — Missing `x-csrf-token` enforcement

`@/Users/tranhatam/Documents/Devnewproject/omdala.com/services/api/src/index.ts:1377`
```ts
"x-csrf-token",
```

CORS cho phép header `x-csrf-token` nhưng không thấy middleware require CSRF token trên state-changing routes (POST /v1/auth/session/exchange, POST /v1/auth/magic-link/request).

---

## 3. `apps/app/` — Member Dashboard & OMCode

### 3.1 🔴 P0 — 100% Mock Data

`@/Users/tranhatam/Documents/Devnewproject/omdala.com/apps/app/lib/runtime-data.ts:31-69`
```ts
export function getDashboardSnapshot() {
  const session = getMockSession()          // MOCK
  const nodes = listMockNodes()             // MOCK
  const resources = listMockResources()     // MOCK
  const offers = listMockOffers()           // MOCK
  const requests = listMockRequests()       // MOCK
  const proofs = listMockProofs()           // MOCK
  // ...
}
```

Tất cả 7 workspace functions đều dùng mock data:
- `getDashboardSnapshot()`
- `getAccountBillingSnapshot()`
- `getNodeWorkspace()`
- `getResourceWorkspace()`
- `getTrustWorkspace()`
- `getOfferWorkspace()`
- `getRequestWorkspace()`

`@/Users/tranhatam/Documents/Devnewproject/omdala.com/apps/app/lib/mock-data.ts:1-23`
```ts
export {
  listMockNodes,
  listMockOffers,
  listMockProofs,
  listMockRequests,
  listMockResources,
  // ...
} from '@omdala/core'
```

Mock data import từ `@omdala/core` — hoàn toàn static arrays.

### 3.2 🔴 P0 — Billing subscription đã hết hạn

`@/Users/tranhatam/Documents/Devnewproject/omdala.com/apps/app/lib/runtime-data.ts:83-90`
```ts
const subscription: OmAiBillingSubscription = {
  id: 'sub-om-ai-pro-demo',
  appId: OM_AI_APP_ID,
  planId: OM_AI_PLAN_IDS.pro,
  status: 'active',
  billingCycle: 'monthly',
  expiresAt: '2026-05-09T00:00:00.000Z',
}
```

Ngày audit 2026-06-04 — subscription đã hết hạn 26 ngày nhưng vẫn ghi status `'active'`.

### 3.3 🔴 P0 — OMCode landing page không có SEO

`@/Users/tranhatam/Documents/Devnewproject/omdala.com/apps/app/app/page.tsx:1`
```tsx
'use client'
```

469 dòng hardcode copy cho 6 ngôn ngữ (en, vi, zh, es, ja, ko). Không export `metadata`. Next.js không sinh `<head>` cho client components. Google không index được.

**Fix:** Chuyển thành Server Component, tách copy ra JSON files, dùng `buildLocalizedMetadata`.

### 3.4 🟠 P1 — Dashboard UI hiển thị mock data như thật

`@/Users/tranhatam/Documents/Devnewproject/omdala.com/apps/app/app/(dashboard)/dashboard/page.tsx:12`
```tsx
<h1>Welcome back, {snapshot.session.user.displayName}.</h1>
```

`displayName` = `"OM AI Demo User"` (mock). User thấy tên fake trên dashboard.

### 3.5 🟠 P1 — Suggestions dùng mock data

`@/Users/tranhatam/Documents/Devnewproject/omdala.com/apps/app/app/(dashboard)/dashboard/page.tsx:90-99`
```tsx
{snapshot.suggestions.map((suggestion) => (
  <article key={suggestion.id} className="entity-card">
    <strong>{suggestion.score}</strong>
    <h3>{suggestion.title}</h3>
    <p className="app-copy">{suggestion.summary}</p>
  </article>
))}
```

Suggestions là static array từ `@omdala/matching-service` (mock). Không phải real-time AI matching.

---

## 4. `apps/admin/` — Admin Panel

### 4.1 🔴 P0 — Mock Session

`@/Users/tranhatam/Documents/Devnewproject/omdala.com/apps/admin/app/layout.tsx:35`
```ts
const session = getMockAdminSession()
const canAccessAdmin = hasRequiredRole(session, ['admin', 'system'])
```

Admin layout dùng mock session. Không gọi `/v1/auth/session` thật.

### 4.2 🔴 P0 — Mock Moderation Cases

`@/Users/tranhatam/Documents/Devnewproject/omdala.com/apps/admin/app/page.tsx:10`
```ts
const cases = listModerationCases()  // MOCK
```

Tất cả cases, openCases, highSeverity đều từ static data.

### 4.3 🟠 P1 — Hardcode language = 'en'

`@/Users/tranhatam/Documents/Devnewproject/omdala.com/apps/admin/app/page.tsx:9`
```ts
const language: OmdalaLanguage = 'en'
```

Không có bilingual routing `/[lang]/`. Không có Vietnamese admin UI. Admin chỉ chạy bằng tiếng Anh.

### 4.4 🟡 P2 — Navigation hoàn thiện nhưng chưa có route guards thật

Navigation đầy đủ: Overview, Providers, Nodes, Offers, Requests, Proofs, Verifications. Nhưng `canAccessAdmin` check dựa trên mock session role cố định — không phản ánh production ACL.

---

## 5. `apps/web/` — Public Website & Bilingual

### 5.1 ✅ Đã tốt

- **Metadata per page:** Tất cả 10 pages có `buildLocalizedMetadata()` — đã fix từ lần trước
- **Sitemap động:** `sitemap.ts` với `buildLanguageAlternates` cho tất cả pages
- **Robots động:** `robots.ts` với `isIndexableBuild`
- **Bilingual routing:** `/[lang]/` + `generateStaticParams` cho `en` và `vi`
- **Logo alt:** `getBrandLogoAlt(language)` dùng trong header và footer

`@/Users/tranhatam/Documents/Devnewproject/omdala.com/apps/web/app/WebChrome.tsx:45`
```tsx
<Image src="/logo.svg" alt={getBrandLogoAlt(language)} width={24} height={24} />
```

### 5.2 🟠 P1 — LocaleLink không có `hreflang` attribute

`@/Users/tranhatam/Documents/Devnewproject/omdala.com/apps/web/app/components/LocaleLink.tsx:16-28`
```tsx
export function LocaleLink({ href, language = "en", children, ...props }) {
  const localizedHref = withLanguagePath(href, language);
  return (
    <Link href={localizedHref} {...props}>
      {children}
    </Link>
  );
}
```

`LocaleLink` render `<a>` tags nhưng không thêm `hreflang` attribute. Theo Google best practices, internal links giữa các phiên bản ngôn ngữ nên có `hreflang` để bot hiểu rõ mối quan hệ.

**Fix:**
```tsx
<Link href={localizedHref} {...props} hrefLang={language}>
```

### 5.3 🟡 P2 — content/en.json và content/vi.json

`@/Users/tranhatam/Documents/Devnewproject/omdala.com/apps/web/app/lib/bilingual-source.ts:3-4`
```ts
import enSource from "../../../../content/en.json";
import viSource from "../../../../content/vi.json";
```

Source bilingual nằm ở root `content/` (ngoài `apps/web/`). Đây là monorepo pattern chuẩn nhưng cần đảm bảo file JSON được copy vào build output. Cần verify `content/en.json` và `content/vi.json` tồn tại và không bị thiếu key.

### 5.4 🟡 P2 — `_headers` CSP

`@/Users/tranhatam/Documents/Devnewproject/omdala.com/apps/web/public/_headers` — chưa verify nội dung sau fix. Cần đảm bảo có:
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';
```

---

## 6. `apps/auth/` — Auth Surface

### 6.1 🔴 P0 — Chỉ redirect, không xử lý token

`@/Users/tranhatam/Documents/Devnewproject/omdala.com/apps/auth/app/page.tsx:1-6`
```tsx
import { redirect } from "next/navigation";
export default function AuthHomePage() {
  redirect("/login");
}
```

Auth surface là Next.js app riêng biệt deploy tại `auth.omdala.com`. Nhưng:
1. `/` redirect `/login`
2. Không có route `/login/page.tsx` (chưa tìm thấy — cần verify)
3. Không xử lý `?token=` từ magic link email
4. Không gọi `/v1/auth/magic-link` để verify token

**Auth flow đứt đoạn hoàn toàn.** User không thể login bằng magic link.

---

## 7. Action Items — Ưu tiên

### Wave 1 — Khẩn cấp (24h)

| # | Task | File | Impact |
|---|------|------|--------|
| 1 | **Tạo `apps/auth/app/login/page.tsx`** xử lý `?token=` gọi `/v1/auth/magic-link` và redirect | `apps/auth/app/login/page.tsx` | 🔴 User không login được |
| 2 | **Tạo `GET /v1/auth/me`** trả `is_unlocked`, `roles`, `plan` | `services/api/src/index.ts` | 🔴 Dashboard không biết trạng thái user |
| 3 | **Sửa mock data** `expiresAt` trong `runtime-data.ts` hoặc đổi thành real API call | `apps/app/lib/runtime-data.ts` | 🔴 Billing hiển thị sai |
| 4 | **Thêm `hrefLang`** vào `LocaleLink` | `apps/web/app/components/LocaleLink.tsx` | 🟠 SEO bilingual |

### Wave 2 — Cao (48h)

| # | Task | File | Impact |
|---|------|------|--------|
| 5 | Kết nối `apps/app` dashboard với real API endpoints | `apps/app/lib/runtime-data.ts` | 🔴 Dashboard không có data thật |
| 6 | Chuyển OMCode landing từ 'use client' → Server Component + metadata | `apps/app/app/page.tsx` | 🔴 Không SEO |
| 7 | Kết nối `apps/admin` với real session và moderation API | `apps/admin/app/layout.tsx`, `page.tsx` | 🟠 Admin không có data thật |
| 8 | Tách `MAGIC_LINK_SECRET` và `SESSION_SECRET` | `services/api/src/index.ts` | 🟠 Security risk |

### Wave 3 — Trung bình (3-5 ngày)

| # | Task | File | Impact |
|---|------|------|--------|
| 9 | Thêm server-side token revocation cho logout | `services/api/src/index.ts` + D1 table | 🟠 Security |
| 10 | Thêm CSRF middleware cho state-changing routes | `services/api/src/index.ts` | 🟡 Security |
| 11 | Bilingual cho Admin Panel (`/vi/admin`) | `apps/admin/app/` | 🟡 UX |
| 12 | Verify `content/en.json` và `content/vi.json` không thiếu key | `content/*.json` | 🟡 QA |

---

## 8. Files đã audit (12 files)

- `@/Users/tranhatam/Documents/Devnewproject/omdala.com/services/api/src/index.ts`
- `@/Users/tranhatam/Documents/Devnewproject/omdala.com/apps/app/lib/runtime-data.ts`
- `@/Users/tranhatam/Documents/Devnewproject/omdala.com/apps/app/lib/mock-data.ts`
- `@/Users/tranhatam/Documents/Devnewproject/omdala.com/apps/app/app/(dashboard)/dashboard/page.tsx`
- `@/Users/tranhatam/Documents/Devnewproject/omdala.com/apps/app/app/page.tsx`
- `@/Users/tranhatam/Documents/Devnewproject/omdala.com/apps/admin/app/page.tsx`
- `@/Users/tranhatam/Documents/Devnewproject/omdala.com/apps/admin/app/layout.tsx`
- `@/Users/tranhatam/Documents/Devnewproject/omdala.com/apps/web/app/WebChrome.tsx`
- `@/Users/tranhatam/Documents/Devnewproject/omdala.com/apps/web/app/components/LocaleLink.tsx`
- `@/Users/tranhatam/Documents/Devnewproject/omdala.com/apps/web/app/lib/bilingual-source.ts`
- `@/Users/tranhatam/Documents/Devnewproject/omdala.com/apps/auth/app/page.tsx`
- `@/Users/tranhatam/Documents/Devnewproject/omdala.com/apps/app/app/(auth)/login/page.tsx`

---

**Kết luận:** omdala.com có architecture đúng hướng (isolated auth, bilingual routing, SEO metadata) nhưng **tất cả frontend apps đang ở trạng thái mock data**. Backend routes đã đầy đủ nhưng auth surface chưa kết nối. Cần Wave 1 trong 24h để user có thể login và dashboard có data thật.
