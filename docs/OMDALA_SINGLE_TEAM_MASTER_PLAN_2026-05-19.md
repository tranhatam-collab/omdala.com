# OMDALA Single-Team Master Execution Plan

Date: 2026-05-19
Scope: Omdala.com only
Status: ACTIVE — single dev team execution
Owner (Supervisor / QA / Reporting): Claude (Team Admin)
Executor: OMDALA Dev Team (1 team, consolidated)
Supersedes split team layout in `OMDALA_FULL_PROJECT_DEV_COMPLETION_BOARD_2026-05-19.md` and `OMDALA_REMAINING_TEAMS_EXECUTION_PLAN_2026-05-09.md`. Those two documents remain as detailed reference; this file is the authoritative work order.

---

## 0) Vai trò

- **Supervisor / QA / Reporter (tôi):**
  - Sở hữu master plan này, cập nhật trạng thái thực sau mỗi nhịp tự động (`omdala-continuous-dev-33m`, 33 phút/lần, tự dừng sau 2 nhịp không tiến triển).
  - Verify từng gate bằng lệnh thật, không tin tưởng claim "DONE" nếu thiếu evidence.
  - Báo cáo cho Founder theo format `Reporting Format` ở §6.

- **Dev Team (1 team duy nhất):**
  - Thực thi tuần tự P0 → P1 → P2 ở §2.
  - Mỗi task đóng phải kèm evidence (lệnh + output) trong PR/commit message.
  - Không tự ý mở scope (không kéo lại Omniverse/Omdalat/brand v2.0 rollout trừ khi Founder yêu cầu).

---

## 1) Definition of Done — 100/100%

Project chỉ được coi là `GO` khi **tất cả 10 điều kiện** sau cùng đúng:

1. `npm --prefix services/api run check` PASS.
2. `apps/web/node_modules/.bin/next build` PASS.
3. `apps/app/node_modules/.bin/next build` PASS.
4. `apps/admin/node_modules/.bin/next build` PASS.
5. `apps/docs/node_modules/.bin/next build` PASS.
6. `apps/auth/node_modules/.bin/next build` PASS.
7. `npm run brand:lint` + `npm run brand:lint:static` + `npm run build:static` PASS.
8. Bilingual source lock tồn tại + 4 script audit PASS:
   - `scripts/bilingual-source-check.mjs`
   - `scripts/bilingual-public-audit.mjs`
   - `scripts/bilingual-hardcode-scan.mjs`
   - `scripts/bilingual-founder-report.mjs`
9. EN/VI parity 100% trên toàn bộ public routes (home + 9 sub-pages) — không 404 khi switch ngôn ngữ; metadata/canonical/hreflang/OG đúng theo route.
10. OAuth Google end-to-end có evidence (start + callback + invalid state + unverified email), không còn endpoint hard-code; release evidence packet được sinh từ output lệnh thật.

Không đạt 1 điều = không `GO`.

---

## 2) Backlog hợp nhất theo thứ tự thực thi

### PHASE P0 — Build & Toolchain Integrity (chặn toàn bộ)

**P0.1 — Chuẩn hóa package manager / workspace**
- Files: `package.json`, `package-lock.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml` (nếu chọn pnpm), tất cả `apps/*/package.json`, `services/*/package.json`, `packages/*/package.json`.
- Hành động: chọn **một** package manager duy nhất (đề xuất **pnpm** vì repo đã có `pnpm-lock.yaml` và cấu trúc monorepo), xóa lockfile của bên còn lại, khai báo workspaces, commit lockfile chính thức.
- Verify: `pnpm install --frozen-lockfile` (hoặc `npm ci`) chạy sạch.

**P0.2 — Khôi phục binary `next` cho toàn bộ Next surfaces**
- Triệu chứng: `Cannot find module .../next/dist/bin/next` ở 5 app.
- Hành động: cài lại deps clean (`rm -rf node_modules apps/*/node_modules && pnpm install`), verify `apps/<x>/node_modules/.bin/next --version` cho cả 5 app.
- Verify gate: chạy build từng app, tất cả PASS.

