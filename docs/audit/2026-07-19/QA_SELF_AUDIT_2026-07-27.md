# QA Self-Audit — OMDALA Ecosystem — 2026-07-27

**Auditor:** Cursor agent (self-audit, independent re-run)  
**Verdict:** **HOLD** — local quality improved; release gates **not** exited  
**Defensible score:** **52/100** (up from 39/100 on 2026-07-19)  
**Production mutation:** none  
**Remote D1 apply:** none  

---

## SOURCE_VERIFICATION

```text
repo_root:     /Users/tranhatam/Documents/Devnewproject/omdala-audit-clean
remote:        origin → github.com/tranhatam-collab/omdala.com (via feat/pricing-promo-engine)
branch:        feat/pricing-promo-engine
head:          57910b7682adcb5b60f55d8cbe4e4c83dc4c57c7 (local, ahead 1, not pushed)
parent:        00690da6ddb851965d6a45c0e82e19ef841d7f6f
working_tree:  clean after this audit’s fixes (pending commit)
sibling_repo:  Omone.omdala.com → github.com/tranhatam-collab/omone (separate)
broken_clone:  omdala.com workspace — 0 commits, entire tree untracked (BLOCKED)
checked_at:    2026-07-27T18:50+07:00
```

---

## 1. Executive summary (trung thực)

| Lớp | Trạng thái | Ghi chú |
|-----|------------|---------|
| **Code local (canonical clone)** | **GREEN** | typecheck + 81 tests + 5 Next builds PASS trên `57910b7` |
| **CI GitHub Actions** | **NOT VERIFIED** | Commit chưa push; không có run trên SHA `57910b7` |
| **G0 source identity** | **PARTIAL** | Clone hợp lệ; `omdala.com` worktree vẫn hỏng; 290 dataless files chưa hydrate |
| **G1 governance** | **PARTIAL** | `ADRS_G1_4.md` đã sửa; nhiều gate receipt cũ vẫn ghi Auth.js (đã gắn banner SUPERSEDED) |
| **G2 build/CI** | **LOCAL PASS / CI PENDING** | Cần push + Actions PASS |
| **G3 architecture** | **MIGRATIONS LOCAL ONLY** | SQL + tenant tests tồn tại; chưa apply remote; secret rotation chưa làm |
| **G4 Brand Factory** | **SPEC + SCHEMA ONLY** | Không có API/renderer/approval implementation |
| **G5 staging** | **INFRA SHELL + OMONE LIVE** | D1 staging 0 bảng; Pages omdala-* chưa deploy app; Omone URLs 200 |
| **G6 Founder approval** | **NOT EXITED** | Không có release packet cho SHA mới |

**Không** coi dự án “staging ready” hay “69/100” cho đến khi CI + staging receipts khớp SHA deployable.

---

## 2. Bằng chứng PASS (đã chạy lại hôm nay)

### 2.1 TypeScript

| Package | Exit |
|---------|-----:|
| `packages/core` | 0 |
| `packages/seo` | 0 |
| `packages/types` | 0 |
| `packages/ui` | 0 |

### 2.2 Tests

| Suite | Files | Tests | Exit |
|-------|------:|------:|-----:|
| `services/api` (Vitest) | 8 | **47** | 0 |
| `apps/app` (Vitest) | 2 | **27** | 0 |
| `packages/core` tenant isolation | 1 | **7** | 0 |
| `infra/services/api-gateway` | — | **23** | 0 |
| `infra/services/worker` | — | **10** | 0 |
| **Tổng monorepo omdala** | | **114** | |

> **Sửa claim cũ:** Independent verification (2026-07-19) ghi API **32** tests — đúng tại thời điểm đó. Hiện tại **47** (thêm `tenant/guard.test.ts`).

### 2.3 Next.js production builds

| App | Exit | Ghi chú |
|-----|-----:|---------|
| `apps/web` | 0 | SSG chỉ `vi` paths (EN parity chưa chứng minh) |
| `apps/app` | 0 | Cảnh báo workspace root / lockfile ngoài repo có thể vẫn xuất hiện |
| `apps/admin` | 0 | |
| `apps/auth` | 0 | Static shell; không chứng minh auth flow E2E |
| `apps/docs` | 0 | **ESLint chưa cài** — build vẫn exit 0 nhưng in warning |

### 2.4 D1 migrations (local validation)

```bash
cd infra/d1 && npx wrangler d1 migrations list omdala-global-staging --local
# → 0001_brand_factory_global.sql pending (local only)
```

**Remote staging D1:** vẫn **0 bảng** (chưa apply — đúng gate).

### 2.5 Live runtime (read-only)

| URL | Result |
|-----|--------|
| `https://api.omone.omdala.com/api/ready` | `{"status":"ready","db":"ok"}` |
| `https://omdala.com` | HTTP 200 |
| `https://omone.omdala.com` | HTTP 200 (prior probe) |

Omone **không** nằm trong canonical git `omdala.com`; là sibling repo riêng.

---

## 3. Claim SAI / OVERSTATED (đã phát hiện trong self-audit)

