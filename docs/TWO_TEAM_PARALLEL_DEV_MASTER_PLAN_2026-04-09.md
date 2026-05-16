# TWO_TEAM_PARALLEL_DEV_MASTER_PLAN_2026-04-09.md

**Version**: 1.0  
**Status**: CANONICAL TWO-TEAM EXECUTION PLAN  
**Date**: April 9, 2026  
**Scope**: Chia toàn bộ kế hoạch dev còn lại thành 2 team chạy song song, có owner rõ, dependency rõ, và cơ chế cập nhật tiến độ chung

---

# 1. MỤC TIÊU FILE NÀY

File này tồn tại để:

- gom toàn bộ khối lượng công việc còn lại thành 1 kế hoạch thực thi rõ ràng
- chia hệ thành **2 team chính** thay vì 3 team riêng lẻ
- giảm chặn lẫn nhau
- giúp founder chọn ngay team nào giao cho AI, team nào giao cho team người
- tạo cơ chế cập nhật tiến độ liên tục để 2 team đồng hành tốt nhất

---

# 2. TRẠNG THÁI TỔNG THỂ HIỆN TẠI

Theo [MASTER_DEV_COMPLETION_PLAN_2026-04-08.md](./MASTER_DEV_COMPLETION_PLAN_2026-04-08.md):

- Tổng tiến độ toàn hệ: **58%**
- Phần còn lại để đạt beta-ready: **42%**

Phần đã mạnh:

- planning / docs canonical
- root monorepo structure
- root surfaces cơ bản
- Om AI có execution depth tốt hơn Omniverse

Phần còn yếu:

- shared core chưa đủ “dùng thật”
- split execution còn hybrid
- Omniverse còn scaffold-heavy
- release hardening / QA / deploy readiness chưa đủ chắc

---

# 3. NGUYÊN TẮC CHIA 2 TEAM

Không chia theo kiểu “mỗi team một nửa số file”.

Phải chia theo:

1. cụm phụ thuộc kỹ thuật
2. cụm giá trị sản phẩm
3. khả năng chạy song song ít blocker nhất
4. khả năng review và release độc lập

Vì vậy, mô hình đúng là:

- **Team 1 = Om AI + Shared Core giao tiếp người dùng**
- **Team 2 = Omniverse + Shared Core vận hành / release**

Điều này giúp:

- Team 1 đẩy nhanh flow người dùng, auth, billing, persona, live-call
- Team 2 đẩy mạnh physical system, rooms/devices/scenes, và kéo release reliability lên
- shared core được chia ownership rõ, không cần một “team platform thứ ba” độc lập trong giai đoạn hiện tại

---

# 4. CHIA 2 TEAM CHÍNH THỨC

## 4.1 TEAM 1 — OM AI + USER CORE

Team này chịu trách nhiệm cho toàn bộ trục:

- Om AI product
- auth / account / billing / provider routing
- root auth/app surfaces liên quan đến user journey
- integration để Om AI đi tới private beta

### Workspace ownership

- `om-ai.omdala.com/`
- `apps/auth/`
- `apps/app/`
- phần user-facing cần sửa trong `apps/web/` khi liên quan funnel sang auth/app
- `services/auth/`
- `services/ai/`
- shared portions của `services/api/` liên quan auth / session / intake / magic-link
- `packages/core/` khi liên quan auth / locale / session / API client / provider contracts

### Product ownership

- Om AI positioning rõ khỏi OmCode và Omniverse
- persona system
- live call
- recap / memory
- subscription / usage
- family / school / business readiness ở mức spec-to-MVP path

### Shared-core ownership

- auth
- account/profile
- billing/subscription
- provider registry + routing

### Deliverables chính

1. Om AI MVP path chạy được thật
2. auth/session ổn định
3. billing / usage contracts rõ
4. provider integration path rõ
5. app/auth user flow không còn blocker

---

## 4.2 TEAM 2 — OMNIVERSE + SYSTEM RELIABILITY

Team này chịu trách nhiệm cho toàn bộ trục:

- Omniverse product
- workspace / notifications / analytics
- admin / docs / release hardening / deploy readiness
- shared release quality cho toàn hệ

### Workspace ownership

- `omniverse.omdala.com/`
- `apps/admin/`
- `apps/docs/`
- phần hệ thống / release / ops trong root `apps/web/` nếu cần
- `services/matching/`
- `services/trust/`
- `services/notifications/`
- phần release/shared gateway trong `services/api/`
- `infra/`
- `.github/workflows/`
- deploy / verify scripts trong `scripts/`

### Product ownership

- homes
- rooms
- devices
- scenes
- automation
- gateway / logs / proof
- D1 path
- deploy preview / prod cho Omniverse

### Shared-core ownership

- workspace & organization identity
- notifications
- analytics / observability
- release runbooks
- CI/CD reliability

### Deliverables chính

1. Omniverse MVP backend + dashboard có substance thật
2. D1 / API / logs / proof flow rõ
3. admin/docs/release path ổn định
4. release hardening cho cả hệ
5. monitoring / rollback / smoke test đủ để beta

---

