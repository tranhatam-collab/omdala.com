# OMDALA — BRAND v2.0 "SIGNAL & SUBSTRATE"

**Version:** 2.0 — DEMO BRANCH (`brand/v2.0-signal-substrate`)
**Status:** Brandpro-all applied for dev lock; founder-facing review packet updated
**Date:** 2026-05-08
**Reference:** [BRAND_DEMO_PROPOSAL_2026-05-08.md](../BRAND_DEMO_PROPOSAL_2026-05-08.md)
**Brandpro lock:** [OMDALA_BRANDPRO_LOCK_2026-05-12.md](OMDALA_BRANDPRO_LOCK_2026-05-12.md)
**Supersedes:** none (overlay on top of [BRAND_ARCHITECTURE_OMDALA.md](BRAND_ARCHITECTURE_OMDALA.md) v1.1)

---

## 0. ONE-LINER

> **Deep space + tín hiệu chính xác.**
> OMDALA là cabin terminal — calm, premium, intelligent, systemic, trustworthy, durable. Mọi pixel có chủ đích.

---

## 1. NỀN TẢNG (giữ từ v1.1)

Brand traits đã lock — KHÔNG đổi:
- calm · premium · intelligent · systemic · trustworthy · durable

Brand role:
- Master brand cho platform "verified coordination infrastructure for real-world state transitions"
- KHÔNG phải: social app · travel · marketplace · chatbot · Đà Lạt-specific

Product family:
- OMDALA Web · App · API · Docs · Trust · Admin · Match · Flow

---

## 2. PALETTE — 3 LỚP

### 2.1 SUBSTRATE (deep space — 60–70% UI)

| Token | HEX | Use |
|---|---|---|
| `--omdala-space-950` | `#040816` | Outermost background |
| `--omdala-space-900` | `#08101f` | Surface base |
| `--omdala-space-850` | `#0b1326` | Elevated card |
| `--omdala-space-800` | `#101c33` | Elevated 2 |

### 2.2 SIGNAL (cyan + blue — 25–35% UI)

| Token | HEX | Use |
|---|---|---|
| `--omdala-cyan-500` | `#3de7ff` | **Primary signal** — CTA, eyebrow, accent line |
| `--omdala-cyan-400` | `#7ef2ff` | Hover, lighter signal |
| `--omdala-blue-500` | `#3d8bff` | Secondary signal, link |
| `--omdala-glow` | `#63f5ff` | Box-shadow glow |

### 2.3 GOLD VERIFICATION (gold — < 5% UI, signal only)

| Token | HEX | Use |
|---|---|---|
| `--omdala-gold-500` | `#D4AF37` | Polished gold — verified state badge |
| `--omdala-gold-400` | `#E5C158` | Highlight |
| `--omdala-gold-bright` | `#FFD700` | 24K — success peak, ✓ icon |
| `--omdala-gold-soft` | `rgba(212,175,55,0.18)` | Background tint |

> **Gold = ngôn ngữ verification trust trong toàn hệ IAI.** Cùng giá trị màu với Nhà Chung — khác cách dùng. Nhà Chung dùng gold làm primary brand color (giá trị thật là toàn bộ); OMDALA dùng gold chỉ cho verification badge (giá trị thật là *kết quả của* coordination).

### 2.4 NEUTRAL TEXT

| Token | HEX | Use |
|---|---|---|
| `--omdala-white-100` | `#f7fbff` | Primary text |
| `--omdala-white-200` | `#dde8f5` | Secondary text |
| `--omdala-white-300` | `#bfcde1` | Muted, captions |

### 2.5 SEMANTIC (UI states — < 2% UI)

| Token | HEX | Use |
|---|---|---|
| `--omdala-critical-500` | `#FF5E5B` | Error, blocked |
| `--omdala-warning-500` | `#FFB800` | Warning (DISTINCT from gold-500 — không nhầm với verified) |

---

## 3. NGUYÊN TẮC KẾT HỢP

### ✅ DO

- Substrate (60–70%) + Signal cyan (25–35%) + White text (10–15%) + Gold verification (< 5%)
- Cyan accent ở: eyebrow leading line, button primary, panel corners, hero edge
- Gold CHỈ ở: verified badge, success state khi proof xác thực thành công
- Single-pixel signal lines (1px hairline cyan) > heavy borders
- Subtle scan-line animation (18s loop, opacity 0.4) > flashy gradients

