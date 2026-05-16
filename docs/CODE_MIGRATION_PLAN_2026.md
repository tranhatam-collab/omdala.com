# CODE_MIGRATION_PLAN_2026.md

**Version**: 2.0  
**Status**: CANONICAL CODE MIGRATION PLAN  
**Date**: April 8, 2026  
**Scope**: Chuyển từ trạng thái hybrid hiện tại sang split execution rõ ràng

---

# 1. MỤC TIÊU

Mục tiêu của migration không còn là:

- tạo `/ai-om/`
- tạo `/ai-omniverse/`
- tạo `/shared-core/` top-level

Vì các hướng đó là kế hoạch cũ.

Mục tiêu mới là:

1. giữ root `omdala.com/` làm ecosystem + shared platform
2. giữ `om-ai.omdala.com/` làm Om AI workspace riêng
3. giữ `omniverse.omdala.com/` làm Omniverse workspace riêng
4. tách sạch ownership để team không còn viết code theo mô hình lẫn nhau

---

# 2. HIỆN TRẠNG THỰC TẾ

## 2.1 Root platform đang còn hoạt động

Hiện đang có:

- `apps/web`
- `apps/app`
- `apps/auth`
- `apps/admin`
- `apps/docs`
- `services/api`
- `services/auth`
- `services/ai`
- `services/matching`
- `services/notifications`
- `services/trust`
- `packages/*`

## 2.2 Om AI đã là workspace riêng

Hiện đang có:

- `om-ai.omdala.com/backend`
- `om-ai.omdala.com/web`
- `om-ai.omdala.com/gateway`
- `om-ai.omdala.com/ios`
- `om-ai.omdala.com/android`

## 2.3 Omniverse đã là workspace riêng

Hiện đang có:

- `omniverse.omdala.com/backend`
- `omniverse.omdala.com/web`
- `omniverse.omdala.com/ios`
- `omniverse.omdala.com/android`
- `omniverse.omdala.com/docs`

## 2.4 Kết luận

Codebase hiện ở trạng thái **hybrid split**:

- split đã bắt đầu và có thật
- nhưng migration ownership chưa sạch
- root platform vẫn còn gánh nhiều logic đáng ra phải được phân loại rõ hơn

---

# 3. MỤC TIÊU MIGRATION MỚI

## 3.1 Cái gì giữ ở root

Giữ lại trong root `omdala.com/`:

- `apps/web`
- `apps/app`
- `apps/auth`
- `apps/admin`
- `apps/docs`
- shared platform services
- shared packages
- docs / infra / scripts / workflows

## 3.2 Cái gì thuộc Om AI

Thuộc `om-ai.omdala.com/`:

- Om AI product runtime
- Om AI backend
- Om AI web
- Om AI mobile
- Om AI gateway/runtime riêng
- Om AI docs và release assets

## 3.3 Cái gì thuộc Omniverse

Thuộc `omniverse.omdala.com/`:

- Omniverse backend
- Omniverse web
- Omniverse mobile
- Omniverse docs
- Omniverse device/room/scene/automation code

---

# 4. MIGRATION RULES

## Rule 1

Không move file chỉ vì “theo kế hoạch cũ”.

Chỉ move khi:

- ownership thật sự sai
- runtime thật sự nên thuộc workspace khác
- team khác sẽ maintain file đó

## Rule 2

Không làm migration kiểu big-bang.

Làm theo batches có owner, có rollback, có verify.

## Rule 3

Không được phá root platform đang hoạt động chỉ để “đẹp cấu trúc”.

## Rule 4

Mọi migration phải cập nhật:

- import paths
- scripts
- package metadata
- docs source of truth

---

# 5. BATCH MIGRATION MỚI

## Batch M1 — Source of truth cleanup

Owner: CTO / Platform

- [ ] xác nhận docs canonical
- [ ] đánh dấu docs legacy
- [ ] loại bỏ path cũ `/ai-om/`, `/ai-omniverse/` khỏi planning docs
- [ ] khóa `PROJECT_CONTEXT_ENGINE.md`

