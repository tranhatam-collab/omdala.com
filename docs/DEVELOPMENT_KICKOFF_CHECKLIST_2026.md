# DEVELOPMENT_KICKOFF_CHECKLIST_2026.md

**Version**: 2.0  
**Status**: CANONICAL DEVELOPMENT KICKOFF CHECKLIST  
**Date**: April 8, 2026  
**Scope**: Kickoff readiness cho OMDALA Platform, Om AI, Omniverse

---

# 1. MỤC ĐÍCH

Tài liệu này không còn khóa theo mốc cứng `April 16`.

Từ bây giờ, file này dùng để trả lời một câu hỏi duy nhất:

**Team đã đủ sẵn sàng để bắt đầu coding ổn định trên từng workstream chưa?**

Mục tiêu:

- không blocker hạ tầng
- không blocker ownership
- không blocker source of truth
- không blocker build/test cơ bản

---

# 2. KICKOFF READINESS LEVELS

## Level 1 — Planning Ready

Đã có:

- product direction
- architecture direction
- team ownership
- docs canonical

## Level 2 — Repo Ready

Đã có:

- folder structure đúng
- package manager đúng
- scripts build/typecheck/lint cơ bản
- branch strategy rõ

## Level 3 — Dev Ready

Đã có:

- build pass
- env templates rõ
- API contracts rõ
- services và app boundaries rõ
- team có thể nhận task và code ngay

## Level 4 — Beta Ready

Đã có:

- staging ổn
- smoke tests ổn
- deploy runbook ổn
- release owner rõ

---

# 3. CHECKLIST CHUNG CHO TOÀN HỆ

## 3.1 Source of truth

- [ ] `docs/PROJECT_CONTEXT_ENGINE.md` đã được cập nhật
- [ ] `docs/MASTER_DEV_COMPLETION_PLAN_2026-04-08.md` phản ánh đúng tiến độ hiện tại
- [ ] `docs/PROJECT_ORGANIZATION_SUMMARY_2026.md` phản ánh đúng cây thư mục hiện tại
- [ ] Không còn team nào dùng `/ai-om/` hoặc `/ai-omniverse/` làm path chuẩn

## 3.2 Git / workflow

- [ ] branch hiện tại ổn định
- [ ] không có generated artifacts bị hiểu nhầm là source code
- [ ] `.github/workflows/` phản ánh đúng surfaces đang build/deploy
- [ ] team hiểu rõ file nào được commit, file nào chỉ là generated

## 3.3 Runtime baseline

- [ ] root `package.json` dùng được cho build/lint/typecheck
- [ ] root platform có thể build từng surface cần thiết
- [ ] `services/api` có trạng thái rõ ràng
- [ ] env templates đủ để onboard dev mới

---

# 4. CHECKLIST CHO OMDALA PLATFORM

## 4.1 Apps

- [ ] `apps/web` build được
- [ ] `apps/app` build được
- [ ] `apps/auth` build được
- [ ] `apps/admin` build được
- [ ] `apps/docs` build được

## 4.2 Services

- [ ] `services/api` có owner rõ
- [ ] `services/auth` không còn là skeleton mơ hồ
- [ ] `services/notifications` có vai trò rõ
- [ ] `services/trust` có vai trò rõ
- [ ] `services/matching` có vai trò rõ

## 4.3 Shared packages

- [ ] `packages/core` ổn định
- [ ] `packages/types` ổn định
- [ ] `packages/ui` ổn định
- [ ] `packages/seo` ổn định

---

# 5. CHECKLIST CHO OM AI

## 5.1 Product boundary

- [ ] team đã hiểu Om AI là app riêng
- [ ] không còn dùng Om AI như tên chung cho product khác
- [ ] không lẫn Om AI với OmCode
- [ ] không lẫn Om AI với Omniverse

## 5.2 Workspace readiness

- [ ] `om-ai.omdala.com/package.json` chạy được
- [ ] `om-ai.omdala.com/backend` có build/test path rõ
- [ ] `om-ai.omdala.com/web` có build path rõ
- [ ] `om-ai.omdala.com/gateway` có role rõ
- [ ] `om-ai.omdala.com/README.md` được team dùng như entry point

## 5.3 MVP readiness

- [ ] auth flow rõ
- [ ] persona flow rõ
- [ ] live call flow rõ
- [ ] recap/memory flow rõ
- [ ] subscription/usage flow rõ

---

# 6. CHECKLIST CHO OMNIVERSE

## 6.1 Product boundary

- [ ] team đã hiểu Omniverse là app riêng
- [ ] workspace chỉ chứa device / room / scene / gateway / automation
- [ ] không lẫn learning / teacher / persona / roleplay vào đây

## 6.2 Workspace readiness

- [ ] `omniverse.omdala.com/package.json` chạy được
- [ ] `omniverse.omdala.com/backend` có build/test path rõ
- [ ] `omniverse.omdala.com/web` có build path rõ
- [ ] `omniverse.omdala.com/docs/*` đủ để onboard Team A
- [ ] `omniverse.omdala.com/README.md` đủ rõ cho dev mới

## 6.3 MVP readiness

- [ ] homes / rooms / devices schema rõ
- [ ] scenes / automation schema rõ
- [ ] backend routes rõ
- [ ] dashboard flow rõ
- [ ] D1 / DB path rõ

---

# 7. CHECKLIST CHO SHARED PLATFORM

- [ ] auth/session service usable
- [ ] account/profile usable
- [ ] workspace usable
- [ ] billing/subscription usable
- [ ] provider routing usable
- [ ] notifications usable
- [ ] analytics event baseline usable

Nếu chưa đạt 7 mục này, Team A và Team B vẫn sẽ bị chặn ở các bước integration.

---

# 8. KICKOFF GATE

## Được phép nói “kickoff dev ổn định” khi:

1. root platform pass build/typecheck ở các surface chính
2. Om AI có backlog + owner + runtime path rõ
3. Omniverse có backlog + owner + runtime path rõ
4. docs canonical đã thống nhất
5. generated artifacts không còn chen vào luồng source-of-truth

## Chưa được phép gọi là “beta-ready” khi:

- chỉ có tài liệu nhưng chưa có implementation
- chỉ có workspace scaffold
- shared core chưa dùng được thật
- migration còn hybrid và team còn đọc nhầm path cũ

---

# 9. THỨ TỰ KICKOFF ĐÚNG

1. Chốt docs canonical
2. Chốt owners và boundaries
3. Chốt build/test baseline
4. Chốt migration board
5. Chạy shared core trước
6. Cho Team B đẩy Om AI MVP
7. Cho Team A đẩy Omniverse MVP

---

# 10. KẾT LUẬN

Tài liệu này dùng để kiểm tra mức “đã đủ sẵn sàng để code chưa”.

Hiện trạng ngày `2026-04-08`:

- planning readiness: cao
- repo readiness: khá
- dev readiness: trung bình
- beta readiness: chưa

---

# END OF FILE
