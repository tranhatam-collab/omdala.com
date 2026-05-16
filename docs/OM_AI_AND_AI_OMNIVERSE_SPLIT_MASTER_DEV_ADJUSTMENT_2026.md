# OM_AI_AND_AI_OMNIVERSE_SPLIT_MASTER_DEV_ADJUSTMENT_2026.md

Version: 1.0
Status: FINAL ADJUSTMENT PLAN FOR DEV TEAM
Scope: Tách hệ thành 2 app độc lập + web/admin riêng để giảm độ phức tạp
Date: April 4, 2026
Owner: Product / Architecture / Dev Handoff
Related systems: OMDALA, CIOS, Om AI, future Dash connectors

---

# 1. MỤC TIÊU CỦA FILE ĐIỀU CHỈNH NÀY

File này khóa lại toàn bộ định hướng cho team dev:

Không build tất cả vào một app/web nữa.

Thay vào đó, hệ sẽ được tách thành 2 sản phẩm độc lập nhưng cùng hệ sinh thái để:
- tránh app quá nặng
- tránh UX rối
- tránh scope dev bị phình quá lớn
- tránh team bị chia nhỏ năng lượng vào quá nhiều hướng cùng lúc
- tăng tốc MVP
- dễ gọi user đúng nhu cầu hơn
- dễ scale theo từng thị trường riêng

---

# 2. QUYẾT ĐỊNH KIẾN TRÚC MỚI

Toàn bộ hệ sẽ tách thành:

## App 1 — AI Omniverse
Tên làm việc: AI Omniverse hoặc Omniverse by OMDALA
Vai trò: App vạn vật / Reality Control / Device + Environment + Physical Action OS

Đây là app chuyên cho:
- điều khiển thiết bị
- không gian sống
- nhà thông minh
- văn phòng
- scene
- room control
- voice action cho thiết bị
- gateway
- physical reality orchestration
- future IoT / Matter / Home / office / kiosk / device graph

## App 2 — Om AI
Tên làm việc: Om AI
Vai trò: AI Human Call / Learning / Communication / Companion / Business Agent App

Đây là app chuyên cho:
- gọi AI như gọi người thật
- học tập
- tiếng Anh và ngôn ngữ
- giao tiếp
- chữa lành nhẹ / phản tư / đồng hành
- giáo viên AI
- giảng viên AI
- coach AI
- receptionist AI
- sales roleplay AI
- business communication AI

---

# 3. LÝ DO PHẢI TÁCH 2 APP

## 3.1 Lý do sản phẩm

Nếu gộp chung:
- user học tiếng Anh sẽ bị rối bởi tính năng điều khiển thiết bị
- user smart-home sẽ bị rối bởi lesson, teacher, coach, avatar, pricing giáo dục
- phụ huynh sẽ khó hiểu app này là app học hay app nhà thông minh
- doanh nghiệp cũng khó định nghĩa app để dùng cho receptionist hay control room
- marketing rất khó nói rõ sản phẩm là gì

Tách ra:
- mỗi app có định vị rõ
- mỗi app có UX rõ
- mỗi app có roadmap rõ
- mỗi app có growth riêng
- mỗi app có pricing riêng
- mỗi app có KPI rõ hơn

## 3.2 Lý do kỹ thuật

Nếu gộp chung:
- mobile app quá nặng
- native modules quá nhiều
- permission quá phức tạp
- risk crash/coupling cao
- team dev bị kéo giữa audio realtime, avatar, billing, curriculum, smart-device, gateway, scene graph, Matter, admin, parent control, business mode cùng lúc

Tách ra:
- App vạn vật tập trung device + gateway + room + scene + automation
- App Om AI tập trung realtime call + persona + memory + curriculum + business/live interaction

## 3.3 Lý do vận hành

Tách app giúp:
- release độc lập
- test độc lập
- tuyển team theo trục chuyên môn rõ hơn
- dễ pivot từng nhánh
- dễ monetization riêng
- tránh một app bị ảnh hưởng vì nhánh kia chưa chín

