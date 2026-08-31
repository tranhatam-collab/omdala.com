# TEAM_1_PROGRESS_2026.md

**Version**: 1.0  
**Status**: ACTIVE TEAM 1 PROGRESS BOARD  
**Date**: April 9, 2026  
**Team Name**: Team 1 — Om AI + User Core  
**Execution Name**: Team Om AI  
**Owner Scope**: Om AI product + auth/account/billing/provider routing + root auth/app user journey  
**Primary Reference**: `docs/TWO_TEAM_PARALLEL_DEV_MASTER_PLAN_2026-04-09.md`

---

# 1. MỤC ĐÍCH

File này là bảng tiến độ sống của Team 1.

Dùng để:

- theo dõi tiến độ thực tế của Team 1
- biết rõ Team 1 đang làm gì
- biết rõ Team 1 đang bị chặn ở đâu
- biết Team 2 cần phản hồi gì
- giữ cùng một format cập nhật hằng ngày

Hard rule:

- không biến file này thành nơi brainstorm
- chỉ ghi thông tin thực thi
- mỗi cập nhật phải ngắn, rõ, kiểm chứng được

---

# 2. PHẠM VI TEAM 1

Team 1 chịu trách nhiệm cho:

- `om-ai.omdala.com/`
- `apps/auth/`
- `apps/app/`
- user-facing bridges trong `apps/web/` khi liên quan auth/app funnel
- `services/auth/`
- `services/ai/`
- phần auth/session/intake/magic-link trong `services/api/`
- phần shared trong `packages/core/` liên quan auth, locale, session, API client, provider contracts

Team 1 không sở hữu:

- Omniverse domain runtime
- D1/device/scene/automation của Omniverse
- admin/docs/release hardening tổng thể
- CI/CD chung nếu thay đổi đó chưa sync với Team 2

---

# 3. MỤC TIÊU CỦA TEAM 1

Đích của Team 1 là kéo:

- Om AI tới `private beta path`
- auth/session tới mức ổn định
- billing / usage / provider contracts tới mức dùng thật
- root user journey (`web -> auth -> app -> api`) không còn blocker lớn

Definition of done ở mức Team 1:

1. Om AI MVP path chạy được
2. auth/session ổn định
3. billing/usage path rõ
4. provider path rõ
5. build/typecheck pass ở phạm vi Team 1
6. có smoke path cho các flow chính

---

# 4. BASELINE HIỆN TẠI

## 4.1 Tỷ lệ công việc

Theo `TWO_TEAM_PARALLEL_DEV_MASTER_PLAN_2026-04-09.md`:

- Team 1 nắm **48% của phần còn lại**
- tương đương khoảng **20/42 điểm công việc còn lại**

## 4.2 Đánh giá mở đầu của Team 1

Tôi đề xuất baseline Team 1 hiện tại như sau:

| Lane | Trọng tâm | Baseline |
|---|---|---:|
| Lane 1 | Om AI product core | 68% |
| Lane 2 | Auth + session | 68% |
| Lane 3 | Account + billing | 62% |
| Lane 4 | Provider routing + AI service contracts | 68% |
| Lane 5 | Root user surfaces (`apps/auth`, `apps/app`) | 70% |

**Team 1 weighted progress baseline: 70%**

Lưu ý:

- đây là baseline thực thi, không phải % của toàn dự án
- mỗi lane chỉ tăng khi có code, verify hoặc smoke path thật

---

# 5. LANES CỦA TEAM 1

## Lane 1 — Om AI product core

Phạm vi:

- Om AI boundary clarity
- persona flow
- live call flow
- recap
- memory
- subscription path

Done when:

- Om AI không còn trộn OmCode / Omniverse
- flow MVP được khóa và chạy thành đường thẳng rõ ràng

## Lane 2 — Auth + session

Phạm vi:

- `apps/auth/`
- auth contracts
- session flow
- magic-link
- redirect consistency
- cookie/session behavior

Done when:

- login/session flow ổn định
- env / domain / callback path rõ

## Lane 3 — Account + billing

Phạm vi:

- account/profile
- preferences
- subscription plans
- usage metering contracts
- invoice / billing integration path

Done when:

- Om AI có usage/billing path rõ
- account/profile không còn mơ hồ ownership

## Lane 4 — Provider routing + AI contracts

Phạm vi:

