# OMCODE App — Manual Test & OTA Checklist

## 1. Môi trường kiểm thử cục bộ

```bash
cd /Users/tranhatam/Documents/Devnewproject/omdala.com/apps/app
pnpm dev        # chạy ở http://localhost:3000
```

Hoặc nếu đã có build:

```bash
cd out
python3 -m http.server 3000
```

## 2. Checklist kiểm thử tay — 10 phút

### A. Trang chủ / Landing
| Bước | Mô tả | Pass?
|------|-------|-------|
| 1 | Mở `http://localhost:3000` | |
| 2 | Hero section hiển thị tiếng Việt | |
| 3 | 3 nút CTA (Primary / Ghost / Docs) clickable | |
| 4 | Scroll xuống Pricing / Features / Tech Stack / Use Cases / CTA / Footer | |
| 5 | Không có lỗi console (F12 → Console) | |

### B. Workspace / OMCode IDE
| Bước | Mô tả | Pass?
|------|-------|-------|
| 6 | Click "Open IDE" → chuyển sang `/workspace` | |
| 7 | Sidebar hiện: Explorer, Search, Git, AI Chat, Terminal, Settings, Project Tracker | |
| 8 | File tree có thể click để mở file | |
| 9 | Monaco Editor hiển thị code với syntax highlight | |
| 10 | AI Chat panel: gõ `/explain` → AI trả lời | |
| 11 | Terminal: gõ `ls`, `pwd`, `clear` hoạt động | |
| 12 | Terminal: gõ `rm file.js` → hiện confirm dialog | |
| 13 | Settings: nhập API key → save → reload vẫn giữ | |
| 14 | Account: login với email/password → "Connected" | |

### C. Auth / Đăng nhập
| Bước | Mô tả | Pass?
|------|-------|-------|
| 15 | Truy cập `/sign-in` hoặc click "Đăng nhập" | |
| 16 | Nhập email → nhận Magic Link (hoặc mock ở dev) | |
| 17 | Click Magic Link → session được tạo | |
| 18 | Click "Đăng xuất" → redirect về `/` | |

### D. Responsive / Mobile
| Bước | Mô tả | Pass?
|------|-------|-------|
| 19 | Chrome DevTools → iPhone 14 Pro → layout không vỡ | |
| 20 | Hamburger menu hoạt động trên mobile | |

## 3. Tải ứng dụng — Install PWA

### Chrome Desktop
1. Mở app ở `https://omcode.pages.dev` (hoặc `localhost:3000`)
2. Click biểu tượng 🔽 (install) ở thanh địa chỉ
3. Chọn "Install OMCODE"
4. App xuất hiện ở Desktop / Applications / Start Menu

### Chrome Mobile (Android)
1. Mở app ở trình duyệt
2. Chrome menu → "Thêm vào màn hình chính"
3. App xuất hiện như native app

### Safari iOS
1. Mở app ở Safari
2. Share button → "Thêm vào màn hình chính"
3. Đặt tên "OMCODE" → Thêm

## 4. Kiểm tra tự cập nhật (OTA — Over The Air)

OMCODE là Next.js app được deploy dưới dạng static site. Cập nhật OTA phụ thuộc vào:

### A. Static Site (Cloudflare Pages)

**Không có tự cập nhật "hard reload" mặc định.** Người dùng phải:
- Đóng tab → mở lại
- Hoặc nhấn F5 / pull-to-refresh

**Cách thêm tự cập nhật:**

1. **Service Worker** (recommend):
   ```typescript
   // app/layout.tsx hoặc app/providers.tsx
   "use client";
   import { useEffect } from "react";

   export function AutoUpdateProvider({ children }: { children: React.ReactNode }) {
     useEffect(() => {
       if ("serviceWorker" in navigator) {
         navigator.serviceWorker.register("/sw.js").then((reg) => {
           reg.addEventListener("updatefound", () => {
             const newWorker = reg.installing;
             newWorker?.addEventListener("statechange", () => {
               if (newWorker.state === "activated") {
                 // New version ready → prompt user
                 if (confirm("OMCODE đã có phiên bản mới. Tải lại để cập nhật?")) {
                   window.location.reload();
                 }
               }
             });
           });
         });
       }
     }, []);
     return children;
   }
   ```

