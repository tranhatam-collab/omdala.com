# OMDALA Architecture Decisions Record (ADR)

**Version:** 1.0  
**Status:** Active — append-only log  
**Date:** 2026-04-28  
**Owner:** Tech Lead  
**Governed by:** `docs/00_governance/PROJECT_CHARTER.md`

> **Append-only:** Mỗi decision có ID. Decision sai → tạo decision MỚI để override (KHÔNG xóa decision cũ).

---

## ADR-001 — Cloudflare-first hosting (LOCKED)
- **Date:** 2026-03 (initial), confirmed 2026-04-28
- **Status:** ACCEPTED
- **Decision:** Toàn bộ surfaces public deploy trên Cloudflare Pages + Workers + D1.
- **Rationale:** Edge global, free tier đủ cho beta, native binding D1.
- **Consequence:** Lock vào Wrangler CLI, KV/D1 cho persistence, không dùng Vercel/Netlify.

---

## ADR-002 — Next.js 15 App Router with `output: "export"` (LOCKED)
- **Date:** 2026-03
- **Status:** ACCEPTED
- **Decision:** Tất cả `apps/*` dùng Next.js 15 App Router với static export.
- **Rationale:** SEO tốt nhất, edge-deploy đơn giản, prerender đầy đủ.
- **Consequence:**
  - Pages KHÔNG dùng `searchParams` ở server component (cấm dynamic rendering)
  - Per-page `generateMetadata` bắt buộc cho canonical/hreflang
  - Language switching client-side (cookie + DocumentLanguageSync)

---

## ADR-003 — Bilingual EN+VI only (Phase Beta) (LOCKED)
- **Date:** 2026-04-22
- **Status:** ACCEPTED
- **Decision:** Phase Beta chỉ ship EN + VI. zh/es/ja/ko để code path nhưng KHÔNG generate trong build.
- **Rationale:** Founder-required scope discipline; tránh "bilingual fixed late".
- **Consequence:** `WEB_BILINGUAL_LANGUAGES = ['en', 'vi']`; postprocess script skip locale rỗng.

---

## ADR-004 — Vietnamese as semantic source-of-truth (LOCKED)
- **Date:** 2026-04-21
- **Status:** ACCEPTED
- **Decision:** Tiếng Việt là nguồn ngữ nghĩa. English phải khớp ý nghĩa.
- **Rationale:** Founder VN; market entry VN; better localization fidelity.
- **Consequence:** PR copy phải sửa cả 2 file song song; vi.json viết trước, en.json sau.

---

## ADR-005 — pnpm + workspace + Turborepo (LOCKED)
- **Date:** 2026-03
- **Status:** ACCEPTED
- **Decision:** Monorepo với pnpm workspace. Không build steps cho `packages/*` (point trực tiếp vào src).
- **Rationale:** Faster install, hoisting predictable, no `dist/` synchronization.
- **Consequence:** Tất cả `packages/*/package.json` có `"main": "./src/index.ts"`. Cần `transpilePackages` trong `next.config.mjs`.

---

## ADR-006 — Magic-link Auth + JWT + HttpOnly cookies (LOCKED)
- **Date:** 2026-04-09
- **Status:** ACCEPTED
- **Decision:** Auth dùng magic-link email + JWT signed token + HttpOnly cookie scope `.omdala.com`.
- **Rationale:** No password = less attack surface; HttpOnly = no XSS token theft; subdomain scope = single sign-on across `app.omdala.com`, `admin.omdala.com`.
- **Consequence:**
  - Auth host: `auth.omdala.com` (separate Pages app)
  - API: `api.omdala.com/v1/auth/session/exchange` for token → cookie exchange
  - CORS: `AUTH_ORIGIN` env var lock
  - Session validation server-side trước khi unlock dashboard

---