- provider registry
- route-to-provider rules
- AI/live capability mapping
- bridge giữa `services/ai` và app/domain usage

Done when:

- Team 1 có thể gọi provider layer mà không tự suy diễn
- contract đủ rõ cho scale phase sau

## Lane 5 — Root user surfaces

Phạm vi:

- `apps/app/`
- `apps/auth/`
- phần `apps/web/` liên quan entry/funnel
- API client consistency
- locale/session/app shell consistency

Done when:

- user journey liền mạch
- root surfaces không còn là blocker cho Om AI

---

# 6. BATCH EXECUTION CỦA TEAM 1

## Batch T1-0 — Boundary lock

Tasks:

- xác nhận `Om AI != OmCode`
- xác nhận `Om AI != Omniverse`
- rà strings / docs entry points / README của Om AI
- khóa source of truth cho Team 1

Status: `IN PROGRESS`

## Batch T1-1 — Auth and session usable

Tasks:

- chốt `/v1/auth/*`
- session persistence
- redirect flow
- environment consistency
- smoke path cho login/session

Status: `DONE`

## Batch T1-2 — Account + billing usable

Tasks:

- account/profile contracts
- billing/subscription contracts
- usage events
- integration assumptions cho Om AI

Status: `DONE`

## Batch T1-3 — Om AI MVP path

Tasks:

- persona browsing
- live call flow
- recap/memory flow
- subscription flow
- web/admin readiness tối thiểu

Status: `PENDING`

## Batch T1-4 — Private beta hardening

Tasks:

- smoke tests
- fallback/error states
- support path
- release checklist riêng của Team 1

Status: `PENDING`

---

# 7. CURRENT BOARD

## 7.1 Active work

| Item | Owner | Status | Notes |
|---|---|---|---|
| Om AI boundary clarification | Team Om AI | Active | Đã khóa canonical entry docs, hoàn tất legacy cleanup batch 1 + batch 2, và nhận tiếp gói Team Om AI gồm dependency, boundary, reuse, phased integration backlog |
| Auth/session source-of-truth lock | Auth lane | Done | Đã khóa theo `docs/AUTH_SESSION_SOURCE_OF_TRUTH_2026.md`; build/typecheck của `@omdala/auth` và `@omdala/app` đã pass |
| Account/billing source-of-truth lock | Platform-facing lane | Done | Đã khóa contract + implementation anchors theo `docs/ACCOUNT_BILLING_SOURCE_OF_TRUTH_2026.md`, `packages/core/src/om-ai-billing.ts`, `packages/types/src/om-ai.ts`, `apps/app/lib/runtime-data.ts`, `apps/app/lib/account-billing-client.ts`, `apps/app/app/(dashboard)/profile/page.tsx`, `apps/app/app/(dashboard)/settings/page.tsx`, `services/api/src/index.ts` |
| Account/billing smoke path | Root surfaces lane | Done | Đã pass local smoke theo `E2E_BASE_URL=http://127.0.0.1:3001` cho 4 test auth/profile/settings và external smoke `https://app.omdala.com` sau deploy sync |
| Provider routing contract lane | Lane 4 | Done | Đã thêm provider store `services/api/src/provider-registry.ts`, giữ compatibility với `resolveOmAiProviderRoute`, mở thêm route `/v1/providers/observability`, app client `getProviderObservability`, và dashboard admin `apps/admin/app/providers/page.tsx` |
| Provider routing API contract tests | Lane 4 | Done | `services/api/src/provider-routing.test.ts` đã tăng lên 8 tests: registry auth, observability auth, unsupported app, invalid capability, invalid query matrix precedence, runtime-scored route, all-providers-down, fallback-null |
| Release/deploy drift fix | Root release lane | Done | Đã khóa lại default branch trong `scripts/release_deploy.sh` (`APP_BRANCH=main`, `WEB_BRANCH=main`, `AUTH_BRANCH=production`), hoàn tất deploy production mới cho `web/app/auth`, và rerun smoke external pass |
| Release command standardization | Root release lane | Done | Đã thêm explicit scripts `release:deploy:{api|app|auth|web}:{prod|preview}` trong `package.json` và command sheet ngắn ở `docs/RELEASE_COMMAND_SHEET.md` để tránh nhầm branch |
| UI language sync | Shared UI lane | Done | Đã đồng bộ 6 ngôn ngữ cho app/auth/docs/homepage/contact/shared switchers + `DocumentLanguageSync`, vá batch legacy public content trong `apps/web/app/lib/content.ts`, và bỏ label mixed-language ở contact/access forms |
| Web locale routing + HTML-first i18n | Root web locale lane | Done | `apps/web` đã chuyển từ `?lang=` sang locale path `/{lang}` cho public pages, thêm localized metadata/canonical/hreflang, post-build patch `html lang`, deploy production mới, và xác nhận live `omdala.com/{vi,zh,es,ja,ko}` trả HTML đúng ngôn ngữ ngay từ response đầu tiên |
| Web release smoke canonicalization | Root release lane | Done | Đã đổi `apps/web/package.json` và root `package.json` để smoke production trỏ về canonical domain `https://omdala.com` thay vì `production.omdala-web.pages.dev`; rerun `pnpm test:web:e2e:release` đã pass ngoài sandbox |
| Om AI live MVP web bridge | Lane 1 | Done | `om-ai.omdala.com/web` da noi persona detail, memory profile, va plan upgrade vao `LiveExecutionCard`; da rerun compile ngoai PTY bang Node 20, `typecheck` pass va `vite build` pass sach |

