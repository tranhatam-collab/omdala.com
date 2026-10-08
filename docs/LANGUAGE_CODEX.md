# OMDALA Language Codex

**Version:** 1.0  
**Status:** LOCKED — Mọi public text phải tuân theo file này  
**Date:** 2026-04-28  
**Owner:** Team 1 (Content Lead)  
**Founder approval:** Trần Hà Tâm  
**Governed by:** `DOCS_DEV/UNIVERSAL_BILINGUAL_LANGUAGE_AND_SEO_REBUILD_MASTER_LOCK_2026.md`

---

## 1. Rule cốt lõi

1. **Tiếng Việt là ngôn ngữ nguồn ngữ nghĩa.** English phải khớp ý nghĩa, không phải dịch từng chữ.
2. **Mọi public text** phải đến từ controlled source: `content/en.json`, `content/vi.json`, `AUTH_COPY`, `SHARED_UI_COPY`.
3. **Tiếng Việt phải có đủ dấu** — không bỏ dấu, không viết tắt theo kiểu chat.
4. **English phải tự nhiên, quốc tế, professional** — không robotic, không slang địa phương.
5. **Brand "OMDALA" giữ nguyên ALL CAPS** trong cả EN và VI.

---

## 2. Brand & Product Glossary

### Brand
| EN | VI | Note |
|----|-----|------|
| OMDALA | OMDALA | All caps both languages |
| OMDALA logo | Biểu trưng OMDALA | Image alt text |
| OMDALA platform | Nền tảng OMDALA | Long-form |

### Products
| EN | VI | Note |
|----|-----|------|
| Om AI | Om AI | Keep brand-safe; don't translate |
| Omniverse | Omniverse | Same |
| OmCode | OmCode | Same (separate project) |

### Core Concepts
| EN | VI |
|----|-----|
| Operator | Người vận hành / Điều phối |
| Host | Chủ thể đón tiếp |
| Expert | Chuyên gia |
| Community | Cộng đồng |
| Business | Doanh nghiệp |
| Node | Nút |
| Reality | Thực tế |
| Trust | Niềm tin |
| Verification | Xác minh |
| Coordination | Điều phối |
| Resources | Tài nguyên |
| Outcomes | Kết quả |
| Commitments | Cam kết |
| Proof | Bằng chứng |
| Identity | Định danh |
| Governance | Quản trị |
| Intelligence | Trí tuệ (hệ thống) |

### Action verbs
| EN | VI |
|----|-----|
| Sign in / Log in | Đăng nhập |
| Sign up | Tạo tài khoản |
| Sign out | Đăng xuất |
| Verify | Xác minh |
| Submit | Gửi |
| Approve | Duyệt |
| Reject | Từ chối |
| Save | Lưu |
| Cancel | Hủy |
| Create | Tạo |
| Edit | Sửa |
| Delete | Xóa |
| Confirm | Xác nhận |

### Auth & Session
| EN | VI |
|----|-----|
| Magic link | Liên kết đăng nhập |
| Session | Phiên |
| Cookie | Cookie |
| Token | Token |
| Sign-in link | Liên kết đăng nhập |
| Email verification | Xác thực email |

### Navigation labels
| EN | VI |
|----|-----|
| What OMDALA Is | OMDALA là gì |
| How It Works | Cách vận hành |
| For Experts | Cho chuyên gia |
| For Hosts | Cho chủ thể đón tiếp |
| For Communities | Cho cộng đồng |
| Trust | Niềm tin |
| Vision | Tầm nhìn |
| FAQ | Câu hỏi thường gặp |
| Contact | Liên hệ |

---

## 3. Tone & Voice

### English
- Professional, clear, calm
- Active voice preferred
- No marketing hype ("revolutionary", "game-changing", "best-in-class" — BANNED)
- Sentence case for body, Title Case for nav/buttons

