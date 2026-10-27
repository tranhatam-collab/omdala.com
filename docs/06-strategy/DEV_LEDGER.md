# DEV LEDGER — OMDALA continuous development

AUTOMATION: ACTIVE

Đổi dòng trên thành `AUTOMATION: PAUSED`, commit và push để dừng mọi chu kỳ. Kế hoạch: `OMDALA_CONTINUOUS_DEV_PLAN_2026.md`. Lập 2026-10-27.

## 1. Routine

| Tên | Lịch | ID |
|---|---|---|
| OMDALA dev cycle (BUILD) | Mỗi 6 giờ | `<điền sau khi tạo>` |
| OMDALA weekly review (REVIEW) | Thứ Hai 08:56 giờ Việt Nam | `<điền sau khi tạo>` |

## 2. Quyết định của con người

| ID | Câu hỏi | Mặc định khi chưa trả lời | Trạng thái | Ghi nhận (ai, ngày, lựa chọn) |
|---|---|---|---|---|
| D-001 | Nền mã nguồn: A xếp chồng (nêu SHA nền: 7b42320 hay 373a59e), B chờ PR #10 merge, C merge PR #1 trước | B | OPEN | |
| D-002 | Cho tự động hóa mở PR xếp chồng dạng draft sau mỗi mốc P1, và tên nhánh tích hợp được phép push | Không; chưa có tên nhánh | OPEN | |
| D-003 | Xác nhận phạm vi chuỗi (plan mục 2): OMCode Desktop là lane riêng ngoài tự động hóa, Omniverse parked, OMDALAT/Omone/Computer ngoài phạm vi | Như plan | OPEN | |
| D-004 | Phân loại route app (cần ở P2-03) | Node là chuẩn, places/hosts/... là loại node | OPEN | |

## 3. Work packages

Định nghĩa từng WP ở plan mục 5. Cột bằng chứng dùng từ vựng plan mục 4.4.

| WP | Trạng thái | Chặn bởi | Bằng chứng | SHA | Cập nhật |
|---|---|---|---|---|---|
| P0-01 SEO từng trang | TODO | | NOT_CHECKED | | |
| P0-02 Ba lỗi High | TODO | | NOT_CHECKED | | |
| P0-03 Phân loại 28 phát hiện | TODO | | NOT_CHECKED | | |
| P0-04 Script và SQL | TODO | | NOT_CHECKED | | |
| P0-05 Trung thực UI/test/docs | TODO | | NOT_CHECKED | | |
| P0-06 i18n và robots | TODO | | NOT_CHECKED | | |
| P0-07 CI chạy test API | TODO | | NOT_CHECKED | | |
| P0-08 Font tự host | TODO | | NOT_CHECKED | | |
| P0-09 brand:check mở rộng | TODO | | NOT_CHECKED | | |
| P0-10 Bản đồ port | TODO | | NOT_CHECKED | | |
| P0-11 Bản đồ docs dòng OMCODE | TODO | | NOT_CHECKED | | |
| P0-12 Triage Dependabot | TODO | | NOT_CHECKED | | |
| P1-01..P1-07 Hợp nhất trên nền chuẩn | BLOCKED | D-001, D-002 | | | |
| P2-01..P2-08 Hoàn thiện lõi | BLOCKED | D-001 (P2-03: D-004, P2-08: H3) | | | |
| Phase 3 gói quyết định hạ tầng | HUMAN_GATE | H3..H12 (plan mục 8) | | | |
| Phase 4–5 nghiệm thu và phát hành | HUMAN_GATE | H11..H13 | | | |

## 4. Trạng thái bên ngoài (đọc-only)

Đo 2026-10-27 qua GitHub API. Dùng làm mốc so sánh cho chu kỳ sau.

- `main`: 63433d3 (2026-04-05).
- PR #1 (nhánh này → main): đầu 233aa02, 38 commit, 309 file. Build và Lint xanh (2026-10-13). 28 thread review chưa xử lý (mục 6). Mergeable sạch.
- PR #10 (`OMCODE/go-live-e2e-20260829` → main): đầu 7b42320, 92 commit, 1.528 file. Mọi check xanh trừ `Independent Exact-SHA Review` (failure). Không thấy approval của người. Trạng thái `unstable`.
- PR #13 (draft, `OMCODE/infra-e2e-auto-20261026` → `OMCODE/infra-staging-final-20261007`): đầu 373a59e, đáy 7b42320. OMDALA CI #50 và OMCODE Desktop Candidate #17 xanh.
- Còn mở: #11, #12 (OMCODE credential gates), #4–#9 (xếp chồng, nhiều draft), #2, #3 (Copilot cũ, draft), #14 (sharp, wrangler) và #15 (undici, wrangler) của Dependabot.
- Phán quyết phát hành: `HOLD / NO_GO` (2026-10-08). `FINAL-01..10` đều `BLOCKED`.

## 5. Nhật ký chu kỳ (giữ 15 dòng gần nhất)

| Thời điểm (UTC) | Loại | WP | Kết quả | SHA |
|---|---|---|---|---|
| 2026-10-27 | PLAN | — | Kế hoạch, ledger, `scripts/dev-cycle.sh` được lập; routine được tạo | |

## 6. Phát hiện review PR #1 (Copilot, 2026-10-13, 28 thread)

