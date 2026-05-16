# OMDALA MASTER EXECUTION PLAN — 2026-04-27

**Version:** 2.0  
**Status:** ACTIVE — Team Admin Lock  
**Date:** April 27, 2026  
**Owner:** Trần Hà Tâm (Founder)  
**Admin:** Team Admin = Team 1  
**Governed by:**
- `DOCS_DEV/MASTER_DEV_EXECUTION_PROTOCOL_2026.md`
- `DOCS_DEV/UNIVERSAL_BILINGUAL_LANGUAGE_AND_SEO_REBUILD_MASTER_LOCK_2026.md`
- `DOCS_DEV/UNIVERSAL_WEB_PROJECT_MASTER_IMPLEMENTATION_LOCK_BILINGUAL.md`
- `DOCS_DEV/AI_TEAM_AUTO_ORCHESTRATOR.md`
- `docs/PROJECT_CONTEXT_ENGINE.md`

> **Rule:** Tài liệu này thay thế mọi sprint plan cũ từ trước ngày 27/4/2026.  
> Mọi team phải đọc file này TRƯỚC KHI bắt đầu bất kỳ task nào.

---

## 1. PHẠM VI DỰ ÁN

**Dự án:** OMDALA Platform  
**Domain:** `omdala.com` + subdomains  
**Repo:** `/Users/tranhatam/Documents/Devnewproject/omdala.com`  
**Branch:** `feat/omniverse-auth-o1-o2`  
**Phase hiện tại:** Giai đoạn 6 — Verify (theo UDEP 8 stages)

### Boundary bắt buộc (không được vi phạm)

| Sản phẩm | Workspace | Domain | Ownership |
|---------|---------|--------|---------|
| OMDALA Platform | `apps/`, `services/`, `packages/` | `*.omdala.com` | Team 1 + Team 2 + Team 3 |
| Om AI | `om-ai.omdala.com/` | `om-ai.omdala.com` | **Team 1 only** |
| Omniverse | `omniverse.omdala.com/` | `omniverse.omdala.com` | **Team 2 only** |

**Rule cứng:** KHÔNG import/merge/mix code giữa 3 sản phẩm. Mọi thay đổi cross-boundary cần Founder Directive.

---

## 2. TRẠNG THÁI HIỆN TẠI — April 27, 2026

### ✅ Đã hoàn thành (bất biến)

| Item | Bằng chứng |
|------|-----------|
| 5 surfaces live: web/app/auth/admin/docs | Cloudflare Pages, DNS active |
| omdala-api Worker live | `api.omdala.com` → `{"ok":true}` |
| omniverse-api Worker live | D1 database 15 tables |
| Auth magic-link flow | session cookie .omdala.com |
| HttpOnly session cookies | CORS wired |
| 20 commits local (unpushed) | branch ahead origin by 20 |
| bilingual audit script fixed | blocks=0 APFS + execFileSync |
| 10 EN page.tsx generateMetadata | canonical + hreflang per-page |

### 🔴 Release Gate: NO-GO

| Blocker | Owner | Priority |
|---------|-------|---------|
| Bilingual audit: 76 issues (logo alt ×40, canonical ×9, hreflang ×27) | Team 1 | P0 |
| `apps/web/out` stale build | Team 1 | P0 |
| Team 1 sign-off NOT final | Team 1 | P0 |
| API timeout unstable | Team 3 | P1 |
| Team 2 sign-off pending Team 1+3 | Team 2 | P1 |

---

## 3. CẤU TRÚC TEAM

### Team 1 — Om AI + User Core + Team Admin

**Owner scope:**
- `om-ai.omdala.com/`
- `apps/auth/`, `apps/app/`
- `apps/web/` (public web, bilingual, SEO)
- `services/auth/`, `services/ai/`
- `packages/core/`, `packages/seo/`, `packages/ui/` (shared)
- Phần auth/session/intake trong `services/api/`
- **Team Admin role:** điều phối toàn bộ team, kiểm soát scope, thu thập báo cáo