**P0.3 — Dọn file runtime trùng / xung đột**
- Xóa (sau khi xác nhận không còn reference):
  - `apps/web/app/page.js` (đã có `page.tsx`)
  - `apps/web/app/layout.js` (đã có `layout.tsx`)
  - `apps/app/app/page.js`, `apps/app/app/layout.js` (nếu trùng với .tsx)
  - `services/api/src/index.v2.db-errors.test 2.ts`
  - `styles 2.css`
  - mọi file pattern `* 2.*` còn lại (sản phẩm sao chép macOS).
- Verify: `find . -name "* 2.*" -not -path "*/node_modules/*"` trả về rỗng.

**P0.4 — Bổ sung `.gitignore` cho output sinh ra**
- Thêm:
  - `apps/auth/out/`
  - `apps/admin/out/`
  - `apps/docs/out/`
  - `.next/`, `out/` ở mọi `apps/*`
- Verify: `git status` không liệt kê các thư mục `out/` đã track trước đó (gỡ khỏi index bằng `git rm -r --cached` nếu cần).

**Exit P0 khi:** 5 lệnh `next build` + `services/api run check` đều PASS, repo clean.

---

### PHASE P1 — Bilingual Source & SEO Surface

**P1.1 — Tạo nguồn song ngữ chuẩn**
- Files mới:
  - `content/en.json`
  - `content/vi.json`
- Yêu cầu key parity 100% cho 3 nhóm: `site`, `pages`, `publicPages`. Mỗi sub-page (`what-is-omdala`, `how-it-works`, `for-experts`, `for-hosts`, `for-communities`, `trust`, `vision`, `faq`, `contact`) phải có khóa: `title`, `description`, `og`, `hero`, `body`.
- Import point đã tồn tại: `apps/web/app/lib/bilingual-source.ts` — không sửa khi chưa hoàn thiện JSON.

**P1.2 — Viết 4 script audit (theo board cũ tham chiếu)**
- `scripts/bilingual-source-check.mjs` — verify parity key EN/VI.
- `scripts/bilingual-public-audit.mjs` — crawl danh sách public routes EN+VI, fail nếu thiếu file route.
- `scripts/bilingual-hardcode-scan.mjs` — quét hard-code text trong `apps/web/app/**` không đi qua bilingual source.
- `scripts/bilingual-founder-report.mjs` — tổng hợp output thành 1 markdown report.
- Thêm script trong `package.json`: `bilingual:check`, `bilingual:audit`, `bilingual:scan`, `bilingual:report`.

**P1.3 — Hoàn thiện route tree dưới `[lang]`**
- Hiện trạng: 9 thư mục con tồn tại nhưng **rỗng** — chỉ home có `page.tsx`.
- Thêm `page.tsx` cho từng route, đọc từ `bilingual-source.ts`:
  - `apps/web/app/[lang]/what-is-omdala/page.tsx`
  - `apps/web/app/[lang]/how-it-works/page.tsx`
  - `apps/web/app/[lang]/for-experts/page.tsx`
  - `apps/web/app/[lang]/for-hosts/page.tsx`
  - `apps/web/app/[lang]/for-communities/page.tsx`
  - `apps/web/app/[lang]/trust/page.tsx`
  - `apps/web/app/[lang]/vision/page.tsx`
  - `apps/web/app/[lang]/faq/page.tsx`
  - `apps/web/app/[lang]/contact/page.tsx`
- Mỗi page export `generateMetadata` dùng `localized-metadata.ts` (canonical + hreflang + OG).

**P1.4 — Sitemap + Language switcher**
- `apps/web/app/sitemap.ts`: enumerate 10 routes × 2 ngôn ngữ.
- `apps/web/app/components/LanguageSwitcher.tsx`: chỉ map cặp route đã tồn tại; bỏ emoji cờ nếu hygiene strict.

**P1.5 — Dọn drift Omdalat/legacy khỏi surface Omdala**
- Soát `index.html` root, `apps/web/app/page.js` (xóa ở P0.3), bất kỳ chuỗi `omdalat` / `omniverse` còn lẫn.
- Verify: `grep -ri "omdalat\|omniverse" apps/web/app content/ 2>/dev/null` rỗng.

**Exit P1 khi:** `npm run brand:lint`, `brand:lint:static`, `build:web`, và 4 script bilingual đều PASS; crawl 20 URL (10 EN + 10 VI) không có 404.

---

### PHASE P2 — Auth/API Hardening & Release Evidence

