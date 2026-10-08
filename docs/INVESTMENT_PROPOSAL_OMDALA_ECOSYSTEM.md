# INVESTMENT PROPOSAL — OMDALA ECOSYSTEM
## Đề Xuất Đầu Tư — Hệ Sinh Thái Omdala

> **Project:** Omdala Business Platform
> **Date:** June 10, 2026
> **Prepared by:** Financial Expert Analysis
> **Language:** English / Tiếng Việt (Bilingual)

---

## 1. EXECUTIVE SUMMARY / TÓM TẮT

**Omdala is a business platform designed for Vietnamese entrepreneurs and SMEs.** It includes a public web (`omdala.com`), app dashboard (`apps/app/`), admin panel (`apps/admin/`), auth surface (`apps/auth/`), and AI-powered subdomain (`om-ai.omdala.com`). However, the platform is currently **not production-ready** — frontend is 100% mock data and auth flow is broken.

**Omdala là nền tảng kinh doanh dành cho doanh nhân và SME Việt Nam.** Bao gồm web công khai, dashboard ứng dụng, bảng quản trị, bề mặt xác thực và subdomain AI. Tuy nhiên, nền tảng hiện **chưa sẵn sàng sản xuất** — frontend 100% dữ liệu giả và luồng xác thực bị đứt đoạn.

| Key Metric | Value |
|-----------|-------|
| **Ecosystem Anchor** | `omdala.com` |
| **Subdomains** | 2 (omdala.com, om-ai.omdala.com) |
| **Current Status** | 🔴 Alpha (NOT production-ready) |
| **Backend Score** | 6/10 (routes exist but incomplete) |
| **Frontend Score** | 2/10 (100% mock data) |
| **Current Valuation** | $100K – $300K (infrastructure + concept) |
| **Target Seed** | $50K – $100K (rebuild) |
| **5-Year Valuation Target** | $2M – $5M |

---

## 2. VISION & MISSION / TẦM NHÌN & SỨ MỆNH

### Vision / Tầm Nhìn
**To become the operating system for Vietnamese SMEs — integrating business tools, AI assistance, and community in one platform.**

**Trở thành hệ điều hành cho SME Việt Nam — tích hợp công cụ kinh doanh, hỗ trợ AI và cộng đồng trong một nền tảng.**

### Mission / Sứ Mệnh
1. Provide Vietnamese-first business tools (invoicing, CRM, project management)
2. Integrate AI assistance for business operations (`om-ai.omdala.com`)
3. Build a community of Vietnamese entrepreneurs
4. Connect with portfolio payment infrastructure (`pay.iai.one`)

---

## 3. MARKET ANALYSIS / PHÂN TÍCH THỊ TRƯỜNG

### 3.1 Target Market / Thị Trường Mục Tiêu

| Segment | Size | Opportunity |
|---------|------|-------------|
| Vietnam SMEs | 800K+ | $2.1B SaaS/cloud spend |
| Vietnam Freelancers | 2M+ | Growing gig economy |
| Vietnam E-commerce Sellers | 500K+ | Need business tools |
| Vietnam Startups | 5K+ | Incubator/accelerator demand |

### 3.2 Competitive Landscape / Cảnh Quan Cạnh Tranh

| Competitor | Strength | Our Advantage |
|------------|----------|---------------|
| Zoho / Salesforce | Feature depth | Vietnamese language, local pricing |
| QuickBooks / Xero | Accounting | Integrated with portfolio |
| Local VN Tools (MISA) | Local market | Modern UI, AI integration |
| Notion / Asana | UX | Business-specific, Vietnamese |

**Moat / Hào Rào:** Portfolio integration (payment, auth, AI), Vietnamese-first, local pricing, unified with other ecosystems.

---

## 4. CURRENT STATUS & GAPS / TRẠNG THÁI HIỆN TẠI & KHOẢNG TRỐNG

### 4.1 Audit Scores (June 4, 2026)

| Layer | Score | Issues |
|-------|-------|--------|
| Backend Auth | 6/10 | No `/v1/auth/check`, logout doesn't revoke |
| App Dashboard | 2/10 | 100% mock data, billing expired, SEO=0 |
| Admin Panel | 3/10 | Mock session, mock moderation, hardcoded `en` |
| Public Web | 7/10 | SEO OK, sitemap OK, missing hreflang |
| Auth Surface | 2/10 | Only redirect, no magic link token handling |

### 4.2 Critical Fixes Needed / Sửa Chữa Tới Hạn