### ❌ DON'T

- Gold cho decorative — phá triết lý "verification only"
- Mix yellow `#FFB800` warning với gold verified `#D4AF37` cùng vị trí
- Heavy gradients — phá brand traits "calm, durable"
- Three.js / GSAP — pure CSS đủ
- Magenta, violet, đỏ tươi — không thuộc palette

---

## 4. TYPOGRAPHY

Giữ nguyên từ v1.1:
- Display + Heading: `Inter` 700, letter-spacing -0.02em
- Body: `Inter` 400/500
- Mono (cho IDs, hashes): `JetBrains Mono` (chưa load — sẽ thêm khi cần)

V2.0 thêm:
- Hero `<h1>`: gradient text white → cyan-400 (`linear-gradient(180deg, #FFFFFF 0%, #7ef2ff 100%)` clip-text)
- Eyebrow: 0.72rem, letter-spacing 0.22em, cyan-500 + leading horizontal line 24px

---

## 5. COMPONENT STATES

### Button

```
Primary:
  bg: cyan-500 · color: space-950 · radius: pill
  hover: cyan-400 + box-shadow signal-strong + translateY(-1px) + sheen sweep
  focus: 0 0 0 3px rgba(126,242,255,0.4)

Ghost:
  bg: rgba(255,255,255,0.03) · border: subtle · color: white-100
  hover: bg cyan-soft + border cyan-glow + color cyan-400
```

### Panel (section card)

```
Default:
  bg: gradient(rgba(11,19,38,0.6) → rgba(8,16,31,0.4))
  border: 1px subtle white
  backdrop-filter: blur 12px
  corner ticks (top-left + bottom-right): 12px cyan, 1px stroke, opacity 0.55
  
Hover:
  border: cyan rgba(0.18)
  corner ticks: opacity 1
```

### Stack item (card in list)

```
Default:
  bg: rgba(16,28,51,0.45) · border subtle
  top accent bar: 24px × 2px cyan
  
Hover:
  border cyan rgba(0.32) · translateY(-2px) · shadow-signal
  top accent bar: width 56px (animates)
```

### Verified badge (gold trust signal)

```
Display:
  inline-flex pill · padding 4px 10px
  bg: gold-soft · color: gold-400 · border: gold rgba(0.32)
  prefix ✓ in gold-bright
  uppercase 0.72rem letter-spacing 0.08em

Use: chỉ khi 1 entity (member, place, claim) đã verified thành công.
```

### Inline link in body content

```
.panel p a, .panel li a, .section-copy a:
  color: cyan-400 · underline 1px cyan rgba(0.45) · offset 3px
  hover: cyan-500 underline + text-shadow glow
```

---

## 6. ANIMATION

| Element | Animation | Duration | Type |
|---|---|---|---|
| Body scan-line sweep | `omdala-scan` 0% → 200% | 18s linear infinite | Subtle ambient |
| Button primary | sheen sweep on hover | 0.7s ease-luxury | Interaction |
| Stack item top bar | width 24px → 56px | 0.4s ease-luxury | Hover |
| Panel corner ticks | opacity 0.55 → 1 | 0.4s ease-luxury | Hover |
| Hero h1 | gradient clip-text static | — | None |

**Easing chuẩn:** `cubic-bezier(0.32, 0.72, 0, 1)` (luxury cubic).

`prefers-reduced-motion: reduce` được tôn trọng — tắt mọi animation.

---

## 7. SUBSTRATE BACKGROUND

Body có 3 lớp:
1. **Existing radial glow** (cyan top-right + blue left-center) — giữ nguyên
2. **NEW: Grid lines** 48×48px, opacity 0.04 — gợi cảm giác "engineering substrate"
3. **NEW: Vertical scan-line** quét chậm (18s loop, opacity 0.4) — sự sống tối thiểu, không loạn

Background fixed (không scroll cùng content) → cảm giác "panel trên substrate".

---

## 8. SO SÁNH v1.1 → v2.0