## ADR-007 — D1 SQLite for Omniverse (LOCKED)
- **Date:** 2026-04-09
- **Status:** ACCEPTED
- **Decision:** Omniverse backend dùng Cloudflare D1 (SQLite at edge) với 15-table schema.
- **Database ID:** `bb3ed0d8-8043-4843-a0cc-4b262c95779c`
- **Rationale:** Native CF binding, SQL familiar, low latency edge.
- **Consequence:**
  - Cấm dùng PostgreSQL trong scope Omniverse hiện tại
  - Schema migrations qua wrangler CLI
  - 64/64 tests phải pass khi deploy

---

## ADR-008 — Three-team structure with strict boundary (LOCKED)
- **Date:** 2026-04-09
- **Status:** ACCEPTED
- **Decision:** 3 teams: Team 1 (Om AI + User Core + Admin), Team 2 (Omniverse + Sys), Team 3 (Platform + Release).
- **Rationale:** Clear ownership, parallel execution, no overlap.
- **Consequence:** Cross-team change cần Founder Directive hoặc Team Admin approval. Xem `docs/TEAM_OWNERSHIP_MAP.md`.

---

## ADR-009 — Per-page `generateMetadata` REQUIRED (NEW 2026-04-28)
- **Date:** 2026-04-28
- **Status:** ACCEPTED
- **Decision:** Mọi public page (`apps/web/app/**/page.tsx`) phải export `metadata` hoặc `generateMetadata` qua `buildLocalizedMetadata()`.
- **Rationale:** Root layout `alternates.canonical: "/"` overflow xuống tất cả pages → canonical mismatch. Per-page metadata override fix triệt để.
- **Consequence:**
  - 10 EN pages + 10 VI pages cần metadata exports
  - Audit script enforce: 0 canonical_mismatch, 0 hreflang_mismatch
  - Khi thêm page mới → bắt buộc thêm metadata + bilingual entry
- **Evidence:** `reports/bilingual/public-audit.latest.json` 20/20 PASS

---

## ADR-010 — `getPageCopy` is generic for type narrowing (NEW 2026-04-28)
- **Date:** 2026-04-28
- **Status:** ACCEPTED
- **Decision:** `getPageCopy<K extends BilingualPageKey>(pageKey: K, language)` (generic) thay vì non-generic.
- **Rationale:** TypeScript narrow union type khi key được biết tại compile time. Fix `Property 'heroEyebrow' does not exist` errors.
- **Consequence:** Pages sử dụng `getPageCopy("faq", locale).heroEyebrow` typecheck OK.

---

## ADR-011 — Static export forbids `searchParams` server-side (NEW 2026-04-28)
- **Date:** 2026-04-28
- **Status:** ACCEPTED
- **Decision:** Pages với `dynamicParams = false` KHÔNG được nhận `searchParams` ở server component.
- **Rationale:** `await searchParams` forces dynamic rendering, conflict với `output: "export"`.
- **Consequence:**
  - Mass refactor 20 dashboard pages — done qua `scripts/fix-dashboard-searchparams.mjs`
  - Language switching → client-side only (cookie + URL prefix)
  - New pages tuân theo pattern này từ đầu

---

## ADR-012 — Audit scripts must be macOS-friendly (NEW 2026-04-28)
- **Date:** 2026-04-28
- **Status:** ACCEPTED
- **Decision:** Bilingual audit scripts dùng `fs.readFileSync` thay `execFileSync("cat")` và skip APFS `blocks=0` check.
- **Rationale:** macOS APFS lưu small files inline, `blocks=0` là legitimate. `execFileSync("cat")` bị `ETIMEDOUT` flaky.
- **Consequence:** Script chạy reliable trên cả darwin và linux CI.

---

## ADR template (cho future decisions)

```
## ADR-NNN — <Short title>
- **Date:** yyyy-mm-dd
- **Status:** PROPOSED / ACCEPTED / DEPRECATED / SUPERSEDED-BY-ADR-MMM
- **Decision:** ...
- **Rationale:** ...
- **Consequence:** ...
- **Evidence:** <link to PR/test/report>
```

---

## END OF ADR
*Append-only. KHÔNG xóa entries. Override = create new ADR with SUPERSEDES marker.*
