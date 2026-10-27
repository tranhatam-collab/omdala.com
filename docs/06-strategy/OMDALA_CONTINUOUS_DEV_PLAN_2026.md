# OMDALA CONTINUOUS DEV PLAN 2026

Phiên bản 1.0 · lập 2026-10-27 · trạng thái: **PROPOSED**, chờ Founder xác nhận D-001 và D-002.
Trạng thái thực thi nằm ở `DEV_LEDGER.md`. File này chỉ đổi khi đổi kế hoạch.

## 1. Mục tiêu và giới hạn trung thực

- Mục tiêu: đưa chuỗi dự án `*.omdala.com` từ `HOLD / NO_GO` (báo cáo 2026-10-08) tới sẵn sàng phát hành có bằng chứng, bằng một nhịp làm việc tự động theo lịch.
- Tự động hóa làm được: mã nguồn, test, tài liệu, báo cáo trên nhánh được cấp phép.
- Tự động hóa không được làm: mọi thứ chạm hệ thống ngoài (Cloudflare, DNS, DigitalOcean, Vercel, cài đặt GitHub, secret, database từ xa, deploy) và mọi thứ cần chữ ký (review độc lập, Founder GO). Đó là cổng của con người (mục 8). Lịch tự động chỉ chuẩn bị gói quyết định và đọc lại trạng thái khi họ làm xong.
- Hệ quả: thời điểm hoàn thành chuỗi do các cổng ở mục 8 quyết định. Kế hoạch này rút ngắn phần mã nguồn và không hứa ngày phát hành.

## 2. Chuỗi dự án và trạng thái đã kiểm chứng (2026-10-27)

Nguồn: cây git `origin/OMCODE/infra-e2e-auto-20261026` (373a59e) đọc trực tiếp, GitHub API, `docs/audit/2026-10-08/FINAL_EXECUTION_STATUS.md`. Số liệu production là `REPORTED_UNVERIFIED` (chưa đo lại).

