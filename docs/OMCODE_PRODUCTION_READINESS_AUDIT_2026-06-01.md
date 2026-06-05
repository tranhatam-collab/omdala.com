# OMCODE Production Readiness Audit — 2026-06-01

**Kết luận:** `HOLD` — Chưa production-ready. Phù hợp **internal pilot** sau khi xử lý blocker.

---

## [P0] Build/Test runtime không xác minh được (treo)

- `next build`, `next --version`, vitest đều treo.
- Ảnh hưởng: Không có bằng chứng CI/runtime sạch.

## [P0] Route trùng `page.js`/`page.tsx` và `layout.js`/`layout.tsx`

- `allowJs: true` trong `tsconfig.json` làm cả JS và TSX cùng include.
- Trùng file tại `app/layout.tsx` + `app/layout.js` và `app/page.tsx` + `app/page.js`.
- Ảnh hưởng: Build/route không deterministic.

## [P1] Link điều hướng 404 trong UI

- Nav trong `SmartLayout.tsx` trỏ `/commitments` và `/analytics` — không có route.
- Ảnh hưởng: Trải nghiệm vỡ flow.

## [P1] Link pháp lý/docs ở landing có nguy cơ 404

- Landing trỏ `/docs/OMCODE_TERMS_OF_SERVICE.md` và `/docs/OMCODE_USER_GUIDE.md`.
- Không có mapping từ `apps/app/public/docs/*`.
- Ảnh hưởng: Fail legal/documentation surface.

## [P1] Account token không được verify khi restore session

- `AccountPanel.tsx` tin tưởng `localStorage` trực tiếp.
- `verifyGatewayToken()` tồn tại trong `gateway.ts` nhưng không được gọi trong mount flow.
- Ảnh hưởng: Trạng thái "connected" có thể stale/invalid.

## [P1] "API Gateway account" chưa nối vào luồng chat model thực

- Chat gọi `modelRouter.route(...)` trực tiếp, không dùng gateway token.
- Settings đẩy API key provider trực tiếp từ localStorage.
- Ảnh hưởng: Mismatch giữa "đăng nhập gateway" và "thực tế gọi model".

## [P2] Thao tác destructive chưa có confirm cứng

- `rm` thực thi trực tiếp trong terminal hook.
- Ảnh hưởng: Rủi ro xóa dữ liệu.

---

## Checklist Fix (Sprint 0 — 24h)

| # | Task | File | Priority |
|---|------|------|----------|
| 1 | Xóa route trùng JS legacy | `app/page.js`, `app/layout.js` | P0 |
| 2 | Sửa nav dead links | `SmartLayout.tsx` | P1 |
| 3 | Đưa legal docs vào public hoặc đổi link | `landing/page.tsx` | P1 |
| 4 | Bắt buộc `verifyGatewayToken()` khi mount | `AccountPanel.tsx` | P1 |
| 5 | Quyết định 1 luồng auth model | `AIChatPanel.tsx`, `SettingsPanel.tsx` | P1 |
| 6 | Confirm modal rm/mv | `useTerminal.ts` | P2 |
| 7 | Runtime check: `next build`, vitest | — | P0 |