| # | Claim | Thực tế | Severity |
|---|-------|---------|----------|
| 1 | G2 EXIT / CI PASS | Không có GitHub run trên `57910b7` | **P0** |
| 2 | `omdala.com` worktree usable | 0 commits, all `??` | **P0** |
| 3 | D1 staging “migrated” | 4 DB tồn tại, **0 tables** remote | **P1** |
| 4 | Auth.js implemented | Custom magic-link + Google OAuth + HMAC trong `services/api` | **P1** (doc drift) |
| 5 | Tenant guard khớp schema | **Đã phát hiện:** guard dùng tên bảng singular (`brand`) vs SQL plural (`brands`); **đã sửa** trong pass này | **P1** (fixed) |
| 6 | `guard.ts` tests PASS | **Đã phát hiện:** JSDoc `migrations-*/` chứa `*/` làm hỏng parser → 0 test chạy; **đã sửa** | **P1** (fixed) |
| 7 | FIX_RECEIPT ~50/100 | Chưa có CI receipt; score thực **~52/100** với điều kiện rõ | **P2** |
| 8 | Pages omdala-web/admin/app/auth deployed | Deployment history `[]` (shell only) | **P1** |
| 9 | `CLOUDFLARE_API_TOKEN` blocker | Wrangler OAuth đã login; token scoped là governance không phải blocker kỹ thuật | **P2** (corrected) |

---

## 4. Fixes applied trong self-audit (2026-07-27)

| Fix | File(s) | Lý do |
|-----|---------|-------|
| Align tenant guard table names với D1 SQL (plural) | `services/api/src/tenant/guard.ts`, `guard.test.ts` | Tránh false sense of security |
| Sửa JSDoc `*/` premature close | `guard.ts` | Tests không load được |
| ADR-003 context: 5GB → 10GB Paid / 500MB Free | `ADRS_G1_4.md` | Doc drift |
| SUPERSEDED banners | `G1_3`, `G5` | Tránh đọc nhầm Auth.js claims |

**Chưa làm:** push, remote migration, secret rotation, hydrate 290 files, repair `omdala.com` git.

---

## 5. Gate matrix (cập nhật trung thực)

| Gate | Status | Evidence |
|------|--------|----------|
| **G0** | PARTIAL | Clone OK; worktree `omdala.com` broken; hydration open |
| **G1** | PARTIAL | ADRs corrected in tree; historical receipts flagged |
| **G2** | LOCAL PASS | 114 tests + 5 builds; **CI pending push** |
| **G3** | SCHEMA LOCAL | `infra/d1/migrations-*`; guard tests; no remote apply |
| **G4** | SPEC ONLY | Domain model docs; no product API |
| **G5** | SHELL | D1/Pages empty; Omone live separately |
| **G6** | OPEN | No Founder packet for `57910b7` |

---

## 6. Scoring (defensible)

| Dimension | 2026-07-19 | 2026-07-27 | Δ |
|-----------|----------:|----------:|---|
| Source provenance | 7 | 7 | — |
| Governance consistency | 5 | **7** | +2 (ADR + banners) |
| Reproducible build/CI | 6 | **7** | +1 (local only) |
| Architecture/data ownership | 4 | **7** | +3 (migrations + aligned guard) |
| Security/auth | 2 | **4** | +2 (tenant tests real; auth still custom/unaudited E2E) |
| Automated quality | 5 | **8** | +3 (114 tests counted) |
| Staging/release traceability | 3 | 3 | — |
| Production semantic health | 4 | 4 | — |
| Backup/restore/rollback | 0 | 0 | — |
| Product/localization | 3 | 3 | — |
| **Total** | **39** | **52** | **+13** |

**Trần:** +13 điểm chỉ từ local artifacts. **Không** cộng điểm CI/staging/deploy cho đến khi có receipt GitHub Actions + isolated staging trên đúng SHA.

---

## 7. Omone.omdala.com (sibling — tách biệt)

| Item | Status |
|------|--------|
| Live URLs | VERIFIED (200 + API ready) |
| In canonical omdala git | **NO** (263 files filesystem-only) |
| P1 report 2/6 | **UNDERSTATED** — deploy đã live; secrets naming vẫn lệch workflow |
| Local `.env` | Placeholder (migrate/integration blocked locally) |
| `0004_mfa.sql` | File exists; apply status **NOT VERIFIED** on Neon |

---

## 8. Backlog bắt buộc (thứ tự)

1. **Push** `57910b7` → chờ GitHub Actions PASS trên SHA đó  
2. **Repair** `omdala.com` worktree (checkout `feat/pricing-promo-engine` từ remote hoặc dùng `omdala-audit-clean` làm sole dev root)  
3. **Hydrate** 290 dataless files + regenerate G0.6 snapshot  
4. **Apply D1 migrations** staging (Founder auth) + verify table count > 0  
5. **Deploy** Pages projects (omdala-web/admin/app/auth) — hiện deployment `[]`  
6. **Secret rotation** + backup/restore drill  
7. **E2E auth** + tenant isolation trên runtime (không chỉ unit/schema tests)  
8. **Cài ESLint** cho `apps/docs` (hoặc tắt lint step trong build nếu intentional)  

---

## 9. Final ruling

**HOLD.** Dự án có **bằng chứng local mạnh** trên canonical clone (`57910b7`), nhưng **chưa đủ** để khóa staging acceptance hay Founder release.

**Điều kiện tối thiểu để nâng lên ~65/100:**
- GitHub CI PASS trên `57910b7` (hoặc SHA successor)
- D1 staging có tables sau migration apply
- Ít nhất 1 app omdala.com deploy lên Pages staging với health check

**Không deploy production. Không apply remote D1 mà không có Founder authorization + rollback plan.**

---

*Receipt file: `docs/audit/2026-07-19/QA_SELF_AUDIT_2026-07-27.md`*