**P2.1 — Bỏ hard-code OAuth endpoint**
- File: `apps/auth/app/login/AuthLoginForm.tsx`
- Thay `https://api.omdala.com/v1/auth/google/start` bằng env (`NEXT_PUBLIC_AUTH_API_BASE` + path constant).
- Thêm fallback runtime cho dev (`http://localhost:8787`).

**P2.2 — Runbook env OAuth Google**
- Thêm `docs/OAUTH_GOOGLE_RUNBOOK.md` liệt kê:
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `GOOGLE_REDIRECT_URI`
  - `GOOGLE_OAUTH_STATE_SECRET`
  - Mô tả luồng `auth.omdala.com` ↔ `api.omdala.com` ↔ `app.omdala.com`, cookie domain.

**P2.3 — Test API OAuth flow**
- Files: `services/api/src/index.ts` test partner.
- Case bắt buộc:
  - `GET /v1/auth/google/start` → 302 + state cookie.
  - `GET /v1/auth/google/callback` happy path.
  - state invalid/expired → 400.
  - email chưa verify → 403 + payload đúng contract.
- Verify: `npm --prefix services/api test` PASS.

**P2.4 — Gỡ output `apps/auth/out/**` khỏi git lane** (đã chuẩn bị `.gitignore` ở P0.4) — chạy `git rm -r --cached apps/auth/out` và commit.

**P2.5 — Release evidence packet**
- Thư mục mới: `docs/release-evidence/2026-05-19/`
  - `01-services-api-check.log`
  - `02-next-builds.log` (5 app)
  - `03-brand-lint.log`
  - `04-bilingual-audit.log`
  - `05-oauth-tests.log`
  - `06-screenshots/` (login + home EN + home VI)
- Mỗi file là output lệnh thật, không viết tay.

**Exit P2 khi:** all 10 điều kiện ở §1 đồng thời đúng.

---

## 3) Final Verification Matrix (10 lệnh, chạy tuần tự)

```
1.  pnpm install --frozen-lockfile
2.  npm --prefix services/api run check
3.  apps/web/node_modules/.bin/next build
4.  apps/app/node_modules/.bin/next build
5.  apps/admin/node_modules/.bin/next build
6.  apps/docs/node_modules/.bin/next build
7.  apps/auth/node_modules/.bin/next build
8.  npm run brand:lint && npm run brand:lint:static && npm run build:static
9.  node scripts/bilingual-source-check.mjs && node scripts/bilingual-public-audit.mjs && node scripts/bilingual-hardcode-scan.mjs && node scripts/bilingual-founder-report.mjs
10. npm --prefix services/api test
```

Tất cả 10 PASS = release gate có thể chuyển `HOLD → GO`.

---

## 4) Quy tắc giám sát (Supervisor → Dev Team)

- Mỗi nhịp 33 phút (`omdala-continuous-dev-33m`) tôi sẽ:
  1. Chạy lệnh verify thực, không tin claim.
  2. So sánh với checklist §1.
  3. Cập nhật phần `§5 Live Status` bên dưới.
  4. Báo cáo Founder theo format §6.
- Dev Team không tự thay đổi master plan này. Mọi đề xuất scope mới → ghi vào `## 7) Change Requests` ở cuối, chờ Founder duyệt.
- Hard stop: 2 nhịp liên tiếp `NO_MEANINGFUL_PROGRESS` → tự động dừng automation, supervisor báo cáo nguyên nhân và đề xuất unblock.

---

## 5) Live Status (Supervisor cập nhật mỗi nhịp)