2. **Polling check** (đơn giản hơn):
   ```typescript
   "use client";
   import { useEffect } from "react";

   const VERSION_URL = "/version.json"; // build-time file

   export function useAutoUpdate() {
     useEffect(() => {
       const currentVersion = document.querySelector('meta[name="app-version"]')?.getAttribute("content");
       
       const check = async () => {
         try {
           const res = await fetch(`${VERSION_URL}?_=${Date.now()}`, { cache: "no-store" });
           const { version } = await res.json();
           if (version && version !== currentVersion) {
             if (confirm("OMCODE đã có phiên bản mới. Tải lại để cập nhật?")) {
               window.location.reload();
             }
           }
         } catch {}
       };

       check();
       const id = setInterval(check, 5 * 60 * 1000); // check every 5 min
       return () => clearInterval(id);
     }, []);
   }
   ```

3. **Build-time version file** (`scripts/generate-version.js`):
   ```javascript
   const fs = require("fs");
   const { execSync } = require("child_process");
   
   const version = {
     version: Date.now().toString(36),
     buildTime: new Date().toISOString(),
     gitCommit: execSync("git rev-parse --short HEAD").toString().trim(),
   };
   
   fs.writeFileSync("out/version.json", JSON.stringify(version, null, 2));
   console.log("Version:", version.version);
   ```

### B. Tauri Desktop App

Nếu build Tauri desktop app (`.app` / `.dmg` / `.exe`):

**Auto-update với Tauri updater:**

```json
// src-tauri/tauri.conf.json
{
  "plugins": {
    "updater": {
      "active": true,
      "dialog": true,
      "endpoints": ["https://api.omdala.com/v1/omcode/releases"],
      "pubkey": "YOUR_PUBLIC_KEY"
    }
  }
}
```

**Yêu cầu:**
- Sign app với certificate (macOS: Apple Developer ID, Windows: code signing cert)
- Host update JSON ở endpoint
- Update JSON format:
  ```json
  {
    "version": "1.0.1",
    "notes": "Bug fixes",
    "pub_date": "2026-06-01T00:00:00Z",
    "platforms": {
      "darwin-x86_64": {
        "signature": "...",
        "url": "https://cdn.omdala.com/omcode/1.0.1/omcode-x64.app.tar.gz"
      },
      "darwin-aarch64": {
        "signature": "...",
        "url": "https://cdn.omdala.com/omcode/1.0.1/omcode-aarch64.app.tar.gz"
      }
    }
  }
  ```

## 5. Hiện trạng OMCODE

| Platform | Tự cập nhật | Cần làm |
|----------|-------------|---------|
| Web (PWA) | ❌ Chưa | Thêm Service Worker hoặc polling |
| Tauri Desktop | ❌ Chưa | Config updater + sign app |

## 6. Khuyến nghị triển khai

### Ngắn hạn (30 phút)
1. Thêm `version.json` generation vào build script
2. Thêm `useAutoUpdate()` hook vào layout
3. Test: deploy → mở app → deploy lại → app detect và prompt reload

### Trung hạn (2-3 giờ)
1. Implement Service Worker với Workbox
2. Add offline caching cho static assets
3. Background sync cho AI chat messages

### Dài hạn (1-2 ngày)
1. Setup Tauri updater endpoint
2. Sign macOS app (Apple Developer ID $99/year)
3. Sign Windows app (code signing cert ~$200/year)
4. CI/CD pipeline tự động publish update

---

## Checklist cuối cùng

- [ ] App chạy local không lỗi
- [ ] Cài đặt PWA thành công
- [ ] Test xong 20 bước checklist
- [ ] Quyết định: có triển khai tự cập nhật không?
- [ ] Nếu có: chọn polling (đơn giản) hay Service Worker (mạnh hơn)