## 7.1.1 Verification snapshot

- `@omdala/api` typecheck: ✅ pass
- `@omdala/core` typecheck: ✅ pass
- `@omdala/types` typecheck: ✅ pass
- `@omdala/ai-service` typecheck: ✅ pass
- `@omdala/auth` typecheck: ✅ pass
- `@omdala/app` typecheck: ✅ pass
- `@omdala/web` typecheck: ✅ pass (sau cleanup generated `.next/types/* 2/3/4`)
- `@omdala/docs` typecheck: ✅ pass (sau cleanup generated `.next/types/* 2/3/4`)
- `@omdala/admin` typecheck: ✅ pass (sau cleanup generated `.next/types/* 2/3/4`)
- `@omdala/app` smoke coverage for account/billing + provider routing: ✅ pass local (bao gồm API-live + fallback-case + runtime-score assertions)
- `@omdala/api` provider-routing tests: ✅ pass (`vitest run src/provider-routing.test.ts`)
- `@omdala/app` external Playwright execution (`https://app.omdala.com`): ✅ pass sau deploy sync
- `@omdala/web` external Playwright execution (`https://omdala.com`): ✅ pass (`language-switch.spec.ts`) sau deploy sync
- `@omdala/web` raw HTML-first locale verification: ✅ pass trên canonical domain
  - `https://omdala.com/` -> `<html lang="en">`
  - `https://omdala.com/vi/` -> `<html lang="vi">` + title/description/nav/footer tiếng Việt
  - `https://omdala.com/zh/`, `/es/`, `/ja/`, `/ko/` -> trả `html lang` đúng locale và copy/link path đúng locale
- production deploys: ✅ `web` (`https://2f2b0e60.omdala-web.pages.dev`), ✅ `app` (`https://32dc61ca.omdala-app.pages.dev`), ✅ `auth` (`https://f348645e.omdala-auth.pages.dev`)

Kết luận:

- luồng auth/session vừa khóa **không tạo ra blocker mới ở auth surface**
- blocker lớn ở `apps/app` đã được gỡ: route collision + legacy JS + stale type artifacts
- `T1-1` đã khóa xong ở mức docs + build/typecheck
- `T1-2` đã khóa xong ở mức code + typecheck + local smoke
- `T1-2` đã có API-facing path thật cho `account/profile`, `account/preferences`, `billing/subscriptions`, `billing/usage`
- Lane 4 đã tiến thêm: app đã gọi provider API thật (`/v1/providers`, `/v1/providers/route`), giữ fallback snapshot an toàn, và route decision đã có runtime-score
- Lane 4 đã chốt thêm observability path: admin có dashboard provider, API có memory-backed persistence layer, và test edge-cases đã phủ đủ path chính
- deploy drift chính giữa local và `app.omdala.com` đã được gỡ bằng production-main deploy wiring
- release commands theo surface đã rõ branch-prod/preview, giảm nguy cơ deploy nhầm `app/web/auth`
- shared UI và public content chính đã đồng bộ 6 ngôn ngữ cho app/auth/docs/home/contact/faq/definition/trust/vision; không còn backlog fallback tiếng Anh ở batch legacy public pages đã khóa trong lane này
- `apps/web` đã chốt xong bước quan trọng hơn: locale routing/server-resolved output ở mức static export, nên canonical domain hiện trả về đúng ngôn ngữ từ HTML đầu tiên thay vì chờ client hydrate
- smoke release của `web` không còn trỏ nhầm preview alias; canonical production `https://omdala.com` đã là nguồn verify chính
- `T1-0` đã tiến thêm một bước đáng kể: legacy docs rủi ro cao không còn kéo Team 1 lệch về reality/device ownership
- Team 1 chuyển trọng tâm sang Lane 4 provider routing expansion theo capability routing path