## Batch M2 — Ownership mapping

Owner: CTO + Team Leads

- [ ] lập danh sách file/folder thuộc root platform
- [ ] lập danh sách file/folder thuộc Om AI
- [ ] lập danh sách file/folder thuộc Omniverse
- [ ] chốt vùng cấm cross-product

## Batch M3 — Shared core extraction

Owner: Team Platform

- [ ] phân loại `services/*` thành:
  - shared service thật
  - service skeleton
  - service deprecated
- [ ] chốt service nào tiếp tục sống ở root
- [ ] chốt service nào phải tách thành product-local logic

## Batch M4 — Om AI cleanup

Owner: Team B

- [ ] gỡ các chỗ còn lẫn product boundary
- [ ] chuẩn hóa docs entry point
- [ ] khóa MVP path cho Om AI

## Batch M5 — Omniverse execution uplift

Owner: Team A

- [ ] nâng workspace từ scaffold lên MVP runtime
- [ ] khóa backend + web + DB paths
- [ ] khóa API routes và data model

## Batch M6 — CI/CD alignment

Owner: Platform + DevOps

- [ ] workflow nào là của root platform
- [ ] workflow nào là của Om AI
- [ ] workflow nào là của Omniverse
- [ ] generated artifacts nào phải ignore

---

# 6. CÁC FILE / FOLDER CẦN PHÂN LOẠI NGAY

## 6.1 Root `apps/`

Cần trả lời:

- file nào là shared root surface
- file nào chỉ là legacy bridge
- file nào đang duplicate với Om AI hoặc Omniverse

## 6.2 Root `services/`

Cần trả lời:

- `services/api` là shared gateway hay product backend?
- `services/auth` là service thật hay skeleton?
- `services/ai` có thuộc root hay thực ra là Om AI concern?
- `services/trust`, `services/matching`, `services/notifications` ở mức nào?

## 6.3 `om-ai.omdala.com/`

Cần trả lời:

- phần nào là canonical runtime
- phần nào là generated/deploy artifacts
- phần nào là tài liệu cũ nhưng vẫn có giá trị tham chiếu

## 6.4 `omniverse.omdala.com/`

Cần trả lời:

- phần nào đã chạy thật
- phần nào mới là scaffold
- phần nào cần implementation trước để đạt MVP

---

# 7. ĐỊNH NGHĨA MIGRATION XONG

Migration chỉ được xem là xong khi:

1. team không còn đọc path cũ
2. mỗi folder có owner rõ
3. root platform không bị lẫn product code
4. Om AI không bị lẫn Omniverse
5. Omniverse không bị lẫn Om AI
6. shared core có danh sách service thật rõ ràng
7. workflows, scripts, docs đã phản ánh đúng trạng thái mới

---

# 8. VIỆC KHÔNG ĐƯỢC LÀM

1. Không xóa hàng loạt root apps/services chỉ để “sạch cấu trúc”
2. Không move code mà không có owner nhận trách nhiệm
3. Không tạo thêm alias path cũ mới
4. Không tiếp tục viết docs mới theo `/ai-om/` hoặc `/ai-omniverse/`
5. Không dùng migration plan cũ để áp trực tiếp lên cây thư mục hiện tại

---

# 9. OUTPUT MONG MUỐN SAU MIGRATION

Sau migration, team phải nhìn thấy:

- root platform là root platform
- Om AI là Om AI
- Omniverse là Omniverse

Không còn tình trạng:

- planning nói một kiểu
- code nằm một kiểu
- docs dẫn team sang path cũ

---

# 10. KẾT LUẬN

Migration hiện tại không phải “di chuyển vào folder mới” nữa.

Migration bây giờ là:

**chuẩn hóa ownership, boundaries, scripts, docs và deployment paths theo trạng thái thật đang có.**

Đó mới là cách để team dev tiếp tục an toàn.

---

# END OF FILE