1. **Create `GET /v1/auth/me`** — Return auth status, roles, plan
2. **Fix magic link flow** — Auth surface must verify token and redirect
3. **Connect frontend to real API** — Replace all mock data
4. **Fix logout** — Add server-side token revocation
5. **Add billing status checks** — Remove expired billing mock

---

## 5. FINANCIAL PROJECTIONS / DỰ BÁO TÀI CHÍNH

### 5.1 Revenue Projections

| Metric | Year 1 (2026) | Year 2 (2027) | Year 5 (2031) |
|--------|---------------|---------------|---------------|
| **Revenue** | $0 – $10K | $20K – $50K | $200K – $500K |
| **Active Users** | 50 – 200 | 500 – 1.5K | 5K – 15K |
| **Paying Customers** | 0 – 20 | 100 – 300 | 1K – 3K |
| **ARPU (Annual)** | — | $200 – $400 | $300 – $500 |
| **Gross Margin** | 80-90% | 85-92% | 88-95% |

### 5.2 Revenue by Stream

| Stream | Y1 | Y2 | Y5 |
|--------|-----|-----|-----|
| SaaS Subscriptions | $0 | $15K | $300K |
| Transaction Fees | $0 | $5K | $100K |
| AI Services (om-ai) | $0 | $0 | $50K |
| Consulting/Setup | $0 – $10K | $0 – $20K | $50K |

### 5.3 Investment Requirements

| Phase | Amount | Timeline | Use of Funds |
|-------|--------|----------|--------------|
| **Critical Fix** | $20K – $40K | Q3 2026 | Fix auth, connect frontend, mock → real |
| **MVP Launch** | $30K – $60K | Q4 2026 | Core features, first customers |
| **Seed** | $50K – $100K | Q1 2027 | Marketing, team, scale |

---

## 6. RISK ANALYSIS / PHÂN TÍCH RỦI RO

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Rebuild takes longer than planned | High | Critical | Scoped MVP, hire contractor |
| Market competition from global players | High | Medium | Vietnamese niche, integration |
| Founder bandwidth (rebuild + other projects) | High | Critical | Dedicated contractor for 3 months |
| Technical debt accumulation | Medium | High | Code review, linting, tests |
| User acquisition cost | Medium | Medium | Portfolio cross-promotion |

---

## 7. ROADMAP

### 7.1 12-Month Roadmap

| Quarter | Milestone |
|---------|-----------|
| Q3 2026 | Fix critical auth bugs, connect frontend to real API, MVP internal test |
| Q4 2026 | Launch public beta, 50 users, basic SaaS features |
| Q1 2027 | Launch paid plans, 200 users, om-ai integration |
| Q2 2027 | 500 users, $5K MRR, marketplace features |

### 7.2 5-Year Vision

- **Year 1:** Fix and rebuild, 50-200 users, $0-10K revenue
- **Year 2:** 500-1.5K users, $20K-50K revenue
- **Year 3:** 2K-5K users, $100K-200K revenue
- **Year 4:** 4K-10K users, $150K-350K revenue
- **Year 5:** 5K-15K users, $200K-500K revenue

---

## 8. STRATEGIC RECOMMENDATION / KHUYẾN NGHỊ CHIẾN LƯỢC

**Given the current state (2/10 frontend, 100% mock data), Omdala requires either:**

**Option A: Full Rebuild (Recommended)**
- Budget: $50K – $100K
- Timeline: 3-6 months
- Approach: Rewrite frontend with real API connections, fix auth flow

**Option B: Scoped Pivot**
- Focus `om-ai.omdala.com` as standalone AI tool for SMEs
- Defer full SaaS platform until other ecosystems mature
- Budget: $20K – $40K

**Option C: Portfolio Integration**
- Merge Omdala functionality into `app.iai.one` or `muonnoi.org`
- Avoid maintaining separate platform
- Budget: $10K – $20K (integration cost)

**Recommendation:** Option A if funding available; Option C if bandwidth constrained.

---

## 9. APPENDIX

### 9.1 Tech Stack / Công Nghệ
- **Frontend:** Next.js (apps/web, apps/app, apps/admin, apps/auth)
- **Backend:** Hono (services/api/)
- **Database:** D1 (planned)
- **Auth:** Magic link + OAuth + password
- **AI:** om-ai.omdala.com (separate subdomain)

### 9.2 Key Files / Tệp Chính
- `@/omdala.com/services/api/src/index.ts` — Backend routes
- `@/omdala.com/apps/app/app/(auth)/login/page.tsx` — Login page
- `@/omdala.com/apps/auth/app/page.tsx` — Auth surface (broken)

---

*Prepared by AI Financial Expert | June 10, 2026*
*Note: This ecosystem requires significant rebuild investment before revenue generation is feasible.*
