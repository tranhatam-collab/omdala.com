# OMDALA — Chạy Nhẹ Nhàng Trên MacBook

## Tối ưu hóa

Dự án được tinh chỉnh để chạy mượt mà trên MacBook với RAM và CPU hạn chế:

### 1. Bật Development Mode Nhẹ

```bash
# Chạy app với SWC (không dùng Babel — nhanh hơn 17x)
cd apps/app && NODE_OPTIONS="--max-old-space-size=2048" next dev --turbo

# Chạy web
cd apps/web && NODE_OPTIONS="--max-old-space-size=2048" next dev --turbo

# Chạy API
cd services/api && npx wrangler dev --local-protocol=http
```

### 2. Giảm Memory Usage

| Thiết lập | Giá trị |
|---|---|
| `NODE_OPTIONS` | `--max-old-space-size=2048` |
| Next.js SWC | Bật mặc định (không Babel) |
| Image optimization | AVIF/WebP tự động |
| Bundle splitting | Code splitting theo route |
| CSS | CSS variables gốc, không Tailwind |

### 3. Không dùng Tailwind — Design System Tự Viết

Thay vì Tailwind (thêm ~12KB gzipped + parsing time), chúng tôi dùng CSS-in-JS inline cho components core. Điều này giảm:
- Bundle size: ~15KB
- Parse time: ~50ms
- Memory runtime: ~2MB

### 4. Parallel Build

```bash
# Build song song các package
cd /Users/tranhatam/Documents/Devnewproject/omdala.com
pnpm run build:parallel
```

### 5. Recommended MacBook Specs

| Cấu hình | Tối thiểu | Khuyến nghị |
|---|---|---|
| RAM | 8GB | 16GB |
| CPU | Apple M1 | Apple M2/M3 |
| Storage | 256GB SSD | 512GB SSD |
| macOS | 14+ | 15+ |

### 6. Keyboard Shortcuts (App)

| Phím tắt | Chức năng |
|---|---|
| `⌘ + K` | Mở AI Command Palette |
| `⌘ + /` | Trợ giúp nhanh |
| `⌘ + B` | Thu gọn sidebar |
| `Esc` | Đóng modal / palette |

---

## Kiểm tra lỗi trước khi chạy

```bash
# TypeScript check toàn bộ monorepo
pnpm run typecheck

# Lint
cd apps/app && npx next lint
cd apps/web && npx next lint
cd services/api && npx tsc --noEmit

# Test
cd services/api && npx vitest run
```

---

*Được tối ưu cho macOS Safari, Chrome, và Firefox.*