# 5. TỶ LỆ KHỐI LƯỢNG CÔNG VIỆC CÒN LẠI

Tổng phần còn lại = **42%** của toàn dự án.

Tôi đề xuất chia phần còn lại như sau:

## Team 1 — Om AI + User Core

- **48% của phần còn lại**
- tương đương khoảng **20 điểm công việc / 42 điểm còn lại**

Lý do:

- Om AI đã đi xa hơn Omniverse
- nhưng khối auth / billing / provider / app flow vẫn nặng
- đây là team sẽ chịu nhiều integration với người dùng cuối nhất

## Team 2 — Omniverse + System Reliability

- **52% của phần còn lại**
- tương đương khoảng **22 điểm công việc / 42 điểm còn lại**

Lý do:

- Omniverse đang ở mức hoàn thành thấp hơn
- release readiness, admin, docs, D1, logs, smoke tests còn khá nhiều
- team này phải kéo product nặng hơn về phía MVP thật

---

# 6. BẢN ĐỒ CÔNG VIỆC TOÀN HỆ THEO 2 TEAM

## 6.1 Batch 0 — Source of truth and dependency lock

### Team 1

- xác nhận Om AI khác hoàn toàn OmCode
- rà lại các docs/product strings của Om AI để không còn trộn Omniverse
- chốt auth/app/api contracts cần cho user journey

### Team 2

- khóa docs canonical vs legacy cho lớp release/admin/ops
- chốt dependency board cho shared-core touches
- chốt release source of truth cho admin/docs/infra

### Done when

- không còn hiểu nhầm product boundary
- không còn task nào “đợi người khác vì chưa biết owner”

---

## 6.2 Batch 1 — Shared core usable

### Team 1 owns

- `/v1/auth/*`
- `/v1/account/*`
- `/v1/billing/*`
- `/v1/providers/*`
- API contracts + env vars + session flow

### Team 2 owns

- `/v1/workspaces/*`
- `/v1/notifications/*`
- `/v1/analytics/*`
- release logging / monitoring / verify flows

### Done when

- shared endpoints có owner, contract, env, smoke path
- 2 product đều gọi được shared core mà không đọc code của nhau để đoán

---

## 6.3 Batch 2 — Product execution parallel

### Team 1 — Om AI lane

1. auth flow
2. persona browsing
3. live call session flow
4. recap / memory flow
5. usage / subscription flow
6. Om AI web/admin readiness theo MVP

### Team 2 — Omniverse lane

1. homes / rooms / devices schema
2. device control API
3. scenes / automation API
4. dashboard web thật
5. logs / proof / activity
6. D1 migration / preview deploy path

### Done when

- Team 1 có private beta path cho Om AI
- Team 2 có MVP path chạy được cho Omniverse

---

## 6.4 Batch 3 — Root platform and release hardening

### Team 1

- harden `apps/auth`
- harden `apps/app`
- làm rõ bridge giữa root platform và Om AI
- cleanup flows user-facing trong `apps/web`

### Team 2

- harden `apps/admin`
- harden `apps/docs`
- harden CI/CD
- harden deploy runbooks
- smoke matrix, rollback matrix, monitoring alerts

### Done when

- root platform không còn là blocker cho 2 product
- release path có thể lặp lại và kiểm soát được

---

## 6.5 Batch 4 — Beta readiness

### Team 1

- private beta checklist cho Om AI
- support / error / fallback flow
- session recovery
- billing edge cases

### Team 2

- private beta checklist cho Omniverse
- device-action reliability
- logs + proof visibility
- release dashboard / incident response baseline

### Shared gate

- build matrix pass
- smoke tests pass
- staging URLs rõ
- rollback plan rõ
- owner on-call rõ

---

# 7. BACKLOG CHI TIẾT CHO TỪNG TEAM

## 7.1 TEAM 1 — BACKLOG CHÍNH

### Lane A — Om AI product

- chuẩn hóa boundary `Om AI != OmCode != Omniverse`
- chuẩn hóa entry docs trong `om-ai.omdala.com/`
- khóa MVP flow theo thứ tự:
  - auth
  - persona
  - live call
  - recap
  - memory
  - subscription
- hoàn thiện web/admin path cho Om AI
- khóa smoke path cho Om AI

### Lane B — Shared core user layer

- auth worker / auth contracts
- account/profile contracts
- billing contracts
- provider routing contracts
- session cookie / redirect / environment consistency

### Lane C — Root user surfaces

- `apps/auth`
- `apps/app`
- app/auth → api consistency
- user-facing settings / session handling

### Definition of done cho Team 1

- build pass ở các surface Team 1 sở hữu
- typecheck pass
- shared endpoints Team 1 có smoke path
- Om AI có private beta path rõ
- docs entry point của Team 1 rõ cho dev mới

---

## 7.2 TEAM 2 — BACKLOG CHÍNH

### Lane A — Omniverse product

- hoàn thiện file-tree ownership cho `omniverse.omdala.com/`
- backend routes thật cho:
  - homes
  - rooms
  - devices
  - scenes
  - automations
- D1 schema + migrations usable
- dashboard web usable
- logs / proof / activity