| Tiêu chí | v1.1 | v2.0 |
|---|---|---|
| Brand traits | calm · premium · intelligent · systemic · trustworthy · durable | Giữ nguyên |
| Palette space | 4 token | 4 token (giữ) |
| Palette signal | cyan + blue | cyan + blue (giữ) |
| Palette gold | — | **+ gold verification (4 token)** |
| Animations | None defined | scan-line · sheen · accent grow |
| Component states | Implicit | **Explicit (button/panel/stack/badge/link)** |
| Substrate visual | Plain dark | **Grid 48px + scan-line** |
| Hero h1 | Plain white | **Gradient clip-text white → cyan** |
| Panel cards | Plain border | **Corner ticks + hover state** |
| Easing | Generic ease | **Luxury cubic** |
| Reduced motion | Unspecified | **Respected** |

---

## 9. APPLICATION CHECKLIST

Mọi PR touch UI phải pass:

- [ ] Background (substrate + scan + grid) hiển thị đúng trên `apps/web`
- [ ] Hero h1 render gradient clip-text (white → cyan-400)
- [ ] Eyebrow có leading line cyan
- [ ] Button primary có sheen sweep on hover
- [ ] Panel cards có corner ticks (top-left + bottom-right)
- [ ] Stack items có top accent bar grow on hover
- [ ] Verified badge (nếu dùng) chỉ ở context xác thực thành công
- [ ] Gold KHÔNG xuất hiện ở context decorative
- [ ] `prefers-reduced-motion: reduce` test pass (animation tắt)
- [ ] WCAG 2.1 AA contrast pass với mọi text/bg pair
- [ ] Lighthouse Performance ≥ 90, LCP < 2.5s
- [ ] Brand-lint script pass: `bash scripts/brand-lint-omdala.sh apps/web/app`
- [ ] Static fallback pass: `npm run brand:lint:static`
- [ ] Team report updated if score changes: `docs/OMDALA_BRANDPRO_APPLY_REPORT_2026-05-12.md`

---

## 10. PHẠM VI ÁP DỤNG (V2.0 DEMO)

**LÀM:**
- ✅ `apps/web/app/globals.css` (append-only overlay)
- ✅ `apps/web/app/page.js` (copy and proof state aligned to Brandpro-all)
- ✅ `index.html` + `styles.css` (static fallback aligned)
- ✅ Tài liệu brand v2.0 (file này)
- ✅ Brand-lint script

**KHÔNG LÀM trong demo này:**
- ❌ `apps/app` (member app — sau khi v2.0 web duyệt mới mở rộng)
- ❌ `apps/admin` (admin surfaces)
- ❌ `apps/auth` (auth flows)
- ❌ `apps/docs` (docs site)
- ❌ `services/*` (backend không có UI)
- ❌ `om-ai.omdala.com` và `omniverse.omdala.com` (sub-products riêng)
- ❌ Routes / content / i18n keys
- ❌ Backend, API, D1, DNS

---

## 11. EXTEND TO OTHER SURFACES (sau khi v2.0 web duyệt)

Thứ tự đề xuất khi mở rộng:
1. `apps/docs` — tương tự web, content-heavy → phù hợp Signal & Substrate
2. `apps/admin` — internal tool, có thể ưu tiên density > drama → giữ scan-line nhưng giảm corner ticks
3. `apps/app` — member app — cần test contrast cao hơn vì có form input dài
4. `apps/auth` — flow ngắn, có thể minh họa với gold verified state khi success
5. `om-ai.omdala.com` & `omniverse.omdala.com` — quyết định riêng (có thể cần variant brand v2.x)

---

## 12. ROLLBACK

V2.0 là **append-only overlay** trong `globals.css`. Nếu không phù hợp:

```bash
cd omdala.com
# Cách 1: revert v2.0 commit
git revert <v2.0-commit-sha>

# Cách 2: chuyển về branch trước
git checkout main
```

Không có schema, route, API, content nào bị thay đổi — rollback an toàn 100%.

---

## 13. NEXT — KHI FOUNDER DUYỆT

- [ ] Founder ký off branch `brand/v2.0-signal-substrate`
- [ ] Tạo PR + merge vào main
- [ ] Cloudflare Pages auto-deploy `omdala-web` (nếu Git connected)
- [ ] Verify production parity
- [ ] Commit brand book v2.0 chính thức (rename `OMDALA_V2_SIGNAL_SUBSTRATE.md` → `BRAND_ARCHITECTURE_OMDALA_V2.md`)
- [ ] Quyết định mở rộng sang surface nào tiếp theo (xem §11)

---

— Claude · 2026-05-08
