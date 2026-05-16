# OMDALA PROJECT CHARTER

**Version:** 1.0  
**Status:** LOCKED — Founder Approved  
**Date:** 2026-04-28  
**Owner:** Trần Hà Tâm (Founder)  
**Governed by:** `DOCS_DEV/MASTER_DEV_EXECUTION_PROTOCOL_2026.md` Stage 3 — Lock

---

## 1. Project Identity

| Field | Value |
|-------|-------|
| Project name | OMDALA Platform |
| Domain | `omdala.com` + subdomains |
| Repo | `/Users/tranhatam/Documents/Devnewproject/omdala.com` |
| Branch | `feat/omniverse-auth-o1-o2` |
| Type | Trust-based professional network / Reality OS platform |
| Phase | Production — Sprint Beta (post Bilingual Gate Pass) |

---

## 2. Problem Statement (One Paragraph)

OMDALA giải quyết vấn đề **điều phối thực tế có kiểm chứng** giữa người, nơi chốn, tài nguyên, và kết quả. Hiện tại các nền tảng quản lý công việc, đặt phòng, và đánh giá hoạt động riêng lẻ và không thể chứng minh được giá trị thực sự được tạo ra. OMDALA hợp nhất chúng vào một hệ điều hành reality-aware nơi giá trị được kích hoạt, kết quả được chứng minh, và niềm tin được tích lũy theo thời gian.

---

## 3. Target Users (Primary)

1. **Hosts** — chủ thể đón tiếp (homestay, venue, community space)
2. **Experts** — chuyên gia cung cấp dịch vụ có giá trị
3. **Communities** — cộng đồng cần điều phối nguồn lực
4. **Operators** — vận hành nội bộ nodes
5. **Businesses** — doanh nghiệp tích hợp trust core

---

## 4. Locked Scope (NON-NEGOTIABLE)

### IN SCOPE — phải có

| Item | Surface |
|------|---------|
| Public bilingual web (15 pages) | `omdala.com` (apps/web) |
| Authenticated dashboard | `app.omdala.com` (apps/app) |
| Auth host magic-link | `auth.omdala.com` (apps/auth) |
| Admin moderation panel | `admin.omdala.com` (apps/admin) |
| Public docs site | `docs.omdala.com` (apps/docs) |
| API gateway | `api.omdala.com` (services/api) |
| Om AI live/persona/memory | `om-ai.omdala.com/` (separate product) |
| Omniverse home/device graph | `omniverse.omdala.com/` (separate product) |
| Bilingual EN+VI lock | All public surfaces |
| HttpOnly session cookies (.omdala.com) | services/api |

### OUT OF SCOPE (giai đoạn này)

- iOS/Android native apps (Sprint Gamma)
- Public payment/billing UI (Sprint Gamma)
- 3rd-party integrations (Sprint Gamma)
- 3 ngôn ngữ mở rộng (zh/es/ja/ko) — chỉ EN+VI cho phase này
- Multi-tenant white-label (Sprint Delta+)

### NON-GOALS

- KHÔNG xây OmCode trong repo này (project riêng)
- KHÔNG mix Om AI logic với Omniverse logic
- KHÔNG hard-code public text khi đã có controlled source
- KHÔNG release khi bilingual audit còn blocking issues

---

## 5. Architecture Direction (Locked)

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Hosting | Cloudflare Pages + Workers | Edge global, free tier sufficient |
| Database | Cloudflare D1 (SQLite at edge) | Native CF, simple binding |
| Frontend | Next.js 15 App Router (`output: "export"`) | Static-first, SEO-optimal |
| Auth | Magic-link + JWT + HttpOnly cookies | No password, secure session |
| Bilingual source | `content/en.json`, `content/vi.json` | Vietnamese = source of meaning |
| Monorepo | pnpm workspaces + Turborepo | Lightweight, fast |
| Type system | Strict TypeScript | No `any` without justification |

**Decision records:** xem `docs/20_architecture/ARCHITECTURE_DECISIONS.md`.

---

## 6. Success Metrics

### Sprint Beta gate (đến 11/5/2026)

| Metric | Target | Current |
|--------|--------|---------|
| Bilingual audit pass | 100% | ✅ 20/20 |
| Release verify gate | GO | 🔄 partial |
| Surface uptime | ≥ 99% | ✅ 100% |
| Lighthouse mobile | ≥ 90 | TBD |
| Om AI MVP path live | yes | ⏳ |
| Omniverse dashboard real data | yes | ⏳ |

### Post-Beta Production gate

- Public web TTFB < 400ms
- All e2e suites green
- 0 critical security issues
- Founder explicit GO signature

---

## 7. Risk Register Pointer

Chi tiết tại `docs/30_delivery/CHANGE_LOG.md` section "Risks".

Top 3 risks:
1. Disk corruption (file rỗng) — đã mitigate
2. Stale build artifacts trong release_verify — đang điều tra
3. 20 commits chưa push origin — chờ Founder push từ terminal

---

## 8. Governance & Approval

| Decision type | Approver |
|--------------|---------|
| Scope change | Founder (Trần Hà Tâm) |
| Architecture decision | Tech Lead + Founder |
| Bilingual content lock | Founder + Content Lead |
| Release GO/NO-GO | Team 3 + Founder |
| Cross-team handoff | Team Admin (Team 1) |

**No silent scope drift. No uncommitted decisions.**

---

## 9. Effective Date

**Charter locked from 2026-04-28.**  
Tài liệu này KHÔNG được sửa mà không có Founder Directive ghi nhận trong `CHANGE_LOG.md`.

---

## END OF CHARTER