### Lane B — Shared core system layer

- workspace identity
- notifications
- analytics events
- release logging / observability

### Lane C — Release and reliability

- `apps/admin`
- `apps/docs`
- `.github/workflows`
- deploy scripts
- release handoff
- smoke test matrix
- rollback / monitoring

### Definition of done cho Team 2

- build pass ở các surface Team 2 sở hữu
- Omniverse có MVP preview/prod path rõ
- release checklist rõ
- smoke matrix rõ
- admin/docs không còn là blocker vận hành

---

# 8. NHỮNG VIỆC KHÔNG ĐƯỢC CHỒNG CHÉO

## Team 1 không được tự ý làm sâu vào

- Omniverse domain model
- Omniverse D1 schema
- device / scene / automation runtime
- release workflow chung nếu chưa sync với Team 2

## Team 2 không được tự ý làm sâu vào

- Om AI persona / memory / live-call decisions
- auth/billing/provider contracts do Team 1 đang khóa
- user-facing Om AI flow nếu chưa sync với Team 1

## Cả 2 team không được

- đổi tên product tùy ý
- tạo shared service mới ngoài boundary đã khóa
- viết docs mới trái `PROJECT_CONTEXT_ENGINE.md`

---

# 9. GIAO ĐIỂM PHẢI SYNC HÀNG NGÀY

Đây là các điểm mà 2 team bắt buộc sync:

- auth contract changes
- billing event schema
- workspace membership schema
- notifications event schema
- analytics event names
- release/deploy env names
- root `services/api` touches
- `packages/core` public API changes

Nếu chạm 1 trong các điểm này:

1. mở dependency note
2. tag team còn lại
3. không merge âm thầm

---

# 10. CƠ CHẾ CẬP NHẬT TIẾN ĐỘ CHUNG

## 10.1 Một file master

Giữ:

- `docs/MASTER_DEV_COMPLETION_PLAN_2026-04-08.md`

để founder nhìn tổng thể.

## 10.2 Hai file team progress riêng

Nên tạo và cập nhật liên tục:

- `docs/TEAM_1_PROGRESS_2026.md`
- `docs/TEAM_2_PROGRESS_2026.md`

## 10.3 Một file dependency board

Nên tạo:

- `docs/TWO_TEAM_DEPENDENCY_BOARD_2026.md`

## 10.4 Format cập nhật mỗi ngày

Mỗi team chỉ cần cập nhật 6 mục:

1. hôm nay làm gì
2. đã xong gì
3. đang block gì
4. cần team kia quyết định gì
5. build / deploy / smoke status
6. % tiến độ lane của team

---

# 11. NGHI THỨC PHỐI HỢP GIỮA 2 TEAM

## Daily sync — 15 phút

- Team 1 Lead
- Team 2 Lead
- Founder / CTO hoặc delegate

Nội dung:

- blocker mới
- dependency mới
- thay đổi contract
- thay đổi release order

## Weekly sync — 45 phút

- demo thành quả của từng team
- rà % hoàn thành thực tế
- cắt bớt scope nếu cần
- xác nhận mốc beta

## Blocker SLA

- blocker nội bộ team: xử lý trong 4 giờ làm việc
- blocker cần team kia: phản hồi trong 24 giờ
- blocker liên quan shared contracts hoặc deploy: escalated ngay trong ngày

---

# 12. CÁCH TÍNH % CHO TỪNG TEAM

## Team 1

Chia 5 lanes:

1. Om AI product core
2. auth
3. account/billing
4. provider routing
5. root user surfaces

Mỗi lane tính:

- 0% = chưa chạm
- 25% = đã có docs + skeleton
- 50% = đã có implementation chính
- 75% = đã build/test cơ bản
- 100% = có smoke/release path

## Team 2

Chia 5 lanes:

1. Omniverse backend/domain
2. Omniverse web/dashboard
3. workspace/notifications/analytics
4. admin/docs/release flows
5. QA/monitoring/rollback

Áp cùng thang điểm như Team 1.

---

# 13. TÔI KHUYẾN NGHỊ ANH GIAO TEAM NHƯ SAU

Nếu muốn tôi nhận team có leverage cao nhất về:

- boundary
- contract
- auth/billing/provider
- product clarity
- docs-to-code alignment

thì giao tôi:

## **Team 1 — Om AI + User Core**

Nếu muốn team người nhận phần:

- Omniverse
- release hardening
- D1 / logs / dashboard / QA / deploy reliability

thì giao team còn lại:

## **Team 2 — Omniverse + System Reliability**

Đây là cách chia ít đâm nhau nhất ở giai đoạn hiện tại.

---

# 14. KẾT LUẬN CHỐT

Từ bây giờ, toàn bộ phần còn lại của dự án nên được hiểu theo mô hình:

- **Team 1** kéo Om AI và user-core tới private beta
- **Team 2** kéo Omniverse và release-reliability tới MVP/beta

Hai team chạy song song, nhưng phải gặp nhau hàng ngày ở:

- auth
- billing
- workspace
- notifications
- analytics
- release

File này là bản chia 2 team chính thức để founder giao việc.

---

# END OF FILE