| Dự án | Vị trí | Trạng thái |
|---|---|---|
| Web `omdala.com` | `apps/web` | Dòng OMCODE: 10 trang song ngữ prerender `[lang]`. Nhánh `claude/`: đổi ngôn ngữ phía client, mọi trang cùng canonical `/` (đo trên build hôm nay) |
| App `app.omdala.com` | `apps/app` | OMCODE: 28 route, magic-link + HttpOnly (ADR-006). Production `/workspace` trả 404 (PR #10) |
| Auth `auth.omdala.com` | `apps/auth` | OMCODE: 2 route, `/` chuyển tới `/login`. Production `/` trả 200 kèm `next_error` (PR #10) |
| Admin `admin.omdala.com` | `apps/admin` | OMCODE: 7 route. Nhánh `claude/`: mock luôn cấp quyền admin |
| Docs `docs.omdala.com` | `apps/docs` | 4 route, handoff yêu cầu 10 route + 18 redirect tương thích |
| API `api.omdala.com` | `services/api` | OMCODE: `index.ts` 3.996 dòng, tenant guard, 19 file test. Production `/health` timeout/522 (2026-10-08) |
| Brand Exchange | `apps/brand-marketplace` | 15 route EN/VI, chưa có staging |
| Om AI | `om-ai.omdala.com` | 395 file, gateway/backend/web/mobile có job CI riêng |
| Billing | `packages/billing` | Có test trong CI |
| OMCode Desktop | `apps/omcode-desktop` | PR #11, #12 (cổng credential). Charter §4 ghi non-goal, nhưng repo đã chứa: coi là lane riêng, ngoài tự động hóa |
| Omniverse | — | PARKED (ADR-0001, Founder duyệt 2026-07-31) |
| OMDALAT, Omone, Computer Gen1 | repo/dự án riêng | Ngoài phạm vi |

Phán quyết hiện hành: `HOLD / NO_GO`. `FINAL-01..10` đều `BLOCKED`.

## 3. Hai dòng mã nguồn và quyết định nền (D-001)

Sự thật đã kiểm chứng:

- `main` dừng ở 63433d3 (2026-04-05), trước khi có monorepo. Đường đưa monorepo vào `main` là **PR #10** (`OMCODE/go-live-e2e-20260829`, 7b42320, 92 commit, 1.528 file). Mọi check xanh trừ `Independent Exact-SHA Review` (failure, chưa có approval).
- **PR #13** (draft, 373a59e) xếp chồng trên 7b42320 và đang xanh CI.
- **PR #1** (nhánh này, 233aa02, 38 commit, 309 file) nhắm vào `main`, CI xanh nhưng còn **28 phát hiện review chưa xử lý** (5 mức High). Nó xây trên nền cũ: thiếu auth thật, tenant guard, `[lang]`, billing, brand-marketplace.
- Review PR #10 gắn với SHA cụ thể: mọi thay đổi vào đầu PR #10 làm mất giá trị review. Tự động hóa **không bao giờ** đẩy lên nhánh `OMCODE/*`.

| Lựa chọn | Nội dung | Đánh giá |
|---|---|---|
| **A. Xếp chồng (khuyến nghị)** | Founder chỉ định SHA nền (7b42320 hoặc 373a59e) và tên nhánh tích hợp. Tự động hóa áp việc thương hiệu/cấu trúc lên đó, người mở PR xếp chồng như #5–#13, đóng PR #1 sau đó | Không đụng SHA đang review. Phải thích nghi theo kiến trúc OMCODE |
| B. Chờ | Không làm Phase 1 tới khi PR #10 merge, rồi rebase | An toàn nhất, không có hạn |
| C. Merge PR #1 vào `main` trước | — | **Không khuyến nghị**: xung đột với PR #10, đưa mock-auth vào `main` |

Mặc định khi chưa có câu trả lời: **B** (tự động hóa chỉ làm Phase 0 rồi chờ).

## 4. Hợp đồng tự động

### 4.1 Được làm

- Đọc: GitHub API chỉ đọc cho repo này, `git fetch`, `git show origin/<nhánh>:<file>`.
- Sửa mã, test, tài liệu trên **một** nhánh: `claude/omdala-brand-system-L4Gzx` (sau D-001 còn thêm nhánh tích hợp Founder cấp tên).
- Sửa workflow xác minh `build.yml`, `lint.yml`. Chạy dev server và trình duyệt cục bộ.
- Commit nhỏ, push thường (không force), cập nhật `DEV_LEDGER.md`.

### 4.2 Không bao giờ làm

- Push nhánh khác; force-push; đổi lịch sử; xóa nhánh.
- Tạo, merge, đóng PR; approve review; đổi cài đặt GitHub (environments, rulesets, secrets). Mở PR chỉ khi D-002 cho phép.
- Deploy; `wrangler`, `psql`, `terraform` tới hệ thống thật; DNS; mua dịch vụ; gọi API trả phí.
- Đọc, in, tạo, đổi secret hoặc giá trị `.env`. Đổi id, route, account trong `wrangler.toml`. Sửa `deploy-*.yml`.
- Merge hay sửa nhánh `OMCODE/*`, `feat/*`. Sửa `docs/99-archive/`.
- Ghi `VERIFIED_CURRENT` cho thứ chưa đọc lại được từ nguồn thật.

Cần việc thuộc 4.2: ghi `HUMAN_GATE` vào ledger, dừng WP đó, chuyển sang WP khác.

### 4.3 Điều kiện dừng

- `preflight` thất bại (sai nhánh, cây bẩn, nhánh lệch với remote, ledger không `ACTIVE`).
- Kiểm chứng thất bại và không sửa được trong cùng chu kỳ: ghi `FAILED`, không push mã hỏng.
- `scan-staged` thấy mẫu secret.
- **Cầu dao**: 2 chu kỳ liên tiếp `FAILED` thì đặt `AUTOMATION: PAUSED`, push, tắt routine, thông báo người dùng.
- Người có thể dừng bất cứ lúc nào bằng cách đổi `AUTOMATION: ACTIVE` thành `PAUSED` trong ledger rồi push (hoặc tắt routine).

### 4.4 Từ vựng bằng chứng

Dùng đúng từ vựng của `INFRA_CROSS_TEAM_TASK_MANIFEST` (dòng OMCODE):

| Mức | Nghĩa trong kế hoạch này |
|---|---|
| `VERIFIED_WORKTREE_ONLY` | Kiểm chứng cục bộ trước khi commit |
| `VERIFIED_HEAD_ONLY` | Đã commit và push, kiểm chứng cục bộ tại SHA đó |
| `VERIFIED_CURRENT` | CI xanh tại đúng SHA đó, đọc lại qua Actions API |
| `REPORTED_UNVERIFIED` | Lấy từ tài liệu hoặc bên thứ ba, chưa đo lại |
| `NOT_CHECKED`, `BLOCKED`, `CONTRADICTED` | Như nguồn |

## 5. Lộ trình

Trạng thái WP: `TODO`, `DONE`, `FAILED`, `BLOCKED` (chờ quyết định), `HUMAN_GATE`. Loại: **AUTO** là tự động làm được.

### Phase 0: sửa nợ trên nhánh này và gom sự thật (AUTO, không cần quyết định)

Mã `R-nn` là phát hiện review PR #1, bảng ở ledger mục 6.

| ID | Việc | Hoàn thành khi |
|---|---|---|
| P0-01 | SEO đúng từng trang: chuyển mọi `head.tsx` sang Metadata API qua `buildMetadata`, xóa `head.tsx`, `noindex` theo `OMDALA_NOINDEX` (R-14, R-15) | Trong `apps/web/out` mười trang có `canonical` và `title` khác nhau và đúng. Có test đọc `out/` fail nếu hai trang trùng canonical |
| P0-02 | Ba lỗi High sửa tại chỗ: redirect `//` và `/\` (R-04), TLS DB mặc định xác thực (R-03), admin từ chối mặc định (R-01) | Test đơn vị cho từng lỗi. `.env.example` chỉ thêm tên biến, không giá trị |
| P0-03 | Phân loại 28 phát hiện ở ledger mục 6: trạng thái ở nhánh này và ở dòng OMCODE (đọc bằng `git show`) | 28/28 có `FIXED / OPEN / MOOT_ON_CANONICAL / HUMAN_GATE` kèm lệnh tái lập |
| P0-04 | Script và SQL: `\ir`, `ON_ERROR_STOP`, `curl --fail`, thứ tự consistency check (R-18, R-22..R-25) | `shellcheck` sạch, mỗi script lỗi SQL/HTTP thì thoát khác 0 |
| P0-05 | Trung thực: nút Save draft vô hiệu hóa có nhãn (R-08, R-09), bỏ nhánh dự phòng trong e2e (R-11), test gọi code thật (R-26), trang docs API chỉ liệt kê route đã cài (R-28) | Test xanh, không còn test chấp nhận kết quả ngược |
| P0-06 | i18n và robots: một nguồn robots (R-07, R-10, R-13, R-17), ngôn ngữ sẵn sàng theo bề mặt (R-19), `buildLanguageAlternates` đúng `locales` (R-20), switcher giữ query (R-21) | `out/robots.txt` đúng chính sách từng host, test cho alternates và switcher |
| P0-07 | CI chạy test API (R-06); không đổi `deploy-*.yml` | CI xanh tại SHA mới (`VERIFIED_CURRENT`) |
| P0-08 | Font tự host Inter 400–700 và Sora 600–700 trong `@omdala/ui`, bỏ `@import` Google | Cả 4 app: `document.fonts` có Sora và Inter ở trạng thái loaded, 0 request tới Google Fonts |
| P0-09 | `brand:check` bắt cả `rgba()`, hex 3 ký tự, tên màu (allowlist trung tính trắng/đen) và chuyển phần còn lại sang token | `pnpm brand:check` xanh, 0 màu thô ngoài allowlist |
| P0-10 | Bản đồ port `PORT_MAP_OMCODE_LINE.md`: mỗi nhóm thay đổi của nhánh này (tokens, assets, component dùng chung, docs index, import theo tên package) ở dòng OMCODE là absent/present/divergent, file đích, rủi ro, thứ tự áp | Phủ 100% nhóm thay đổi, mỗi dòng có lệnh tái lập |
| P0-11 | Bản đồ docs dòng OMCODE `DOCS_CONSOLIDATION_MAP_OMCODE_LINE.md`: phân loại 100% file `.md` (FROZEN/PLAN/SPEC/OPS/STRATEGY/STRAY), cờ safe-to-move từ tham chiếu ngược (manifest, test, workflow, script) | Số dòng bảng bằng số file `.md` ở SHA ghim. Tập FROZEN liệt kê rõ (`docs/audit`, `docs/governance`, `docs/00_governance`, `docs/contracts`, `docs/release-evidence`, `docs/adr`, ADR) |
| P0-12 | Triage Dependabot #14, #15 (đọc diff, CI, rủi ro) | Khuyến nghị merge hoặc không, ghi ledger. Người merge |

Sau P0-12, khi D-001 còn chưa trả lời: chu kỳ BUILD chỉ chạy bước đồng bộ trạng thái (mục 6, bước 2) và báo cáo tuần vẫn chạy.

### Phase 1: hợp nhất trên nền chuẩn (cần D-001 = A, hoặc B sau khi PR #10 merge)

| ID | Việc | Hoàn thành khi |
|---|---|---|
| P1-01 | Ghim SHA nền, tạo nhánh tích hợp, chạy bộ kiểm chứng gốc của dòng đó **trước** khi sửa | Biên bản base-health: lệnh, kết quả, SHA |
| P1-02 | Một nguồn token: đọc `packages/brand-core` và `packages/ui` ở dòng đó, chọn chủ sở hữu token, áp tokens và assets | Mọi app dùng token, `brand-lint` xanh |
| P1-03 | Gỡ 8 bản copy LanguageSwitcher/LocaleLink, giữ hành vi `[lang]` + cookie (ADR-002, ADR-011) | E2E ngôn ngữ của dòng đó xanh |
| P1-04 | Hợp nhất `scripts/brand-lint-omdala.sh` và `brand:check` thành một cổng trong `ci.yml` | CI xanh |
| P1-05 | Mục lục docs cho dòng đó theo bản đồ P0-11, chỉ di chuyển file có cờ safe-to-move | `pnpm test:release-governance` xanh, hash trong manifest không đổi |
| P1-06 | Hợp nhất `CLAUDE.md` với `.github/copilot-instructions.md` và `OMCODE_AI_SOURCE_POLICY_2026-09-27.md` | Không mâu thuẫn |
| P1-07 | Gói PR sẵn sàng: mô tả, bằng chứng, rủi ro, thứ tự merge | File trong `docs/06-strategy/reports/` |

### Phase 2: hoàn thiện lõi ở mức mã nguồn (AUTO trên nhánh tích hợp, phạm vi Beta)

| ID | Việc | Ghi chú |
|---|---|---|
| P2-01 | Danh tính phát hành: mọi bề mặt xuất `/release.json` (SHA, thời điểm build) và 404 ngữ nghĩa đúng | Production đang thiếu `/release.json` (PR #10) |
| P2-02 | Docs: 10 route bắt buộc và 18 redirect tương thích theo `TEAM_HANDOFF_REQUIREMENTS_OMDALA_DOCS_APP.md`, EN/VI | Có test route, redirect, SEO |
| P2-03 | App: bảng khác biệt route (nodes/resources/offers/requests so với places/hosts/experts/communities/events/proofs). Code sau D-004 | Phân tích AUTO, triển khai chờ D-004 |
| P2-04 | Bộ test SEO theo bề mặt: canonical, hreflang, robots, sitemap, noindex cho app/admin/auth/api | Job CI mới |
| P2-05 | Trợ năng: axe cho trang chính, sửa lỗi serious và critical | Báo cáo 0 serious/critical |
| P2-06 | Ma trận responsive (Playwright devices) và trạng thái lỗi khi API/AI không sẵn | Trace lưu ở CI artifacts |
| P2-07 | Ngân sách hiệu năng: Lighthouse mobile ≥ 90 (Charter §6) trên `out/` | TTFB đo ở runtime thuộc Phase 4 |
| P2-08 | Idempotency bền vững cho billing/queue/provider (hợp đồng API 2026-10-07 ghi chưa đóng): thiết kế và test | Chặn bởi cổng H3 (data authority) |

### Phase 3: hạ tầng và staging (`HUMAN_GATE`)

Tự động hóa chỉ giữ cho mỗi gói quyết định luôn đúng và đủ: việc cần quyết định, người quyết, bằng chứng yêu cầu, lệnh đọc lại. Danh sách ở mục 8.

### Phase 4–5: chấp nhận staging (G5) và phát hành (G6)

Team 4 phát `GO_RECOMMENDED` hoặc `HOLD`, Founder ký GO (`REL-001`). Tự động hóa giữ E2E cục bộ xanh tại SHA ứng viên, lập gói phát hành rồi dừng.

### Backlog sau Beta (không lên lịch tới khi `REL-001` = GO)

zh/es/ja/ko (ADR-003 chỉ chừa code path), giao diện thanh toán, mobile native, tích hợp bên thứ ba, white-label, phân cấp 10 quốc gia (`START_HERE.md`), Zero Overdue (`OMDALA_SCALE_MVP_PLAN_2026.md`), Om AI đầy đủ, phân phối OMCode.

## 6. Giao thức mỗi chu kỳ

```
0. Định hướng   Đọc CLAUDE.md, mục 4 và 6 của file này, DEV_LEDGER.md.
                Ledger ghi `AUTOMATION: PAUSED` hoặc thiếu file: dừng, báo 1 dòng.
1. Preflight    bash scripts/dev-cycle.sh preflight
                Mã thoát khác 0: dừng, ghi nguyên nhân vào ledger.
2. Đồng bộ      Chỉ đọc: PR #1, #10, #13, #14, #15; CI của SHA đầu nhánh; head các nhánh
                OMCODE. Cập nhật ledger mục 4. Nâng bằng chứng WP lên VERIFIED_CURRENT
                nếu CI xanh tại đúng SHA.
3. Chọn việc    WP đầu tiên theo thứ tự mục 5 có: trạng thái TODO, phụ thuộc DONE, loại AUTO,
                mọi quyết định cần có đã ghi trong ledger mục 2.
                Không có: không commit; chỉ ghi 1 dòng "idle: chờ <lý do>" nếu lý do đổi
                so với lần trước, rồi kết thúc.
4. Làm          Một WP mỗi chu kỳ, commit nhỏ, không mở rộng phạm vi. WP quá lớn: tách WP
                con vào ledger và làm phần đầu.
5. Kiểm chứng   pnpm install --frozen-lockfile        (khi lockfile đổi)
                pnpm typecheck && pnpm build && pnpm lint && pnpm brand:check
                pnpm --filter @omdala/api test
                Kiểm tra riêng của WP. Đổi giao diện: chạy app và chụp màn hình bằng trình duyệt thật
                (chromium ở /opt/pw-browsers/chromium).
                git add <file cụ thể> && bash scripts/dev-cycle.sh scan-staged
6. Ghi nhận     Commit (kèm 2 dòng attribution), git push -u origin <nhánh>
                (lỗi mạng: thử lại 2s, 4s, 8s, 16s), cập nhật ledger, commit và push ledger.
7. Báo cáo      Tối đa 5 dòng: WP, kết quả, SHA, việc đang chờ người.
8. Cầu dao      Theo 4.3. Cần người quyết định: một PushNotification, tối đa 2 câu.
```

## 7. Lịch tự động

Trạng thái 2026-10-27: **chưa bật routine nào**. Người dùng yêu cầu chờ (VS Code đang làm) và chỉ chuyển sang audit khi được yêu cầu. Bảng dưới là lịch đề xuất, chỉ tạo sau khi Founder duyệt và ledger chuyển sang `AUTOMATION: ACTIVE`.

| Routine | Lịch | Việc |
|---|---|---|
| OMDALA dev cycle | Mỗi 6 giờ | Giao thức mục 6 (BUILD) |
| OMDALA weekly review | Thứ Hai 08:56 giờ Việt Nam | Chỉ đọc và báo cáo: tiến độ, cổng đang chờ người, rủi ro, đề xuất ưu tiên. Ghi `docs/06-strategy/reports/WEEKLY_<năm>-W<tuần>.md` |

Khi bật, cả hai chạy trong chính phiên này (giữ ngữ cảnh và nhánh được giao). ID routine ghi ở ledger mục 1.

- Dừng ngay: đổi `AUTOMATION: PAUSED` trong ledger rồi push, hoặc tắt routine.
- Đổi nhịp: nói với Claude hoặc dùng `update_trigger` với `cron_expression`.
- Mỗi lần push cập nhật PR #1 và chạy CI. Có thể có thêm lượt Copilot review.
- Chi phí bị chặn trên tới khi D-001 được trả lời: Phase 0 có 12 WP (khoảng 3 ngày ở nhịp 6 giờ), sau đó chu kỳ chỉ đọc trạng thái.

## 8. Cổng của con người để hoàn thành chuỗi

| # | Cổng | Chủ | Nguồn | Bằng chứng cần |
|---|---|---|---|---|
| H1 | D-001, D-002 (mục 3, ledger mục 2) | Founder | file này | Ghi vào ledger |
| H2 | Review độc lập exact-SHA cho PR #10 (check `Independent Exact-SHA Review` đang failure) | Team 4 | PR #10, `FINAL-03` | Approval cho đúng SHA |
| H3 | Account canonical và data authority (PostgreSQL qua Hyperdrive, hay D1) | Founder, Team 2, Team 4 | `ADR-TEAM2-WAVE0-DATA-AUTHORITY` (PROPOSED), `INFRA-003`, R-27 | ADR ký, resource ID đọc lại |
| H4 | Staging cô lập, các gate A0–A4 | Founder, Team 1, 2, 4 | `ADR-2026-10-26-OMDALA-STAGING` (PROPOSED) | Receipt A0–A4, ngân sách |
| H5 | GitHub: environments `staging`/`production`, ngăn tự review, rulesets | Repo admin | `FINAL-04` | Đọc lại cấu hình |
| H6 | Tạo Workers, D1, Hyperdrive, R2 cho staging | Chủ Cloudflare | `FINAL-05`, `FINAL-06` | ID và binding |
| H7 | DNS, TLS cho 5 hostname staging | Chủ DNS | `FINAL-07` | DNS có thẩm quyền, TLS |
| H8 | Xác minh host key SSH (đang khác `known_hosts`) | Chủ hạ tầng | `ssh-host-key-observation.json` | Xác minh qua provider console |
| H9 | OAuth và mail staging | Team 2, Team 3 | `FINAL-08`, `FINAL-09` | Receipt |
| H10 | Team AI ghim exact candidate | Team AI | `FINAL-02` | Bundle CI trên SHA sạch |
| H11 | Staging transaction và nghiệm thu độc lập | Team 1, Team 4 | `FINAL-10`, `QA-001` | `STAGING_ACCEPTED` |
| H12 | Diễn tập rollback và restore | Founder, Team 1 | `DR-001` | Receipt |
| H13 | Founder GO production | Founder | `REL-001` | Chữ ký GO |

## 9. Quyết định cần từ Founder

Chi tiết và trạng thái ở ledger mục 2.

- **D-001** nền mã nguồn: A, B hoặc C (mục 3). Mặc định B.
- **D-002** tự động hóa có được mở PR xếp chồng dạng draft sau mỗi mốc P1 không. Mặc định: không.
- **D-003** xác nhận phạm vi chuỗi ở mục 2. Mặc định: như bảng.
- **D-004** phân loại route app (cần khi tới P2-03). Mặc định: mô hình node là chuẩn, places/hosts/experts/communities/events/proofs là loại node.