---

# 4. KIẾN TRÚC HỆ SINH THÁI SAU KHI TÁCH

## 4.1 Tầng thương hiệu

### OMDALA
Thương hiệu hệ sinh thái gốc

### AI Omniverse
App vạn vật / không gian / thiết bị / reality control

### Om AI
App AI human / learning / live call / communication / business agent

## 4.2 Tầng domain gợi ý

### AI Omniverse
- `omniverse.omdala.com`
- `app.omniverse.omdala.com`
- `api.omdala.com/v2/omniverse`

### Om AI
- `om-ai.omdala.com`
- `app.om-ai.omdala.com`
- `api.omdala.com/v2/live`

## 4.3 Tầng backend

Có thể dùng chung một số core services:
- auth
- account
- billing core
- provider registry
- analytics core
- workspace core

Nhưng phải tách domain logic:

### Omniverse Domain
- devices
- rooms
- scenes
- gateways
- reality graph
- automation
- physical proof

### Om AI Domain
- personas
- sessions
- live calls
- memory
- curriculum
- lesson progress
- parent control
- school mode
- business training mode

---

# 5. ĐỊNH NGHĨA SẢN PHẨM SAU KHI TÁCH

## 5A. APP 1 — AI OMNIVERSE

### 5A.1 Vai trò

App điều khiển vạn vật và không gian thực.

### 5A.2 Chức năng chính

- quản lý nhà / văn phòng / không gian
- room dashboard
- scene control
- device onboarding
- gateway linking
- voice command cho thiết bị
- automation cơ bản
- state graph
- status + alerts
- future bridge tới IoT / Matter / smart devices / office nodes

### 5A.3 Người dùng chính

- gia đình
- chủ nhà
- homestay
- villa
- văn phòng
- studio
- doanh nghiệp có không gian vật lý
- admin vận hành thiết bị

### 5A.4 Cái không nên có trong app này

Không đưa vào:
- lesson học tập
- teacher personas
- English practice core
- healing companion core
- avatar teacher calls
- school curriculum
- business roleplay learning

Các tính năng đó thuộc Om AI.

---

## 5B. APP 2 — OM AI

### 5B.1 Vai trò

App gọi AI human cho học tập, giao tiếp, đồng hành và doanh nghiệp.

### 5B.2 Chức năng chính

- live voice call
- video/avatar call nếu plan cho phép
- giáo viên AI
- giảng viên AI
- luyện tiếng Anh
- luyện đa ngôn ngữ
- coach giao tiếp
- người lắng nghe / phản tư / đồng hành nhẹ
- receptionist AI
- sales roleplay
- business communication trainer
- memory
- recap
- curriculum
- lesson progress
- subscription
- family / school / business modes

### 5B.3 Người dùng chính

- học sinh
- sinh viên
- phụ huynh
- người tự học
- người đi làm
- doanh nghiệp
- team sales
- đội CSKH
- tổ chức đào tạo

### 5B.4 Cái không nên có trong app này

Không đưa sâu vào:
- device control dashboard
- room/device graph
- Matter/home setup
- physical gateway control
- complex smart-home automation builder
- environment action orchestration

Các tính năng đó thuộc AI Omniverse.

---

# 6. TEAM DEV PHẢI HIỂU RÕ: CÙNG HỆ, KHÁC APP

## 6.1 Không phải 2 app hoàn toàn tách biệt về tài khoản

Có thể dùng chung:
- account
- đăng nhập
- subscription core
- payment core
- workspace core

Nhưng UI, data model chính, và roadmap phải tách.

## 6.2 Không được “lén” nhét lại tính năng chéo

Dev không được:
- đưa lesson vào AI Omniverse
- đưa room/device control phức tạp vào Om AI
- làm một dashboard chung quá sớm khiến app nào cũng nửa nạc nửa mỡ

## 6.3 Chỉ chia sẻ các lớp nền

Lớp chia sẻ:
- auth
- profile
- org/family/workspace identity
- notifications core
- billing engine
- provider registry
- analytics base
- settings shell
- design system nếu phù hợp

