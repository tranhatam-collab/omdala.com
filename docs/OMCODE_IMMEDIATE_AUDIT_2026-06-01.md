# OMCODE Immediate Audit — 2026-06-01

## Scope
- Repo: `omdala.com`
- App: `apps/app` (OMCODE)
- Mục tiêu: kiểm tra khả năng dùng ngay, đối chiếu claim hoàn thành, xác định blocker thật.

## Verdict
- `NOT_READY_FOR_RELEASE`
- Lý do chính: có lỗi route/link hỏng và chưa có bằng chứng test/build pass ổn định cho `apps/app` (tiến trình check bị treo).

## Evidence Checked
- `git status --short`
- `pnpm --filter @omdala/core typecheck` (PASS)
- `pnpm --filter @omdala/app exec tsc --noEmit -p tsconfig.json` (treo, không trả output)
- `pnpm --filter @omdala/app test` (treo, không trả output)
- Rà source OMCODE:
  - `apps/app/app/components/SmartLayout.tsx`
  - `apps/app/app/omcode/landing/page.tsx`
  - `apps/app/app/workspace/components/AccountPanel.tsx`
  - `apps/app/app/workspace/components/AIChatPanel.tsx`
  - `apps/app/app/workspace/hooks/useTerminal.ts`
  - `apps/app/next.config.mjs`
  - `apps/app/public/`
  - `docs/OMCODE_PRODUCTION_READINESS_REPORT_2026-05-29.md`

## Findings

### P0 — Release gate chưa đạt
1. Không có bằng chứng test/typecheck ổn định cho `apps/app`:
   - `pnpm --filter @omdala/app exec tsc --noEmit -p tsconfig.json` treo.
   - `pnpm --filter @omdala/app test` treo.
   - Kết luận: chưa thể xác nhận "xanh hết" ở mức release.

### P1 — Lỗi chức năng có thể gặp ngay
1. Menu trỏ tới route không tồn tại:
   - `apps/app/app/components/SmartLayout.tsx:17` -> `/commitments`
   - `apps/app/app/components/SmartLayout.tsx:18` -> `/analytics`
   - Không thấy page tương ứng trong `apps/app/app`.

2. Action logout trỏ route không tồn tại:
   - `apps/app/app/components/SmartLayout.tsx:66` -> `/auth/logout`
   - Không có file route logout trong `apps/app/app`.

3. Landing page link docs bị sai runtime:
   - `apps/app/app/omcode/landing/page.tsx:169` -> `/docs/OMCODE_TERMS_OF_SERVICE.md`
   - `apps/app/app/omcode/landing/page.tsx:171` -> `/docs/OMCODE_USER_GUIDE.md`
   - `apps/app/public/` hiện không có thư mục `docs`; 2 file docs chỉ tồn tại ở root repo `docs/`.

### P2 — Debt kỹ thuật cần xử lý trước beta mở rộng
1. `AICommandPalette` nhận prop nhưng chưa dùng:
   - `apps/app/app/ai/AICommandPalette.tsx:23,30` (`onExecuteAction` unused).

2. Terminal cho phép lệnh xóa trực tiếp trong browser workspace:
   - `apps/app/app/workspace/hooks/useTerminal.ts:257-266` (`rm` gọi `removeEntry(..., { recursive: true })`).
   - Cần confirm gate cứng hơn trước khi bật cho production user.

3. Báo cáo readiness đang tuyên bố cao hơn bằng chứng runtime:
   - `docs/OMCODE_PRODUCTION_READINESS_REPORT_2026-05-29.md:5` ghi `96% production-ready`.
   - Nhưng check thực thi hiện tại chưa chứng minh được test/typecheck app pass.

## Team Action Board (dùng ngay)

### Team 1 (App Routing + UX Integrity)
1. Sửa/loại bỏ link chết trong `SmartLayout`:
   - `/commitments`, `/analytics`, `/auth/logout`.
2. Thêm route thật hoặc đổi sang route đang tồn tại.
3. Verify nhanh:
   - Click test toàn bộ item menu + command palette nav.

### Team 2 (Content/Docs Runtime + SEO Surface)
1. Quyết định cách serve docs:
   - Copy docs vào `apps/app/public/docs/` hoặc tạo page route render markdown.
2. Sửa link footer landing theo URL runtime thật.
3. Verify:
   - `curl -I` hoặc browser check 200 cho 2 URL docs.

### Team 3 (Build/Test Stability)
1. Điều tra nguyên nhân treo `tsc` và `vitest` ở `apps/app`.
2. Chia nhỏ check:
   - chạy từng test file trước,
   - bật log verbose,
   - khoanh vùng hook/browser API gây treo (`useFileSystem`, jsdom env, watch handle).
3. Gate bắt buộc:
   - `pnpm --filter @omdala/app exec tsc --noEmit -p tsconfig.json` phải exit 0.
   - `pnpm --filter @omdala/app test` phải exit 0.

## True State
- Core workspace có nhiều phần đã làm thật.
- Tuy nhiên trạng thái hiện tại chỉ phù hợp `BETA_INTERNAL`, chưa đạt `RELEASE_READY`.
- Không nên công bố "production-ready" cho OMCODE đến khi đóng hết P0 + P1 và có log pass thật cho test/typecheck app.

---

## Claim Recheck (Update)

Đối soát theo báo cáo "6/7 blocker đã fix":

1. **Route trùng JS/TS**: `PASS`
   - `apps/app/app/page.js` và `apps/app/app/layout.js` đã bị xóa.

2. **Nav 404 `/commitments`, `/analytics`**: `PASS`
   - Đã comment out trong `apps/app/app/components/SmartLayout.tsx`.

3. **Legal docs 404**: `PASS (code-level)`
   - Link đổi sang domain docs ngoài tại `apps/app/app/omcode/landing/page.tsx`.
   - Chưa có bằng chứng HTTP 200 trong audit này.

4. **Stale session verify on mount**: `PASS`
   - `verifyGatewayToken()` đã gọi trong `React.useEffect` của `AccountPanel`.

5. **Gateway-first chat + fallback local**: `PASS`
   - Có `loadGatewayAccount()` + `routeViaGateway()` và fallback `modelRouter.route()`.

6. **Destructive rm/mv confirm**: `PASS`
   - `rm` có `confirm()`.
   - `mv` đã thêm `confirm()` tại `useTerminal.ts:216-218`.

7. **Dead logout route `/auth/logout`**: `PASS`
   - Đã chuyển thành client-side logout (xóa localStorage keys + redirect `/`).
   - `SmartLayout.tsx:66-68`.

8. **Runtime env vs code**: `ENV LIMITATION`
   - `node -e` cũng treo trong IDE sandbox — confirmed environment constraint, không phải code issue.
   - `next build`, `tsc`, `vitest` đều không thể chạy trong sandbox này.
   - **Action**: run local commands (see below).

---

## Local Verification (run on your machine)

```bash
cd /Users/tranhatam/Documents/Devnewproject/omdala.com/apps/app
rm -rf node_modules
pnpm install
pnpm exec tsc --noEmit -p tsconfig.json
pnpm exec next build
pnpm test
```

Expected: all exit 0.
