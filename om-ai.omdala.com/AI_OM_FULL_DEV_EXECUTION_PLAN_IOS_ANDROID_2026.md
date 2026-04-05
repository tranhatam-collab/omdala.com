# AI_OM_FULL_DEV_EXECUTION_PLAN_IOS_ANDROID_2026.md

Version: 1.0  
Status: FINAL DEV HANDOFF PLAN (No code – execution only)  
Scope: iOS + Android + Web + Backend + Gateway + Ecosystem  
Products: AI Om Core + AI Om Live  
Related: OMDALA, CIOS, Future Dash Integration  
Date: April 4, 2026

---

# 1. MỤC TIÊU TỔNG THỂ

Xây dựng AI Om thành một hệ điều hành AI Agent đa nền tảng:

- iPhone (native iOS)
- Android (native)
- Tablet (iPad + Android tablet)
- Desktop (web/PWA + optional wrapper)

Cho phép:
- gọi AI như gọi người thật
- học tập, luyện ngoại ngữ, giao tiếp, chữa lành nhẹ
- vận hành gia đình, lớp học, doanh nghiệp
- tạo AI Agent riêng
- dùng nhiều nguồn AI (OpenAI + bên thứ ba + BYO API)
- tích hợp hệ sinh thái OMDALA + mở rộng sang CIOS

---

# 2. NGUYÊN TẮC TRIỂN KHAI CHO DEV

## 2.1 Không build như app chat

Đây là:
→ hệ điều hành agent  
→ không phải chatbot  
→ không phải avatar demo

## 2.2 Không khóa vào 1 AI provider

Phải có:
→ Provider Router  
→ BYO API  
→ fallback strategy  

## 2.3 Native là tuyến chính cho call

- iOS: CallKit + audio stack
- Android: ConnectionService + Telecom API

## 2.4 Web là control layer

- dashboard
- memory
- admin
- lesson
- config

## 2.5 Server là source of truth

- quota
- billing
- memory
- session
- policy
- moderation

---

# 3. KIẾN TRÚC TỔNG THỂ

## 3.1 5 lớp hệ thống

1. Client Layer
   - iOS app
   - Android app
   - Web/PWA

2. Realtime Layer
   - voice stream
   - session control
   - interrupt handling

3. AI Router Layer
   - multi-provider
   - cost-aware routing
   - fallback

4. OMDALA Core Layer
   - memory
   - persona
   - curriculum
   - policy
   - analytics

5. Gateway / Integration Layer
   - devices
   - enterprise (CIOS)
   - external APIs
   - Dash (future)

---

# 4. PHÂN TÁCH MODULE THEO TEAM

## 4.1 Team Mobile (iOS + Android)

Chịu trách nhiệm:
- call experience
- audio routing
- UI/UX
- persona selection
- session control
- offline fallback UI

## 4.2 Team Web

Chịu trách nhiệm:
- dashboard
- admin
- curriculum
- memory editing
- reports
- subscription UI

## 4.3 Team Backend

Chịu trách nhiệm:
- API `/v2/live`
- provider router
- usage metering
- billing
- memory
- moderation
- analytics

## 4.4 Team AI / Integration

Chịu trách nhiệm:
- OpenAI realtime
- avatar providers
- speech pipeline
- provider adapters

## 4.5 Team Platform / Infra

Chịu trách nhiệm:
- scaling
- security
- logging
- monitoring
- gateway runtime

---

# 5. KẾ HOẠCH CHO iOS

## 5.1 Công nghệ

- SwiftUI
- AVFoundation (audio)
- Speech framework
- CallKit (call experience)
- WebRTC client
- App Intents (voice integration hệ thống)

## 5.2 Module iOS

1. App Shell
2. Auth + Session
3. Persona Browser
4. Call Screen
5. Audio Engine
6. Realtime Client
7. Memory Viewer
8. Lesson UI
9. Subscription UI
10. Settings
11. Parent Control UI

## 5.3 Luồng chính

User → chọn persona → bấm call  
→ tạo session backend  
→ nhận token realtime  
→ mở audio  
→ connect WebRTC  
→ start conversation  
→ track usage  
→ end → recap

---

# 6. KẾ HOẠCH CHO ANDROID

## 6.1 Công nghệ

- Kotlin + Jetpack Compose
- Android Telecom API / ConnectionService
- AudioRecord / AudioTrack
- WebRTC Android SDK
- Speech (Android API + fallback server)

## 6.2 Module Android

Tương tự iOS:

1. App Shell
2. Auth
3. Persona
4. Call UI
5. Audio Engine
6. Realtime Engine
7. Memory
8. Lesson
9. Billing
10. Settings
11. Parent Control

## 6.3 Khác biệt cần lưu ý

- Android fragmentation → test nhiều device
- Bluetooth routing phức tạp hơn iOS
- Background service cần xử lý cẩn thận
- Permission handling chi tiết hơn

---

# 7. WEB / PWA PLAN

## 7.1 Công nghệ

- Next.js / React
- WebRTC (browser)
- WebSocket fallback
- Responsive UI

## 7.2 Module

- Dashboard
- Persona Library
- Lesson Library
- Session History
- Memory Editor
- Parent/Admin Panel
- Subscription
- Organization Panel

---

# 8. BACKEND PLAN

## 8.1 Core services

1. Auth Service
2. Session Service
3. Realtime Token Service
4. Provider Router
5. Usage Metering
6. Billing Service
7. Memory Service
8. Persona Service
9. Curriculum Service
10. Moderation Service
11. Analytics Service

## 8.2 API Groups

- `/v2/live/personas`
- `/v2/live/sessions`
- `/v2/live/realtime`
- `/v2/live/memory`
- `/v2/live/usage`
- `/v2/live/plans`
- `/v2/live/moderation`
- `/v2/live/avatar`
- `/v2/live/provider`

---

# 9. PROVIDER ROUTER PLAN

## 9.1 Phải hỗ trợ

- OpenAI (default)
- Tavus
- HeyGen
- future providers
- BYO API

## 9.2 Routing logic

- plan-based
- cost-based
- latency-based
- region-based
- fallback chain

---

# 10. PARENT CONTROL + SCHOOL MODE

## 10.1 Parent control

- giới hạn thời gian
- chọn persona
- chặn nội dung
- báo cáo
- safe mode

## 10.2 School

- class
- teacher dashboard
- lesson assign
- report
- level tracking

---

# 11. BUSINESS MODE + CIOS

## 11.1 Business features

- receptionist AI
- sales training
- customer simulation
- internal training

## 11.2 CIOS integration (phase 3)

- auth sync
- workspace sync
- CRM context
- log sync
- analytics

---

# 12. USAGE + BILLING

## 12.1 Free

- 30 phút/ngày

## 12.2 Metering

- server-side
- seconds-based
- session-based

## 12.3 Plans

- Free
- Pro
- Family
- School
- Business
- Enterprise

---

# 13. SECURITY

- JWT / session token
- encrypted memory
- API key vault
- provider isolation
- moderation layer
- audit logs

---

# 14. ROADMAP CHO DEV

## Phase 0 (2–4 tuần)

- repo setup
- API contract
- persona schema
- provider router design
- iOS + Android skeleton

## Phase 1 (1–3 tháng)

- voice call MVP
- 3 persona
- 30 min free
- recap
- basic billing

## Phase 2 (3–6 tháng)

- avatar integration
- family mode
- school mode
- memory nâng cao

## Phase 3 (6–12 tháng)

- business mode
- CIOS integration
- multi-provider
- enterprise features

---

# 15. KPI BẮT BUỘC

- daily call usage
- session length
- retention day 1 / day 7
- conversion free → paid
- persona usage
- lesson completion
- error rate call

---

# 16. CHECKLIST TRIỂN KHAI

DEV phải đảm bảo:

- iOS + Android chạy ổn
- Web usable
- session realtime hoạt động
- audio không delay lớn
- fallback hoạt động
- quota đúng
- billing đúng
- memory không mất
- persona đúng role
- không crash khi provider fail

---

# 17. KẾT LUẬN CHO DEV

Đây là hệ:

- AI Agent OS đa nền tảng
- kết hợp học tập + giao tiếp + kinh doanh
- có thể scale từ cá nhân → gia đình → trường học → doanh nghiệp
- không phụ thuộc 1 AI duy nhất
- có thể mở rộng vô hạn theo API

DEV phải hiểu:

👉 Không build từng tính năng rời rạc  
👉 Build một hệ thống thống nhất  

---

# 18. BƯỚC TIẾP THEO

CODEX cần bắt đầu theo thứ tự:

1. API contract
2. provider router
3. iOS + Android call MVP
4. backend metering
5. persona system
6. subscription
7. web dashboard

---

# END OF FILE

Nếu bạn muốn, bước tiếp theo tôi có thể làm là:

👉 Viết luôn AI_OM_REPO_FULL_STRUCTURE (full tree + file names + responsibilities)
→ để DEV clone và build ngay không phải nghĩ nữa.