---

# 7. CẤU TRÚC TEAM SAU KHI TÁCH

## 7.1 Team A — AI Omniverse

Chịu trách nhiệm:
- mobile app Omniverse
- device UX
- room/scene UI
- gateway setup
- automation
- voice-to-device command
- physical action proof
- integrations with smart-device systems

## 7.2 Team B — Om AI

Chịu trách nhiệm:
- iOS/Android Om AI
- realtime calls
- persona system
- curriculum
- memory
- family/school/business interaction flows
- subscription and usage
- avatar/live interaction

## 7.3 Team Shared Platform

Chịu trách nhiệm:
- auth
- billing
- workspace
- provider router core
- infra
- monitoring
- security
- admin foundation
- shared analytics core

## 7.4 Team Web/Admin

Nên tách theo 2 web/admin:

### Omniverse Web/Admin
- rooms
- devices
- gateway
- scene builder
- automation
- status dashboard

### Om AI Web/Admin
- persona library
- curriculum
- memory admin
- family dashboard
- school admin
- business training dashboard
- reports
- subscriptions

---

# 8. ROADMAP SẢN PHẨM MỚI CHO DEV

## 8A. ROADMAP AI OMNIVERSE

### Phase O1 — Foundation
- app shell
- auth
- homes/spaces/rooms
- devices schema
- scene schema
- gateway concept
- voice-to-action basic
- room dashboard

### Phase O2 — Device MVP
- onboarding một số nhóm thiết bị
- trạng thái thiết bị
- bật/tắt/chỉnh scene
- alert cơ bản
- activity log
- proof log

### Phase O3 — Automation
- schedule
- simple automations
- multi-room state
- gateway runtime v1
- office/home modes

### Phase O4 — Advanced Reality
- stronger graph
- future device ecosystem expansion
- multi-property
- enterprise physical operations

## 8B. ROADMAP OM AI

### Phase A1 — Live Call MVP
- auth
- persona library
- realtime voice call
- 3 persona lõi
- recap
- 30 phút miễn phí/ngày
- subscription cơ bản

### Phase A2 — Family + Learning
- parent control
- child profiles
- lesson paths
- English and language learning
- progress tracking
- memory

### Phase A3 — School + Business
- school admin
- teacher assignment
- business personas
- receptionist
- sales roleplay
- org analytics

### Phase A4 — Advanced Personalization
- custom persona builder
- BYO API in higher plans
- provider routing expansion
- expert packs
- organization-grade controls

---

# 9. KẾ HOẠCH CHO IOS VÀ ANDROID SAU KHI TÁCH

## 9.1 Mỗi app có codebase mobile riêng hoặc monorepo tách app package

### Lựa chọn khuyến nghị
Một monorepo lớn nhưng có:
- `apps/om-ai-ios`
- `apps/om-ai-android`
- `apps/ai-omniverse-ios`
- `apps/ai-omniverse-android`
- shared packages ở mức vừa phải

Hoặc:
- 2 product repos riêng nếu team muốn tách hẳn release cycle

## 9.2 Không dùng chung quá nhiều code UI

Chỉ chia sẻ:
- design tokens
- auth SDK
- analytics SDK
- billing SDK
- API client core nếu hợp lý

Không chia sẻ ép buộc:
- screen flows
- navigation
- feature modules chính
- state domain của 2 app

---

# 10. KẾ HOẠCH WEB SAU KHI TÁCH

## 10.1 Web cho AI Omniverse

Mục tiêu:
- dashboard vận hành
- control rooms/devices/scenes
- admin gateway
- automation manager
- logs and proof

## 10.2 Web cho Om AI

Mục tiêu:
- persona browsing
- lessons
- reports
- family controls
- school admin
- business training dashboard
- recap and transcripts
- memory/settings
- subscriptions

## 10.3 Không nên cố gộp 2 dashboard vào 1 UI ngay

Có thể có một cổng mẹ của OMDALA, nhưng khi vào sử dụng phải tách surface rõ.

