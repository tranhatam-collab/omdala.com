# BATCH_S2_STAKEHOLDER_SIGN_OFF_2026.md

**Phiên bản**: 1.0
**Trạng thái**: DANH SÁCH KÝ DỰỢ BATCH S2
**Ngày**: April 4, 2026
**Thời hạn ký**: April 5, 2026

---

# 1. BATCH S2 LÀ GÌ?

**Batch S2** = **Phân tách thông số sản phẩm** (Product Spec Separation)

Giai đoạn này hoàn thiện **4 tài liệu chi tiết**:
1. ✅ `OM_AI_MASTER_DEV_PLAN_2026.md` — Kế hoạch phát triển Om AI
2. ✅ `AI_OMNIVERSE_MASTER_DEV_PLAN_2026.md` — Kế hoạch phát triển Omniverse
3. ✅ `OM_AI_WEB_ADMIN_PLAN_2026.md` — Giao diện web + admin Om AI
4. ✅ `AI_OMNIVERSE_WEB_ADMIN_PLAN_2026.md` — Giao diện web + admin Omniverse

**Mục đích**: Khóa lại toàn bộ thông số kỹ thuật, quy mô MVP, lộ trình 8 tuần, và chỉ tiêu thành công trước khi bắt đầu code.

**Ai cần ký duyệt**:
- **Lãnh đạo sản phẩm** (Product Lead)
- **Giám đốc kỹ thuật** (CTO / Tech Lead)
- **Lãnh đạo tài chính** (CFO / Business Lead)
- **Lãnh đạo các team phát triển** (Team A Lead, Team B Lead)

---

# 2. DANH SÁCH KIỂM TRA BATCH S2

## 2.1 Lãnh đạo Sản phẩm (Product Lead)

Hãy kiểm tra **OM_AI_MASTER_DEV_PLAN_2026.md** và **AI_OMNIVERSE_MASTER_DEV_PLAN_2026.md**:

### Xác nhận Om AI:
- [ ] **Phạm vi MVP rõ ràng** — 3 personas, live call, transcript, recap, free 30min/day, Pro $9.99/month
- [ ] **Người dùng target rõ ràng** — Học sinh (13-25), chuyên gia (25-45), phụ huynh, nhóm, trường học
- [ ] **Chỉ tiêu KPI hợp lý** — 5k DAU, 95% call success, 5% conversion, >40 NPS
- [ ] **Lộ trình 8 tuần khả thi** — Giai đoạn từng tuần rõ ràng
- [ ] **Giá cả hợp lý** — Free tier (30 min/day) vs Pro ($9.99/month)
- [ ] **Không có tính năng bị cắt** — Rõ ràng cái gì NOT in MVP (video, custom personas, curriculum, v.v.)

### Xác nhận Omniverse:
- [ ] **Phạm vi MVP rõ ràng** — Nhà thông minh, quản lý phòng, điều khiển thiết bị, scene, automation cơ bản
- [ ] **Người dùng target rõ ràng** — Chủ nhà (30-60), nhân viên quản lý văn phòng (35-55), khách sạn/venue, team facilities
- [ ] **Chỉ tiêu KPI hợp lý** — 10k DAU, 99% device control success, 98% scene execution, >50 NPS
- [ ] **Lộ trình 8 tuần khả thi** — Từng tuần rõ ràng, thiết bị discovery, device control, scene, automation
- [ ] **Giá cả hợp lý** — Free tier vs Home Pro vs Business Space
- [ ] **Không có tính năng bị cắt** — Rõ ràng cái gì NOT in MVP (Matter, ML scheduling, multi-property, v.v.)

### Xác nhận Chiến lược Chung:
- [ ] **2 sản phẩm riêng biệt là đúng** — Không nên gộp lại, mỗi cái có thị trường riêng
- [ ] **Giá cả riêng là đúng** — Om AI có mô hình đăng ký khác với Omniverse
- [ ] **Tiếp cận người dùng rõ ràng** — Om AI = learning/communication, Omniverse = device control
- [ ] **Sẵn sàng để marketing** — Có thể viết messaging cho từng sản phẩm

---

## 2.2 Giám đốc Kỹ thuật (CTO / Tech Lead)

Hãy kiểm tra tất cả 4 tài liệu Batch S2:

### Kiến trúc Om AI:
- [ ] **Tech stack hợp lý** — iOS (Swift), Android (Kotlin), Web (React), Backend (Cloudflare Workers + Node.js)
- [ ] **API contracts rõ ràng** — /v1/live/call/*, /v1/live/recap/*, WebSocket cho transcript
- [ ] **Mô hình dữ liệu đầy đủ** — personas, calls, transcripts, recaps, usage_events
- [ ] **Tích hợp iai.one khả thi** — Provider cho live call + speech synthesis

### Kiến trúc Omniverse:
- [ ] **Tech stack hợp lý** — iOS (Swift + CoreBluetooth), Android (Kotlin + BLE), Web (React), Backend (Cloudflare + gateway)
- [ ] **API contracts rõ ràng** — /v2/omniverse/homes/*, /v2/omniverse/devices/*, /v2/omniverse/scenes/*, /v2/omniverse/automations/*
- [ ] **Mô hình dữ liệu đầy đủ** — homes, rooms, devices, scenes, automations, activity_log
- [ ] **Device gateway khả thi** — Giao tiếp với manufacturers (Philips, Nest, TP-Link, v.v.)

### Shared Core / Platform:
- [ ] **8 dịch vụ chung rõ ràng** — Auth, Billing, Workspace, Provider Router, Notifications, Analytics, Account, Design System
- [ ] **API gateway pattern hợp lý** — Shared core ở /v1/*, app-specific ở /v2/*
- [ ] **Không có xung đột giữa 2 app** — Ranh giới rõ ràng, mỗi team độc lập
- [ ] **Có thể mở rộng được** — Cấu trúc hỗ trợ phase 2, 3, 4 trong tương lai

### Deployment & DevOps:
- [ ] **Cloudflare Pages + Workers khả thi** — Có thể scale tới 5k-10k DAU
- [ ] **CI/CD qua GitHub Actions rõ ràng** — Tự động build, test, deploy
- [ ] **Monitoring đủ** — Sentry, Segment, Cloudflare Analytics
- [ ] **Không có rủi ro bảo mật lớn** — CORS, HTTPS, rate limiting, CSRF, XSS protection

### Team Size & Budget:
- [ ] **6-8 engineers cho Team A (Omniverse) là hợp lý**
- [ ] **8-10 engineers cho Team B (Om AI) là hợp lý**
- [ ] **5-7 engineers cho Team Platform (Shared Core) là hợp lý**
- [ ] **$2.2k-7k/month (Omniverse) + $3.5k-7.5k/month (Om AI) cho ops là chấp nhận được**

---

## 2.3 Lãnh đạo Tài chính (CFO / Business Lead)

Kiểm tra **tất cả 4 tài liệu**, tập trung vào **Budget & KPIs**:

### Doanh thu Om AI:
- [ ] **Free tier logic rõ ràng** — 30 min/ngày không tính tiền, sẽ convert ~5% lên Pro
- [ ] **Pro pricing hợp lý** — $9.99/month ($119.88/year) là giá cạnh tranh
- [ ] **5k DAU target achievable** — Dựa trên LTV ~$30-50/user (6-12 month payback)
- [ ] **5% conversion target** — Conservative, có thể cao hơn với good UX

### Doanh thu Omniverse:
- [ ] **Free tier + Pro tier logic rõ ràng** — Free (1 home) → Home Pro ($4.99/month hoặc $49/year) → Business Space ($9.99/month/user)
- [ ] **Home Pro pricing hợp lý** — $49/year = $4.08/month, affordable cho homeowners
- [ ] **Business Space pricing hợp lý** — $9.99/user/month cho teams
- [ ] **10k DAU target achievable** — Lớn hơn Om AI vì có thêm B2B use case

### Chi phí vận hành:
- [ ] **$2.2k-7k/month (Omniverse) + $3.5k-7.5k/month (Om AI) hợp lý** — Scales với traffic
- [ ] **Team cost ~$340k-440k/month** — $140-190k Om AI + $200-250k Omniverse, reasonable
- [ ] **Runway đủ dài** — Tới June 1 target launch
- [ ] **Path to profitability rõ ràng** — 5k-10k DAU sẽ đủ để cover ops + team cost

### Go-live Readiness:
- [ ] **June 1, 2026 là target hợp lý** — 8 tuần từ April 16
- [ ] **Closed beta (week 6-7) là strategy tốt** — Test với 100 users trước public
- [ ] **Growth phase June-Aug hợp lý** — 3 tháng để tới 5k-10k DAU
- [ ] **Không có risk tài chính lớn** — MVP scope nhỏ, cost quản lý được

---

## 2.4 Lãnh đạo Team A (Omniverse Lead)

Kiểm tra **AI_OMNIVERSE_MASTER_DEV_PLAN_2026.md**:

### Scope & Timeline:
- [ ] **8 tuần là hợp lý cho MVP** — 6-8 engineers, phạm vi rõ ràng
- [ ] **Sprint plan hợp lý** — Week 1-2 (home/room), Week 2-3 (device), Week 4 (room dashboard), Week 5 (scene), Week 6 (automation), Week 7 (perf/security), Week 8 (QA)
- [ ] **Không có feature bloat** — Rõ ràng NOT in MVP
- [ ] **QA time là đủ** — Week 7-8 cho testing, fixes, soft launch

### Tech Stack:
- [ ] **iOS (Swift + SwiftUI + CoreBluetooth) khả thi** — 2-3 engineers, reasonable
- [ ] **Android (Kotlin + BLE APIs) khả thi** — 2-3 engineers, reasonable
- [ ] **Web (React 18) khả thi** — 1 engineer, reasonable
- [ ] **Backend (Cloudflare Workers + Node.js gateway) khả thi** — 1-2 engineers

### Dependencies:
- [ ] **Shared core services sẵn sàng đúng lúc** — Auth (week 1), Billing (week 2-3)
- [ ] **Device manufacturer APIs sẽ hỗ trợ** — Philips, Nest, TP-Link, v.v.
- [ ] **Không bị chặn bởi platform team** — Team Platform phải xong Auth/Billing trước week 2

---

## 2.5 Lãnh đạo Team B (Om AI Lead)

Kiểm tra **OM_AI_MASTER_DEV_PLAN_2026.md**:

### Scope & Timeline:
- [ ] **8 tuần là hợp lý cho MVP** — 8-10 engineers, phạm vi rõ ràng
- [ ] **Sprint plan hợp lý** — Week 1 (auth/DB), Week 2 (WebRTC/audio), Week 3 (persona), Week 4 (UI), Week 5 (recap), Week 6 (perf/security), Week 7 (QA), Week 8 (soft launch)
- [ ] **3 personas (English Teacher, Business Coach, Wellness) là đủ** — Có thể test + validate
- [ ] **Transcript + recap generation khả thi** — iai.one provider hỗ trợ

### Tech Stack:
- [ ] **iOS (Swift + SwiftUI + WebRTC) khả thi** — 2-3 engineers
- [ ] **Android (Kotlin + ExoPlayer + WebRTC) khả thi** — 2-3 engineers
- [ ] **Web (React 18 + WebRTC) khả thi** — 1-2 engineers
- [ ] **Backend (Cloudflare Workers + Node.js) khả thi** — 2-3 engineers

### Dependencies:
- [ ] **iai.one integration khả thi** — Provider sẽ hỗ trợ live call + speech synthesis
- [ ] **Shared core services sẵn sàng đúng lúc** — Auth (week 1), Billing (week 2-3)
- [ ] **WebSocket real-time khả thi** — Cloudflare Durable Objects hoặc trickle-ICE relay
- [ ] **Không bị chặn bởi platform team** — Tương tự Team A

---

# 3. DANH SÁCH KIỂM TRA CHUNG (ALL STAKEHOLDERS)

### Chất lượng Tài liệu:
- [ ] **Tất cả 4 tài liệu đều đầy đủ** — Không thiếu phần nào quan trọng
- [ ] **Rõ ràng & không mâu thuẫn** — Mỗi tài liệu nhất quán với nhau
- [ ] **Có thể hiểu được bởi engineers** — Đủ chi tiết để bắt đầu code
- [ ] **Có thể hiểu được bởi non-technical** — Product, leadership hiểu được phạm vi + KPI

### Mục tiêu Chung:
- [ ] **2 sản phẩm riêng biệt** — Rõ ràng tại sao split, không gộp lại được
- [ ] **Shared core là nền tảng** — Auth, Billing, Workspace, v.v. là hỗ trợ cho cả 2 app
- [ ] **Teams độc lập** — Team A, Team B, Team Platform có ranh giới rõ ràng
- [ ] **June 1 launch target** — Cả 2 app beta-ready cùng ngày

### Risk Mitigation:
- [ ] **Không có tech risk lớn** — Stack là proven, không dùng công nghệ quá new
- [ ] **Không có schedule risk lớn** — Timeline là conservative, có buffer
- [ ] **Không có financial risk lớn** — Cost quản lý được, revenue model clear
- [ ] **Không có team risk lớn** — Size hợp lý, roles rõ ràng, dependency minimal

---

# 4. MẪU KÝ DUYỆT BATCH S2

```markdown
## BATCH S2 SIGN-OFF

**Ngày**: [ngày ký]
**Phiên bản**: 1.0 (Chính thức)

### Lãnh đạo Sản phẩm
- [ ] **Product Lead**: [tên] _____ Ngày: _____
  - Xác nhận: Phạm vi Om AI + Omniverse rõ ràng, KPI hợp lý, không có feature bloat.

### Kỹ thuật
- [ ] **CTO**: [tên] _____ Ngày: _____
  - Xác nhận: Kiến trúc tech sound, stack phù hợp, API contracts rõ ràng, không có tech risk lớn.

- [ ] **Team A Lead (Omniverse)**: [tên] _____ Ngày: _____
  - Xác nhận: MVP scope rõ ràng, 8 tuần timeline khả thi, 6-8 engineers là đủ.

- [ ] **Team B Lead (Om AI)**: [tên] _____ Ngày: _____
  - Xác nhận: MVP scope rõ ràng, 8 tuần timeline khả thi, 8-10 engineers là đủ.

- [ ] **Platform Lead (Shared Core)**: [tên] _____ Ngày: _____
  - Xác nhận: Shared core boundary rõ ràng, dependencies quản lý được, 5-7 engineers là đủ.

### Lãnh đạo Tài chính
- [ ] **CFO / Business Lead**: [tên] _____ Ngày: _____
  - Xác nhận: Budget hợp lý, revenue model clear, path to profitability tồn tại, June 1 target achievable.

### Lãnh đạo Công ty
- [ ] **CEO / Founder**: [tên] _____ Ngày: _____
  - Xác nhận: Chiến lược 2 sản phẩm là đúng, market fit rõ ràng, ready to execute.

---

### Ghi chú / Quan ngại:
[Thêm bất kỳ quan ngại hoặc điều kiện nào]

---
```

---

# 5. TIẾP THEO SAU BATCH S2

Khi tất cả stakeholders ký duyệt:

1. **April 5** — Batch S2 sign-off hoàn tất
2. **April 6-14** — Code migration (move code từ /apps, /services → new structure)
3. **April 15** — Batch S2 hoàn toàn locked, không thay đổi
4. **April 16** — Development officially starts, Team A + Team B begin coding
5. **June 1** — MVP launch target

**Không bước lại** — Khi Batch S2 ký rồi, không có thay đổi lớn nữa, chỉ có bug fixes.

---

# 6. NGÔN NGỮ & TÀI LIỆU

Từ April 16 tới, tất cả developer communication sẽ:
- **Lãnh đạo** = Tiếng Việt (dễ hiểu)
- **Code** = Tiếng Anh (standard)
- **Web UI** = Song ngữ (Anh + Việt)
- **Comments & Docs** = Song ngữ, tiếng Anh ưu tiên

---

# 7. TRÁCH NHIỆM TRƯỚC APRIL 16

| Người | Trách nhiệm | Deadline |
|---|---|---|
| **Lãnh đạo sản phẩm** | Phê duyệt scope + KPI | April 5 |
| **CTO** | Phê duyệt kiến trúc tech | April 5 |
| **CFO** | Phê duyệt budget + timeline | April 5 |
| **Team Leads** | Xác nhận team size + khả thi | April 5 |
| **Platform Team** | Bắt đầu chuẩn bị shared core | April 6 |
| **Team A** | Chuẩn bị code migration | April 6 |
| **Team B** | Chuẩn bị code migration | April 6 |
| **DevOps** | Chuẩn bị CI/CD pipeline | April 6-14 |

---

# END OF FILE

**Tác giả**: Architecture / Product
**Lần cập nhật cuối**: April 4, 2026
**Trạng thái**: Sẵn sàng cho ký duyệt stakeholder