## 7.2 Waiting / blocked

| Blocker | Depends on | Severity | Next action |
|---|---|---|---|
| Shared workspace / notification schema chưa chốt | Team 2 | Medium | Sync qua dependency board |
| Release naming / env naming chung | Team 2 | Medium | Cần thống nhất trước smoke beta |

## 7.3 Team 2 decisions needed

- chốt `workspace` schema dùng chung
- chốt `notifications` event schema
- chốt `analytics` event envelope baseline
- chốt release env naming chung nếu đụng root platform

## 7.4 Team 1 next action

1. chuẩn bị handoff contract cho Team Om AI để tích hợp phased backlog
2. sync với Team 2 về notifications + analytics envelope trước private beta
3. cân nhắc dọn warning `react-hooks/exhaustive-deps` ở `apps/app/app/(auth)/login/MagicLinkLoginForm.tsx`
4. mở batch kiểm tra i18n cho admin/docs surfaces nếu cần cùng chuẩn với public web
5. chỉ deploy lại khi có thay đổi runtime tiếp theo, tránh phát sinh drift không cần thiết

---

# 8. DAILY UPDATE FORMAT

Mỗi ngày Team 1 cập nhật theo đúng mẫu này:

```md
## Daily Update — YYYY-MM-DD

### Hôm nay làm
- ...

### Đã xong
- ...

### Đang làm
- ...

### Blockers
- ...

### Cần Team 2 phản hồi
- ...

### Build / Typecheck / Smoke
- Build:
- Typecheck:
- Smoke:

### Lane Progress
- Lane 1:
- Lane 2:
- Lane 3:
- Lane 4:
- Lane 5:

### Team 1 weighted progress
- XX%
```

---

# 9. WEEKLY REVIEW FORMAT

Cuối mỗi tuần Team 1 phải chốt:

1. lane nào tăng %
2. lane nào đứng yên
3. blocker nào lặp lại nhiều lần
4. dependency nào nên đẩy sang Team 2
5. có cần cắt scope để giữ private beta không

Mẫu:

```md
## Weekly Review — Week of YYYY-MM-DD

- Wins:
- Misses:
- New risks:
- Decisions needed:
- New Team 1 progress:
```

---

# 10. QUY TẮC TĂNG % TIẾN ĐỘ

Không tăng % chỉ vì:

- viết thêm docs
- mở thêm todo
- đổi tên file
- tạo skeleton chưa chạy

Chỉ tăng khi có một trong các điều sau:

1. implementation thật
2. build/typecheck pass
3. integration path rõ hơn
4. smoke path chạy được
5. blocker phụ thuộc được gỡ

---

# 11. NHỮNG FILE TEAM 1 PHẢI NHÌN MỖI NGÀY

- `docs/PROJECT_CONTEXT_ENGINE.md`
- `docs/TWO_TEAM_PARALLEL_DEV_MASTER_PLAN_2026-04-09.md`
- `docs/MASTER_DEV_COMPLETION_PLAN_2026-04-08.md`
- `docs/OM_AI_MASTER_DEV_PLAN_2026.md`
- `docs/OMDALA_SHARED_PLATFORM_CORE_BOUNDARY_2026.md`

---

# 12. KẾT LUẬN

File này là bảng điều phối chính cho Team 1.

Mọi cập nhật tiếp theo của Team 1 phải đi vào đây trước, để founder nhìn một chỗ là biết:

- Team 1 đang ở đâu
- Team 1 còn bao nhiêu việc
- Team 1 đang chờ gì từ Team 2
- Team 1 đã sẵn sàng tới private beta chưa

---

# END OF FILE