**Done = :**
1. Bilingual gate pass (audit 0 issues)
2. Auth/session ổn định
3. Om AI MVP path chạy được (/v2/live)
4. Build/typecheck pass
5. Team 1 sign-off artifact final

---

### Team 2 — Omniverse + System Reliability

**Owner scope:**
- `omniverse.omdala.com/` (web + backend Worker)
- `apps/admin/`, `apps/docs/`
- `services/matching/`, `services/trust/`, `services/notifications/`
- `infra/`, `.github/workflows/`, `scripts/`
- Shared platform core: workspace/notifications/analytics schema

**Done =:**
1. Omniverse backend routes thật (homes/rooms/devices/scenes/automations)
2. Dashboard có substance — không còn placeholder
3. `apps/admin` harden — data thật
4. `apps/docs` harden — bilingual content thật
5. CI/CD pipeline ổn định
6. Team 2 sign-off artifact final

---

### Team 3 — Platform Core, API, QA, Release

**Owner scope:**
- `services/api`, `services/auth`, `services/trust`, `services/matching`
- `packages/core`, `packages/types`
- `scripts/*` (bilingual scripts, release scripts)
- Smoke và release gate evidence

**Done =:**
1. `pnpm release:verify` green
2. Bilingual crawl evidence clean
3. Team 1 + Team 2 sign-offs collected
4. GO/NO-GO = GO

---

## 4. SPRINT EXECUTION — Từ April 27, 2026

### SPRINT ALPHA — Priority 0: Unblock Release Gate
**Deadline:** 48 giờ (đến 29/4/2026)  
**Goal:** Đưa bilingual gate từ NO-GO → ready for verify

#### Team 1 Tasks (Admin + Dev)

| ID | Task | File | Done when |
|----|------|------|-----------|
| T1-A1 | ✅ DONE — Fix audit script (APFS + execFileSync) | `scripts/bilingual-public-audit.mjs` | Audit reads files |
| T1-A2 | ✅ DONE — Add `generateMetadata` 10 EN pages | `apps/web/app/**/page.tsx` | Per-page canonical correct |
| T1-A3 | 🔄 Rebuild `apps/web` | `apps/web` | `next build` pass |
| T1-A4 | 🔄 Rerun bilingual audit | `scripts/bilingual-public-audit.mjs` | 0 blocking issues |
| T1-A5 | ⏳ Write Team 1 final sign-off artifact | `docs/TEAM_1_FINAL_SIGNOFF_2026-04-27.md` | All evidence links present |
| T1-A6 | ⏳ Om AI /v2/live backend routes | `om-ai.omdala.com/backend/src/routes/live.ts` | Route exists, typed |
| T1-A7 | ⏳ Usage metering persistence | `om-ai.omdala.com/backend/src/persistence.ts` | Daily free-minute enforced |

#### Team 2 Tasks

| ID | Task | File | Done when |
|----|------|------|-----------|
| T2-A1 | 🔄 Collect Team 1 sign-off | `docs/TEAM_1_SIGNOFF_TEAM2_SPRINT1_2026-04-19.md` | Signed |
| T2-A2 | 🔄 Collect Team 3 sign-off | `docs/TEAM_3_SIGNOFF_TEAM2_SPRINT1_2026-04-19.md` | Signed |
| T2-A3 | ⏳ Close Sprint 1 closure packet | `docs/TEAM_2_SPRINT1_CLOSURE_PACKET_2026-04-19.md` | S1-T2-* all done |
| T2-A4 | ⏳ Omniverse dashboard real data | `omniverse.omdala.com/web/` | Homes/devices not mock |
| T2-A5 | ⏳ apps/admin data substance | `apps/admin/` | Not placeholder |
| T2-A6 | ⏳ apps/docs bilingual content | `apps/docs/` | ≥3 real EN+VI pages |

#### Team 3 Tasks