---

# 11. PRICING SAU KHI TÁCH

## 11A. PRICING CHO AI OMNIVERSE

### Nhóm gói
- Free/basic control
- Home Pro
- Family Space
- Business Space
- Enterprise Space

### Giá trị bán
- điều khiển không gian
- scene
- gateway
- device intelligence
- operational reliability

## 11B. PRICING CHO OM AI

### Nhóm gói
- Free
- Pro Individual
- Family
- School
- Business
- Enterprise

### Giá trị bán
- AI teacher
- AI human calls
- language learning
- coach
- family safe learning
- business receptionist/training
- memory + reports + organization controls

### Lưu ý
Không ràng buộc pricing của 2 app quá sớm thành 1 gói duy nhất.
Về sau có thể có OMDALA Bundle, nhưng không nên build bundle trước khi từng app tự đứng vững.

---

# 12. DATA MODEL ĐƯỢC PHÉP DÙNG CHUNG VÀ PHẢI TÁCH

## 12.1 Dùng chung được
- user
- account
- workspace core
- org/family identity
- payment customer
- subscriptions core
- provider registry core
- audit core mức nền
- notifications core

## 12.2 Phải tách

### Tách cho Omniverse
- devices
- rooms
- scenes
- gateways
- physical actions
- environment state
- automation rules
- physical proof logs

### Tách cho Om AI
- personas
- lessons
- live sessions
- learning progress
- recap
- memory
- parent control policies
- school assignments
- business training scenarios

---

# 13. TÍCH HỢP VỚI CIOS SAU KHI TÁCH

## 13.1 Tích hợp với app nào?

CIOS nên tích hợp trước với Om AI cho business interaction layer

Vì Om AI có:
- receptionist AI
- customer-facing agents
- sales training
- business communication
- internal training

## 13.2 AI Omniverse có thể tích hợp sau

Omniverse chỉ nên nối với CIOS khi có nhu cầu:
- office devices
- facility operations
- room status
- smart office coordination

Nhưng không phải ưu tiên đầu tiên.

---

# 14. ĐIỀU CHỈNH PHẠM VI CÔNG VIỆC CHO DEV

## 14.1 Những gì dừng lại ngay trong nhánh gộp cũ

Dev phải dừng tư duy:
- một app làm hết
- một dashboard làm hết
- một roadmap làm hết
- một pricing làm hết
- một UX làm hết

## 14.2 Những gì phải chuyển sang mô hình mới

- 2 product PRD riêng
- 2 app maps riêng
- 2 web/admin plans riêng
- 2 release plans riêng
- 2 KPI sets riêng
- shared platform core riêng

---

# 15. KPI RIÊNG CHO TỪNG APP

## 15A. KPI AI OMNIVERSE

- số không gian được kết nối
- số thiết bị active
- số scene chạy thành công
- DAU điều khiển
- lỗi gateway
- thời gian phản hồi action
- retention theo household/business space

## 15B. KPI OM AI

- daily call sessions
- average session length
- D1 / D7 retention
- free to paid conversion
- lesson completion
- persona retention
- family retention
- school/business seat activation

---

# 16. THỨ TỰ TRIỂN KHAI ĐÚNG CHO TEAM

## Giai đoạn 1 — Split Architecture Lock
Dev phải làm ngay:
1. xác nhận 2 app
2. khóa domain responsibility
3. khóa shared-core boundary
4. khóa repo structure
5. khóa team responsibilities

## Giai đoạn 2 — Product Spec Separation
Viết lại:
- PRD cho AI Omniverse
- PRD cho Om AI
- shared services spec

## Giai đoạn 3 — MVP Parallel Build
- Omniverse MVP riêng
- Om AI MVP riêng
- shared auth/billing/provider core song song

## Giai đoạn 4 — Web/Admin Separation
- Omniverse dashboard
- Om AI dashboard
- shared admin minimal

## Giai đoạn 5 — Expansion
- CIOS bridge cho Om AI
- future enterprise physical ops cho Omniverse