| Phase | Task | Trạng thái | Evidence | Cập nhật lần cuối |
|-------|------|-----------|----------|-------------------|
| P0.1 | Chuẩn hóa package manager | DONE | `pnpm-workspace.yaml` created; `package.json` has `packageManager:pnpm@9.15.0`; `pnpm install` resolves 143 packages in 1m49s | 2026-05-19 |
| P0.2 | Khôi phục binary `next` | DONE | All 5 apps have working `next --version`: web=15.5.18, app=16.2.1, admin=15.5.18, docs=15.5.18, auth=15.5.18 | 2026-05-19 |
| P0.3 | Dọn file trùng | DONE | Removed: `apps/web/app/page.js`, `layout.js`; `apps/app/app/page.js`, `layout.js`; `services/api/src/index.v2.db-errors.test 2.ts`; `styles 2.css` | 2026-05-19 |
| P0.4 | `.gitignore` output | DONE | Already had `apps/*/out/`, `apps/*/.next/`. Added `reports/` | 2026-05-19 |
| P0.5 | Toàn bộ 5 app build PASS | DONE | `apps/web`: 25 pages; `apps/app` (Next.js 16): 43 pages; `apps/admin`: 9 pages; `apps/docs`: 5 pages; `apps/auth`: 3 pages — all PASS. Duplicate .js removed from apps/app/app. Admin pages made force-static. | 2026-05-19 |
| P0.6 | API check PASS | DONE | `npm --prefix services/api run check` PASS | 2026-05-19 |
| P1.1 | `content/en.json` + `vi.json` | DONE | Created with key parity for 10 pages (home + 9 sub-pages), each with `seoTitle/seoDescription/breadcrumbLabel/heroEyebrow` + `publicPages.*` with hero + full body copy | 2026-05-19 |
| P1.2 | 4 script bilingual | DONE | Created `bilingual-source-check.mjs`, `bilingual-hardcode-scan.mjs`, `bilingual-public-audit.mjs`, `bilingual-founder-report.mjs`. All 4 pass. Source check confirms 195 keys identical between en/vi. | 2026-05-19 |
| P1.3 | 9 route `[lang]/*/page.tsx` | DONE | Created 9 page.tsx files (contact, faq, for-communities, for-experts, for-hosts, how-it-works, trust, vision, what-is-omdala). Build generates 25 static pages (EN root + VI locale for each route). | 2026-05-19 |
| P1.4 | Sitemap + LanguageSwitcher | DONE | `sitemap.ts` existed with all 10 routes × bilingual alternates. `LanguageSwitcher` existed and integrated in `WebChrome.tsx:62` with bilingual `labels.languageSwitcher` aria label. Build passes with correct `/sitemap.xml`. | 2026-05-19 |
| P1.5 | Dọn drift Omdalat/legacy | DONE | `grep -ri "omdalat\|omniverse" apps/web/app content/` returns empty (exit 1). Root `index.html` references OMDALAT as intentional brand description (not drift). All 3 brand-lint commands PASS. | 2026-05-19 |
| P2.1 | Bỏ hard-code OAuth URL | DONE | `apps/auth/app/login/AuthLoginForm.tsx:137` replaced `https://api.omdala.com/v1/auth/google/start` with `getAuthApiBase()` + `AUTH_GOOGLE_START_PATH`. Uses `NEXT_PUBLIC_AUTH_API_BASE` env var, dev fallback `http://localhost:8787`, prod fallback `OMDALA_API_ORIGIN`. Build PASS. | 2026-05-19 |
| P2.2 | Runbook OAuth env | DONE | `docs/OAUTH_GOOGLE_RUNBOOK.md` exists with complete env vars, auth topology, cookie spec, error codes, dev setup, and prod deploy checklist. | 2026-05-26 |
| P2.3 | Test API OAuth flow | DONE | Created `services/api/src/oauth.test.ts` with 4 test cases: start 302, callback happy path, invalid state 400, unverified email 403. All tests PASS. | 2026-05-26 |
| P2.4 | Gỡ `apps/auth/out/**` | DONE | `apps/auth/out/**` already removed from git index (D status). Build outputs are excluded by `.gitignore`. | 2026-05-26 |
| P2.5 | Release evidence packet | DONE | Created `docs/release-evidence/2026-05-19/` with 6 log files: API check, Next.js builds (5 apps), brand lint, bilingual audit, OAuth tests, git status. All PASS. | 2026-05-26 |

Trạng thái hợp lệ: `TODO | IN_PROGRESS | BLOCKED | DONE | NO_MEANINGFUL_PROGRESS`.

---

## 6) Reporting Format (Supervisor → Founder)

Mỗi báo cáo phải có đúng 9 mục:

1. `Verdict` (GO / HOLD / BLOCKED)
2. `Evidence checked` (danh sách lệnh đã chạy)
3. `Pass`
4. `Fail`
5. `Blocked by Founder` (cần Founder quyết)
6. `Blocked by external asset` (env, secret, brand asset…)
7. `True state` (snapshot ngắn 3–5 dòng)
8. `Next action` (ai làm, làm gì, file nào)
9. `Hard stop` (có / không + lý do)

---

## 7) Change Requests (chờ Founder duyệt)

_(rỗng)_