`CONFIRMED` = đã đối chiếu với mã nguồn hoặc build ngày 2026-10-27. Cột "Dòng OMCODE" điền ở P0-03 (đọc bằng `git show origin/OMCODE/infra-e2e-auto-20261026:<file>`).

| R | Mức | Vị trí | Vấn đề | Nhánh này | Dòng OMCODE | WP |
|---|---|---|---|---|---|---|
| R-01 | High | `apps/admin/app/layout.tsx:33` | Mock luôn cấp quyền admin cho mọi người | CONFIRMED | | P0-02 |
| R-02 | High | `apps/app/lib/session-client.ts:64` | Cổng dashboard tin JSON không ký trong localStorage | NOT_CHECKED | | P0-03 |
| R-03 | High | `services/api/src/db/client.ts:38` | `rejectUnauthorized: false` cho mọi kết nối DB | CONFIRMED | | P0-02 |
| R-04 | High | `services/api/src/stub.ts:25` | Chỉ kiểm `startsWith('/')`, nhận `//evil.example` (open redirect) | CONFIRMED | | P0-02 |
| R-05 | High | `services/api/wrangler.toml:30` | Route ghi `/v2/reality/*` công khai, không xác thực, nếu gắn domain production | NOT_CHECKED | | P0-03 |
| R-06 | Med | `.github/workflows/build.yml:36` | CI không chạy test API | NOT_CHECKED | | P0-07 |
| R-07 | Med | `apps/admin/app/robots.ts:6` | Hai nguồn `robots.txt` (route và public) | NOT_CHECKED | | P0-06 |
| R-08 | Med | `apps/app/app/(dashboard)/nodes/new/page.tsx:68` | Nút Save draft không làm gì | NOT_CHECKED | | P0-05 |
| R-09 | Med | `apps/app/app/(dashboard)/requests/new/page.tsx:65` | Như R-08 | NOT_CHECKED | | P0-05 |
| R-10 | Med | `apps/app/app/robots.ts:6` | Hai nguồn robots | NOT_CHECKED | | P0-06 |
| R-11 | Med | `apps/app/e2e/smoke-auth-dashboard.spec.ts:43` | Test "redirect về login" chấp nhận kết quả ngược | NOT_CHECKED | | P0-05 |
| R-12 | Med | `apps/docs/app/page.tsx:16` | Locale chọn sau hydrate, HTML tĩnh luôn tiếng Anh | NOT_CHECKED | | P0-03 |
| R-13 | Med | `apps/docs/app/robots.ts:8` | Robots xung đột với `public/robots.txt` | NOT_CHECKED | | P0-06 |
| R-14 | Med | `apps/web/app/head.tsx:5` | Next 15 bỏ qua `head.tsx`: 10 trang cùng canonical `/` và cùng title | CONFIRMED | | P0-01 |
| R-15 | Med | `apps/web/app/layout.tsx:47` | `index: true` bỏ qua `OMDALA_NOINDEX` | NOT_CHECKED | | P0-01 |
| R-16 | Med | `apps/web/app/lib/useWebLocale.ts:13` | Locale chọn sau hydrate, trái quy tắc render phía server | NOT_CHECKED | | P0-03 |
| R-17 | Med | `apps/web/app/robots.ts:8` | Hai nguồn robots | NOT_CHECKED | | P0-06 |
| R-18 | Med | `infra/migrations/0001_reality_core.up.sql:4` | `\i` phải là `\ir` | NOT_CHECKED | | P0-04 |
| R-19 | Med | `packages/core/src/i18n.ts:2` | Sáu ngôn ngữ cùng "ready" dù chỉ EN/VI có nội dung | NOT_CHECKED | | P0-06 |
| R-20 | Med | `packages/seo/src/utils.ts:26` | `buildLanguageAlternates` luôn thêm `vi` dù `locales` không có | NOT_CHECKED | | P0-06 |
| R-21 | Med | `packages/ui/src/components/LanguageSwitcher.tsx:58` | Link bỏ hết query (mất token/next ở trang login) | NOT_CHECKED | | P0-06 |
| R-22 | Med | `scripts/backup/omdala_pg_restore.sh:32` | Thiếu `ON_ERROR_STOP`, restore lỗi vẫn in done | NOT_CHECKED | | P0-04 |
| R-23 | Med | `scripts/cleanup_test_data.sql:5` | Thiếu `ON_ERROR_STOP` | NOT_CHECKED | | P0-04 |
| R-24 | Med | `scripts/ops_v2_report_upload.sh:23` | `curl` thiếu `--fail`, báo uploaded cả khi 4xx/5xx | NOT_CHECKED | | P0-04 |
| R-25 | Med | `scripts/smoke_v2_reality.sh:255` | Consistency check chạy trước bước cleanup | NOT_CHECKED | | P0-04 |
| R-26 | Med | `services/api/src/db/reality-repository.test.ts:8` | Test tự cài lại helper thay vì gọi code thật | NOT_CHECKED | | P0-05 |
| R-27 | Med | `services/api/wrangler.toml:5` | Account Worker khác account chuẩn trong `CLOUDFLARE_ACCOUNT_BASELINE_OMDALA.md`. Là quyết định `INFRA-003` | HUMAN_GATE | | H3 |
| R-28 | Med | `apps/docs/app/api/page.tsx:32` | Trang API liệt kê route không tồn tại | NOT_CHECKED | | P0-05 |
