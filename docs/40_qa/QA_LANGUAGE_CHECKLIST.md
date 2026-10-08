# OMDALA QA Language Checklist

**Version:** 1.0  
**Status:** Active — required for every public release  
**Date:** 2026-04-28  
**Owner:** Team 3 (QA Lead)  
**Governed by:** `DOCS_DEV/QA_DEVOPS_EXECUTION_LOCK.md`

---

## 1. Mục đích

Mỗi public release phải pass checklist này TRƯỚC KHI deploy. KHÔNG release nếu có item ❌.

---

## 2. Pre-Release QA Checklist

### A. Source integrity

- [ ] `npm run bilingual:source-check` → PASS
- [ ] Số keys EN = số keys VI (parity)
- [ ] Không có placeholder text như `TODO`, `TBD`, `Lorem ipsum`
- [ ] Không có English text bị bỏ sót trong VI hoặc ngược lại
- [ ] Tiếng Việt có đủ dấu (không "khong" thay "không")
- [ ] English không có lỗi grammar cơ bản

### B. Source code scan

- [ ] `npm run bilingual:hardcode-scan` → `team2UnresolvedP0Count = 0`
- [ ] Không có hard-coded English/Vietnamese trong:
  - `.tsx`/`.ts` JSX literal text
  - String literal trong component props
- [ ] Mọi text public-facing phải đến từ controlled source

### C. Per-page rendered HTML

Run `npm run bilingual:public-audit` và kiểm tra:

- [ ] 0 blocking issues
- [ ] `passedUrls = totalUrls`
- [ ] `metadataStandardizedUrls = totalUrls`
- [ ] `altStandardizedUrls = totalUrls`
- [ ] Mỗi URL có canonical đúng path của nó
- [ ] Mỗi URL có hreflang en + vi + x-default
- [ ] Logo alt: `OMDALA logo` (EN) hoặc `Biểu trưng OMDALA` (VI)

### D. Visual / UX language QA (manual)

#### Public web
- [ ] Header nav: EN labels match codex (`What OMDALA Is`, `How It Works`, ...)
- [ ] VI nav: `OMDALA là gì`, `Cách vận hành`, ...
- [ ] Footer copy match per language
- [ ] Language switcher: chuyển EN↔VI giữ nguyên path tương ứng
- [ ] CTA buttons có wording đúng
- [ ] Form labels + placeholders bilingual
- [ ] Error messages bilingual
- [ ] 404 page bilingual

#### App / Auth / Admin
- [ ] Login page text từ `AUTH_COPY`
- [ ] Magic link sent message bilingual
- [ ] Dashboard navigation bilingual
- [ ] Settings + Profile forms bilingual

### E. SEO output

- [ ] Lighthouse SEO ≥ 95 (mobile + desktop)
- [ ] Google Rich Results Test pass
- [ ] OG image preview đúng trong Facebook Sharing Debugger
- [ ] Twitter Card validator pass
- [ ] sitemap.xml accessible + chứa cả EN + VI URLs
- [ ] robots.txt allow public web; noindex auth/admin

### F. Builds & e2e

- [ ] `pnpm --filter @omdala/web typecheck` PASS
- [ ] `pnpm --filter @omdala/web build` PASS
- [ ] `pnpm --filter @omdala/web test:e2e` PASS
- [ ] `pnpm --filter @omdala/app build` PASS
- [ ] `pnpm --filter @omdala/auth build` PASS
- [ ] `pnpm --filter @omdala/api typecheck` PASS
- [ ] `pnpm --filter @omdala/api test` PASS
- [ ] `bash scripts/release_verify.sh` GREEN

### G. Deployment readiness

- [ ] Wrangler logged in đúng account
- [ ] DNS records intact (check `dig`)
- [ ] Production env vars set
- [ ] Rollback plan documented in `docs/30_delivery/CHANGE_LOG.md`

---

## 3. Sample QA Report Template

```markdown
# QA Language Report — yyyy-mm-dd
- **Run by:** <name>
- **Build hash:** <git sha>
- **Surfaces tested:** web, app, auth, admin, docs

## Results
- Source integrity: ✅ / ❌
- Hardcode scan: ✅ / ❌  (details: ...)
- Public audit: ✅ / ❌  (details: blocking issues = N)
- Visual QA: ✅ / ❌  (issues: ...)
- SEO: ✅ / ❌
- Builds: ✅ / ❌
- e2e: ✅ / ❌

## Decision
- [ ] GO
- [ ] NO-GO  (reason: ...)

## Sign-off
- QA Lead: <name>
- Date: yyyy-mm-dd
```

---

## 4. Common bugs to look for

| Bug | Signal | Owner |
|-----|--------|-------|
| Mixed language ("Email công việc submit") | Visual QA | Content Lead |
| Missing diacritics ("dang nhap" instead of "đăng nhập") | Visual + script | Content Lead |
| Wrong canonical (`/` on non-home page) | Public audit | Frontend |
| Wrong hreflang | Public audit | Frontend |
| Logo alt language mismatch | Public audit | Frontend |
| Hardcoded English in VI page | Hardcode scan | Frontend |
| Stale `out/` → wrong rendered text | Build evidence | DevOps |

---

## 5. Escalation

| Severity | Action |
|----------|--------|
| Critical (production user-facing wrong language) | Hot-fix + rollback within 30 min |
| Major (1+ public URLs blocked) | Block release, fix within 24h |
| Minor (typo, alt missing) | Fix in next sprint |

---

## END