| ID | Task | File | Done when |
|----|------|------|-----------|
| T3-A1 | ✅ DONE — Bilingual source-integrity check | `scripts/bilingual-source-check.mjs` | Pass |
| T3-A2 | 🔄 Stabilize API timeout test | `services/api/src/` | No flaky timeout |
| T3-A3 | 🔄 Rerun `pnpm release:verify` | release scripts | Green |
| T3-A4 | ⏳ Re-run bilingual crawl after T1 rebuild | `scripts/bilingual-public-audit.mjs` | 0 blocking |
| T3-A5 | ⏳ Update release evidence | `docs/TEAM_3_RELEASE_EVIDENCE_*.md` | Evidence current |
| T3-A6 | ⏳ GO/NO-GO re-decision | `docs/OMDALA_BILINGUAL_PRELIVE_REPORT_*.md` | GO issued |

---

### SPRINT BETA — Priority 1: Product Substance
**Deadline:** 7 ngày (đến 4/5/2026)  
**Goal:** Surfaces có nội dung thật, Om AI MVP path sống

#### Team 1

| ID | Task | Notes |
|----|------|-------|
| T1-B1 | Om AI persona flow | `/om-ai.omdala.com/backend/src/live/` |
| T1-B2 | Om AI recap + memory pipeline | Spec: `AI_OM_MASTER_SPEC_2026.md` |
| T1-B3 | Provider routing execution | `services/ai/src/index.ts` |
| T1-B4 | Billing/usage visibility | `packages/core/src/om-ai-billing.ts` |
| T1-B5 | Profile update flow | `apps/app/app/(dashboard)/profile/ProfileUpdateFlow.tsx` |
| T1-B6 | Preferences/settings | `apps/app/app/(dashboard)/settings/` |

#### Team 2

| ID | Task | Notes |
|----|------|-------|
| T2-B1 | Omniverse scenes/automations UI | `omniverse.omdala.com/web/` |
| T2-B2 | Admin moderation panel real data | `apps/admin/` |
| T2-B3 | Docs: API reference page | `apps/docs/` |
| T2-B4 | Docs: onboarding guide bilingual | `apps/docs/` |
| T2-B5 | CI/CD pipeline `.github/workflows/` | Basic deploy workflow |

#### Team 3

| ID | Task | Notes |
|----|------|-------|
| T3-B1 | Shared workspace schema lock | `packages/types/src/index.ts` |
| T3-B2 | Notifications schema lock | `services/notifications/src/` |
| T3-B3 | Full smoke matrix pass | All surfaces |
| T3-B4 | Performance audit (Lighthouse) | Target ≥90 mobile |

---

### SPRINT GAMMA — Priority 2: Mobile + Scale
**Deadline:** 3 tuần (đến 17/5/2026)  
**Goal:** iOS/Android MVP structure + public launch readiness

| Team | Tasks |
|------|-------|
| Team 1 | iOS/Android Om AI call MVP (voice-first), moderation pipeline |
| Team 2 | Omniverse iOS/Android MVP structure |
| Team 3 | PostgreSQL/Hyperdrive production DB, full E2E suite |

---

## 5. BILINGUAL GOVERNANCE — Bắt buộc mọi team

Theo `UNIVERSAL_BILINGUAL_LANGUAGE_AND_SEO_REBUILD_MASTER_LOCK_2026.md`:

### Rules không được vi phạm

1. **Vietnamese là nguồn ngữ nghĩa.** English phải khớp ý nghĩa, không phải dịch từng chữ.
2. **Không hard-code text công khai** khi đã có controlled source (`content/en.json`, `content/vi.json`, `AUTH_COPY`, etc.).
3. **Mọi page công khai** phải có canonical + hreflang đúng.
4. **Logo alt** phải là `"OMDALA logo"` (EN) / `"Biểu trưng OMDALA"` (VI).
5. **Không release** khi bilingual audit còn blocking issues.

### Source files bắt buộc