### Vietnamese
- Trang trọng nhưng không cứng nhắc
- Dùng "bạn" thay vì "quý khách" (trừ legal/contract)
- KHÔNG dùng tiếng anh xen kẽ ("rất prof", "deal", "review")
- KHÔNG viết tắt SMS ("ko", "đc", "ng" → phải đầy đủ "không", "được", "người")

### Banned phrases
| EN | VI |
|----|-----|
| Game-changing | "Thay đổi cuộc chơi" |
| Revolutionary | "Cách mạng hóa" |
| Best-in-class | "Hàng đầu thế giới" |
| Cutting-edge | "Tiên phong nhất" |
| Industry-leading | "Dẫn đầu ngành" |

---

## 4. Numbers, dates, currency

| Item | EN | VI |
|------|-----|-----|
| Date format | April 28, 2026 | 28/4/2026 |
| Currency | USD $1,234.56 | 1.234,56 ₫ (or VND 1.234.567) |
| Time | 14:30 (24h) or 2:30 PM | 14:30 |
| Decimal | 1.5 | 1,5 |
| Thousands | 1,000 | 1.000 |

---

## 5. URLs & Routes

- EN routes: `/`, `/what-is-omdala/`, `/how-it-works/`, etc.
- VI routes: `/vi/`, `/vi/what-is-omdala/`, `/vi/how-it-works/`, etc.
- Brand domain in URLs: never translate (omdala.com always)
- External links: keep host name, prefer English in label if uniform across surfaces

---

## 6. SEO requirements per page

Mỗi public page phải có:

| Field | EN format | VI format |
|-------|-----------|-----------|
| `<title>` | `{Page} — OMDALA` | `{Page} — OMDALA` |
| `<meta description>` | 140-160 chars EN | 140-160 chars VI |
| `<link rel="canonical">` | `https://omdala.com{path}` | `https://omdala.com/vi{path}` |
| `<link rel="alternate" hrefLang="en">` | EN URL | EN URL |
| `<link rel="alternate" hrefLang="vi">` | VI URL | VI URL |
| `<link rel="alternate" hrefLang="x-default">` | EN URL (default) | EN URL |
| `<meta property="og:locale">` | `en_US` | `vi_VN` |

Nguồn: `apps/web/app/lib/localized-metadata.ts`.

---

## 7. Image alt text

| Image | EN alt | VI alt |
|-------|--------|--------|
| Logo (header) | `OMDALA logo` | `Biểu trưng OMDALA` |
| Logo (footer) | `OMDALA logo` | `Biểu trưng OMDALA` |
| OG default | `OMDALA — Independent Platform` | `OMDALA — Nền tảng độc lập` |
| Product screenshot | `{descriptive EN}` | `{descriptive VI}` — bắt buộc dịch |

Source: `content/{en,vi}.json` → `site.brandLogoAlt`.

---

## 8. Validation Pipeline

| Script | Purpose |
|--------|---------|
| `scripts/bilingual-source-check.mjs` | Verify keys parity en.json vs vi.json |
| `scripts/bilingual-public-audit.mjs` | Crawl rendered HTML, check metadata + alt |
| `scripts/bilingual-hardcode-scan.mjs` | Scan source code for hard-coded text |
| `scripts/bilingual-founder-report.mjs` | Aggregate gate decision |

**Run trước khi release:**
```bash
npm run bilingual:source-check
npm run bilingual:public-audit
npm run bilingual:hardcode-scan
npm run bilingual:founder-report
```

---

## 9. Change Process

Để add/change wording:

1. PR sửa `content/en.json` + `content/vi.json` SONG SONG (cả 2 cùng lúc)
2. Update `LANGUAGE_CODEX.md` nếu là term mới
3. Run validation pipeline locally
4. Founder approve nếu là term core
5. Merge → trigger rebuild + audit

**Cấm:** sửa 1 file (chỉ EN hoặc chỉ VI) mà không sửa file kia.

---

## END OF CODEX