---

# 17. NHỮNG FILE DEV PHẢI VIẾT LẠI / TẠO MỚI SAU KHI TÁCH

## 17.1 File chiến lược mới bắt buộc

1. `AI_OMNIVERSE_MASTER_DEV_PLAN_2026.md`
2. `OM_AI_MASTER_DEV_PLAN_2026.md`
3. `OMDALA_SHARED_PLATFORM_CORE_BOUNDARY_2026.md`
4. `AI_OMNIVERSE_AND_OM_AI_REPO_SPLIT_DECISION.md`
5. `AI_OMNIVERSE_WEB_ADMIN_PLAN_2026.md`
6. `OM_AI_WEB_ADMIN_PLAN_2026.md`

## 17.2 File cho mobile architecture

7. `AI_OMNIVERSE_IOS_ANDROID_ARCHITECTURE_PLAN.md`
8. `OM_AI_IOS_ANDROID_ARCHITECTURE_PLAN.md`

## 17.3 File cho backend split

9. `OMDALA_SHARED_AUTH_BILLING_PROVIDER_CORE_SPEC.md`
10. `AI_OMNIVERSE_BACKEND_DOMAIN_SPEC.md`
11. `OM_AI_BACKEND_DOMAIN_SPEC.md`

## 17.4 File cho team execution

12. `DEV_TEAM_SPLIT_AND_RESPONSIBILITY_MATRIX_2026.md`
13. `AI_OMNIVERSE_RELEASE_PLAN_V1.md`
14. `OM_AI_RELEASE_PLAN_V1.md`

---

# 18. THỨ TỰ CODEX / DEV NÊN LÀM TIẾP

## Batch S1 — khóa chia hệ
- split decision file
- shared boundary file
- team responsibility matrix
- repo split decision

## Batch S2 — khóa từng product
- Omniverse master plan
- Om AI master plan
- web/admin plan riêng cho mỗi app

## Batch S3 — khóa mobile/backend
- iOS/Android plan cho Omniverse
- iOS/Android plan cho Om AI
- backend domain spec từng app

## Batch S4 — release planning
- release plan từng app
- KPI plan
- growth assumptions
- integration phases

---

# 19. HARD RULES CHO TEAM DEV

1. Không được tiếp tục thiết kế one app does everything.
2. Không được đẩy teacher/live-call/lesson vào Omniverse.
3. Không được đẩy room/device/automation phức tạp vào Om AI.
4. Không được dùng chung một dashboard duy nhất cho cả 2 app ở giai đoạn đầu.
5. Không được dùng chung domain model chính giữa 2 app ngoài shared core.
6. Không được để team mobile bị kéo giữa 2 app mà không chia ownership rõ.
7. Không được build pricing chung trước khi từng app rõ giá trị riêng.
8. Không được làm roadmap marketing chung làm mờ định vị từng app.
9. Không được gộp analytics thành một khối khó đọc.
10. Không được kéo CIOS vào cả 2 app cùng lúc ngay từ đầu.

---

# 20. KẾT LUẬN CHỐT CHO DEV

Từ thời điểm này, hệ phải được hiểu là:

## OMDALA
hệ sinh thái mẹ

## AI Omniverse
app vạn vật / không gian / thiết bị / physical reality control

## Om AI
app AI human / learning / communication / companion / business live agents

Đây là quyết định để:
- giảm rối
- giảm áp lực dev
- tăng tốc MVP
- giữ UX rõ
- giữ sản phẩm mạnh
- giúp mỗi nhánh có thể tự lớn

---

# 21. CHỈ ĐẠO TRIỂN KHAI NGAY

Team dev phải làm ngay 5 việc:

1. Dừng mọi tài liệu còn mô tả 1 app làm cả 2 nhánh.
2. Tạo lại product map thành 2 app riêng.
3. Tạo lại repo/release plan theo mô hình split.
4. Khóa shared platform boundary.
5. Viết lại master plans riêng cho AI Omniverse và Om AI.

---

# END OF FILE