| Surface | Source |
|---------|--------|
| `apps/web` public copy | `content/en.json`, `content/vi.json` |
| Auth copy | `packages/ui/src/copy/auth-copy.ts` (`AUTH_COPY`) |
| Shared UI | `packages/ui/src/copy/shared-ui-copy.ts` |
| Metadata | `apps/web/app/lib/localized-metadata.ts` → `buildLocalizedMetadata()` |

---

## 6. QUALITY GATES (theo MASTER_DEV_EXECUTION_PROTOCOL_2026)

### Gate 1 — Build pass
- [ ] `pnpm --filter @omdala/web typecheck` — no errors
- [ ] `pnpm --filter @omdala/web build` — next build pass
- [ ] `pnpm --filter omniverse-backend test` — all pass
- [ ] `pnpm --filter @omdala/api test` — all pass

### Gate 2 — Bilingual pass
- [ ] `node scripts/bilingual-public-audit.mjs` — 0 blocking issues
- [ ] `node scripts/bilingual-hardcode-scan.mjs` — team2UnresolvedP0Count = 0
- [ ] `node scripts/bilingual-source-check.mjs` — pass

### Gate 3 — Release verify
- [ ] `pnpm release:verify` — green
- [ ] Team 1 sign-off: `docs/TEAM_1_FINAL_SIGNOFF_2026-04-27.md` — FINAL
- [ ] Team 2 sign-off — FINAL
- [ ] Team 3 GO/NO-GO — GO

### Gate 4 — Deploy
- [ ] `wrangler pages deploy apps/web/out --project-name omdala-web --branch production`
- [ ] Smoke: all 5 surfaces < 400ms
- [ ] Lighthouse: web ≥ 90

---

## 7. PHÂN QUYỀN TEAM ADMIN (Team 1)

Team Admin (Team 1) chịu trách nhiệm:

1. **Duy trì file này** là source of truth duy nhất cho execution.
2. **Collect sign-offs** từ tất cả team trước khi release.
3. **Escalate blocker** lên Founder nếu không giải quyết được trong 24h.
4. **Không cho phép** scope drift, silent changes, hoặc skip quality gate.
5. **Báo cáo hàng ngày** cho Founder theo format: Đã làm / Đang làm / Blocker.

---

## 8. LỆNH DEPLOY (Production)

```bash
# Web
wrangler pages deploy apps/web/out --project-name omdala-web --branch production

# App
wrangler pages deploy apps/app/out --project-name omdala-app --branch production

# Auth
wrangler pages deploy apps/auth/out --project-name omdala-auth --branch production

# Admin
wrangler pages deploy apps/admin/out --project-name omdala-admin --branch production

# Docs
wrangler pages deploy apps/docs/out --project-name omdala-docs --branch production

# API Worker (account: Tranhatam@gmail.com)
CLOUDFLARE_ACCOUNT_ID=f3f9e76222dcb488d5e303e29e8ba192 wrangler deploy --config services/api/wrangler.toml

# Omniverse Worker
wrangler deploy --config omniverse.omdala.com/wrangler.toml
```

> **Lưu ý:** KHÔNG push git từ tool — macOS SIGKILL do RAM/disk pressure. Push từ terminal ngoài khi Founder yêu cầu.

---

## 9. NEXT IMMEDIATE ACTIONS

**Thứ tự ưu tiên ngay bây giờ (Team 1 + Admin):**

```
1. ✅ generateMetadata 10 pages — DONE
2. ✅ Audit script fixed — DONE
3. 🔄 [ĐANG CHẠY] typecheck apps/web
4. ⏳ next build apps/web → refresh out/
5. ⏳ Rerun bilingual audit → verify 0 issues
6. ⏳ Write Team 1 final sign-off
7. ⏳ Om AI /v2/live routes
8. ⏳ Notify Team 2 to close sign-off artifacts
9. ⏳ Notify Team 3 to rerun release:verify
```

---

## END OF PLAN
*Updated by Team Admin (Claude / AI Dev Partner) — April 27, 2026*  
*Next update: after bilingual gate passes or major blocker resolved*
