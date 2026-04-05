# OM_AI_FRONTDESK_HOSPITALITY_EXPANSION_DECISION_2026.md

Version: 1.1
Status: FINAL PRODUCT SPLIT DECISION FOR DEV
Scope: Frontdesk / Hospitality / Restaurant / Hotel / Customer Interaction expansion
Date: April 4, 2026
Owner: Product / Architecture / Dev Handoff
Related systems: OMDALA, Om AI, AI Omniverse, CIOS

---

# 1. MỤC TIÊU CỦA FILE NÀY

File này khóa quyết định kiến trúc cho nhánh mở rộng:

- giao tiếp tự động cho nhà hàng
- lễ tân khách sạn
- check in / check out tự động
- hỏi đáp khách hàng
- hỗ trợ đặt bàn / đặt phòng / xác nhận thông tin
- hướng dẫn dịch vụ
- customer-facing AI kiosk / AI receptionist / AI host
- AI giao tiếp cho doanh nghiệp dịch vụ

Câu hỏi chính cần chốt:
- nên đưa vào App nào
- hay nên tạo App thứ 3
- đâu là phương án tối ưu nhất theo từng giai đoạn

---

# 2. KẾT LUẬN CHỐT NGẮN GỌN

## Quyết định tối ưu hiện tại

### Không đưa nhánh này vào AI Omniverse như lõi chính.

### Trước mắt đưa nhánh này vào Om AI,
nhưng tách thành một vertical/module riêng:

**Om AI Business Frontdesk / Hospitality**

### Về dài hạn:
nếu vertical này lớn đủ mạnh, có khách hàng riêng, workflow riêng, pricing riêng, và deployment riêng,
thì tách thành App thứ 3:

**AI Host / AI Frontdesk / AI Hospitality OS**
(tên làm việc, chưa khóa thương hiệu)

---

# 3. VÌ SAO KHÔNG NÊN ĐƯA VÀO AI OMNIVERSE

AI Omniverse là app vạn vật, thiên về:
- device control
- room/device/space graph
- automation
- physical reality control
- gateway
- scene
- môi trường vật lý

Nhánh frontdesk / nhà hàng / khách sạn lại thiên về:
- hội thoại
- tiếp đón
- hỏi đáp
- xác nhận thông tin
- dẫn dắt quy trình khách hàng
- upsell dịch vụ
- hỗ trợ đa ngôn ngữ
- xử lý ngữ cảnh giao tiếp
- customer-facing AI humans

Đây là bản chất gần với **Om AI** hơn rất nhiều.

Nếu nhét vào AI Omniverse:
- sản phẩm sẽ lệch khỏi định vị "app vạn vật"
- UX sẽ rối
- team device/gateway phải gánh thêm live call + persona + customer dialogue logic
- roadmap AI Omniverse sẽ phình sai hướng

---

# 4. VÌ SAO PHÙ HỢP VỚI OM AI

Om AI là app:
- gọi AI như gọi người thật
- giáo viên AI
- giảng viên AI
- language partner
- communication coach
- business interaction agent
- receptionist AI
- sales roleplay
- live customer-facing conversation

Nhánh frontdesk / hospitality thực chất là:
- persona doanh nghiệp
- hội thoại theo script và policy
- thu thập thông tin
- dẫn khách đi qua flow
- trả lời câu hỏi
- chuyển người thật khi cần
- đa ngôn ngữ
- hoạt động qua màn hình + mic + loa + camera tùy chọn

Đây chính là extension tự nhiên của Om AI.

---

# 5. LIÊN HỆ VỚI CIOS

CIOS là hệ riêng cho doanh nghiệp và cá nhân trong hệ đang làm, phù hợp hơn với:
- CRM
- doanh nghiệp
- lead intelligence
- governance
- audit
- compliance
- flow backend

Điều này dẫn tới kết luận:

## 5.1 CIOS không phải app frontdesk trực tiếp cho end-user

CIOS không nên là app lễ tân giao tiếp trực tiếp cho khách ở giai đoạn đầu.

## 5.2 Nhưng CIOS là backend / bridge rất phù hợp cho vertical business của Om AI

Om AI Business Frontdesk về sau có thể nối với CIOS để:
- lưu lead
- lưu hồ sơ khách
- đẩy conversation outcome vào CRM
- ghi log kiểm toán
- áp retention policy
- nối customer inquiry sang sales workflow
- nối frontdesk sang business intelligence layer

Kết luận:
- **frontdesk nên sống ở Om AI trước**
- **CIOS là lớp bridge doanh nghiệp về sau**
- không nên làm frontdesk app trực tiếp trong CIOS ở giai đoạn đầu

---

# 6. 3 PHƯƠNG ÁN CHO BẠN LỰA CHỌN

## PHƯƠNG ÁN A — ĐƯA VÀO OM AI NGAY BÂY GIỜ

### Tên module:
Om AI Business Frontdesk / Hospitality

### Nội dung:
- receptionist AI
- nhà hàng AI host
- khách sạn AI frontdesk
- check in / check out hỏi đáp tự động
- FAQ khách hàng
- multilingual guest support
- service guidance
- booking support
- upsell gợi ý dịch vụ

### Ưu điểm:
- nhanh nhất
- ít tốn nhất
- tận dụng 100% call / persona / realtime / memory / subscription stack của Om AI
- không cần thêm app thứ 3 ngay
- dễ pilot với khách hàng thật
- dễ gắn business personas vào hệ đang làm

### Nhược điểm:
- Om AI sẽ nặng thêm scope business
- cần cẩn thận để family / education UX không bị lẫn với hospitality / business
- cần tách module rõ trong IA và pricing

### Khi nên chọn:
- muốn đi nhanh
- muốn có MVP sớm
- muốn dùng chung lõi công nghệ
- team dev chưa đủ lực nuôi app thứ 3

### Đánh giá:
**Đây là phương án tối ưu nhất hiện tại**

---

## PHƯƠNG ÁN B — TẠO APP THỨ 3 NGAY TỪ ĐẦU

### Tên làm việc:
AI Host / AI Frontdesk / AI Hospitality OS

### Nội dung:
- nhà hàng
- khách sạn
- lễ tân
- showroom
- clinic frontdesk
- service desk
- multilingual kiosk assistant
- booking / check in / check out assistant

### Ưu điểm:
- định vị cực rõ
- dễ bán B2B
- không làm loãng Om AI
- không làm loãng AI Omniverse
- roadmap riêng
- pricing riêng
- enterprise story rõ

### Nhược điểm:
- tốn thêm app
- tốn thêm web/admin
- tốn thêm release cycle
- tốn thêm QA
- tốn thêm thương hiệu/marketing
- dễ chia nhỏ team quá sớm
- nhiều phần lõi vẫn phải copy hoặc tách shared platform

### Khi nên chọn:
- đã có khách hàng enterprise / hospitality rõ
- đã có team đủ lớn
- đã xác định đây là vertical doanh thu lớn riêng
- muốn làm B2B ngay từ đầu

### Đánh giá:
**Không phải phương án tối ưu nhất ngay bây giờ**
nhưng là hướng rất tốt sau khi Om AI Business chứng minh traction

---

## PHƯƠNG ÁN C — HYBRID 2 GIAI ĐOẠN

### Giai đoạn 1:
đưa vào Om AI như một vertical business riêng

### Giai đoạn 2:
khi đủ dữ liệu và khách hàng thật, spin out thành app thứ 3
dùng lại:
- persona system
- live call/runtime
- provider router
- metering
- billing core
- org admin foundation
- memory core
- moderation
- analytics

### Ưu điểm:
- nhanh để thử thị trường
- không tốn app thứ 3 quá sớm
- vẫn giữ đường lui để tách sau
- ít rủi ro hơn
- tối ưu vốn và nhân lực

### Nhược điểm:
- cần discipline kiến trúc ngay từ đầu để vertical này tách được sau
- phải cẩn thận boundary giữa Om AI core và Om AI Business Frontdesk

### Đánh giá:
**Đây là phương án chiến lược tốt nhất tổng thể**

---

# 7. QUYẾT ĐỊNH ĐỀ XUẤT CHÍNH THỨC

## Tôi đề xuất bạn chọn:
# PHƯƠNG ÁN C — HYBRID 2 GIAI ĐOẠN

### Nghĩa là:
1. Trước mắt build trong Om AI
2. Nhưng build theo kiến trúc có thể tách thành app thứ 3 sau này

---

# 8. CẦN ĐƯA NHÁNH NÀY VÀO APP NÀO NGAY BÂY GIỜ

## Chốt:
### Đưa vào **Om AI**
dưới một vertical/module riêng:

**Om AI Business Frontdesk**
hoặc
**Om AI Hospitality**
hoặc
**Om AI Customer Interaction**

Tên nội bộ dev có thể là:

`business_frontdesk`
`hospitality_frontdesk`
`customer_interaction_vertical`

---

# 9. CẤU TRÚC TÍNH NĂNG CHO NHÁNH NÀY TRONG OM AI

## 9.1 Hospitality / Frontdesk Personas

- Restaurant Host
- Hotel Frontdesk
- Check-in Assistant
- Check-out Assistant
- Guest Support Agent
- Booking Confirmation Agent
- FAQ Receptionist
- Service Recommendation Agent
- Multilingual Concierge
- Business Receptionist

## 9.2 Use cases chính

### Nhà hàng
- chào khách
- hỏi số người
- hỏi đã đặt bàn chưa
- gợi ý bàn
- giới thiệu menu
- hướng dẫn đặt món cơ bản
- gọi nhân viên thật khi cần

### Khách sạn
- tiếp nhận khách
- giải thích quy trình check in
- hỏi thông tin cần thiết
- giải thích check out
- trả lời câu hỏi về giờ giấc, dịch vụ, tiện ích
- hướng dẫn khách đến bộ phận phù hợp
- hỗ trợ đa ngôn ngữ

### Doanh nghiệp / lễ tân
- chào khách
- xác định mục đích đến
- hỏi bộ phận cần gặp
- hướng dẫn quy trình
- lấy thông tin cơ bản
- chuyển tiếp cho người thật / team thật

### Kiosk / màn hình / quầy
- hỏi đáp trực tiếp qua màn hình + mic + loa
- hiển thị các lựa chọn nhanh
- phát giọng nói
- gọi người hỗ trợ khi cần

---

# 10. PHÂN CHIA TRÁCH NHIỆM GIỮA 2 APP

## 10A. OM AI PHỤ TRÁCH

- dialogue
- persona
- guest interaction
- multilingual conversation
- check in question flow
- check out question flow
- booking FAQ
- upsell suggestions
- knowledge base response
- human handoff logic
- org admin cho conversation workflows
- reports về hội thoại và outcome

## 10B. AI OMNIVERSE PHỤ TRÁCH KHI CẦN

- khóa cửa
- mở cửa
- kiosk hardware state
- màn hình / loa / mic / thiết bị quầy
- room/device state
- printer / QR / display hardware integration
- physical environment triggers
- office / hotel room automation
- physical proof and action logs

## Kết luận:
Nếu flow chỉ là **nói chuyện và dẫn khách**, thuộc **Om AI**.
Nếu flow chạm vào **thiết bị vật lý / cửa / kiosk / room state**, thì **AI Omniverse** hỗ trợ như một integration layer.

---

# 11. MÔ HÌNH KIẾN TRÚC TỐI ƯU

## 11.1 Om AI = brain giao tiếp
## 11.2 AI Omniverse = physical action layer
## 11.3 CIOS = enterprise ops / CRM / audit / lead intelligence layer

Ba lớp này ghép với nhau như sau:

| Layer | System | Trách nhiệm |
|---|---|---|
| Customer interaction | Om AI | Dialogue, persona, flow, memory |
| Physical device or environment action | AI Omniverse | Hardware, room state, kiosk triggers |
| CRM, logs, lead flow, compliance, audit | CIOS | Enterprise intelligence, retention, audit |

Đây là mô hình đúng nhất và sạch nhất.

---

# 12. KHI NÀO NÊN TÁCH THÀNH APP THỨ 3

Chỉ nên tách khi có ít nhất 5 dấu hiệu sau:

1. Hospitality / frontdesk có khách hàng riêng đáng kể
2. Feature set khác xa Om AI core
3. Pricing riêng rõ ràng
4. Dashboard/admin riêng quá lớn
5. Team sales/growth đang bán vertical này như một sản phẩm độc lập
6. Có deployment-specific requirements cho hotel / restaurant / clinic / showroom
7. Kiosk / on-premise mode trở thành use case chính
8. Cần brand B2B mạnh hơn app học tập / AI human chung

Nếu chưa đủ các dấu hiệu này, **không nên vội tách app thứ 3**.

---

# 13. GIẢI PHÁP TỐI ƯU NHẤT CHO BẠN LỰA CHỌN

## LỰA CHỌN 1 — TỐI ƯU NHẤT HIỆN TẠI

### Build trong Om AI dưới vertical riêng
Đây là lựa chọn nên làm ngay.

### Cách làm:
- tạo module riêng
- tách IA riêng
- tách persona library riêng
- tách pricing/business plan riêng
- tách admin/business workflow riêng
- build sao cho sau này có thể spin out

**Ưu tiên: cao nhất**

---

## LỰA CHỌN 2 — TỐI ƯU CHO 12–24 THÁNG

### Hybrid rồi spin out
Đây là lựa chọn chiến lược nên khóa về mặt kiến trúc.

### Cách làm:
- build trong Om AI trước
- chuẩn hóa boundary
- khi đủ lớn, tách thành app thứ 3 bằng shared platform

**Ưu tiên: cao nhất về dài hạn**

---

## LỰA CHỌN 3 — TẠO APP THỨ 3 NGAY

Chỉ nên chọn nếu:
- bạn đã chắc vertical hospitality / frontdesk là thị trường riêng mạnh
- có khách hàng enterprise sẵn
- có team đủ lớn
- có ngân sách và thời gian nuôi thêm product line

**Ưu tiên: không nên làm ngay**

---

# 14. CHỈ ĐẠO CỤ THỂ CHO TEAM DEV

## 14.1 Ngay bây giờ phải làm gì

Team dev phải:
1. Không đưa hospitality/frontdesk vào AI Omniverse core
2. Thêm một vertical mới trong Om AI:
   - `business_frontdesk`
   - hoặc `hospitality_frontdesk`
3. Thiết kế module này theo kiểu tách được sau
4. Chuẩn bị integration points cho:
   - AI Omniverse
   - CIOS
5. Không tạo app thứ 3 ở thời điểm hiện tại

## 14.2 Cần design boundary ngay từ đầu

### Om AI side
- personas
- calls
- guest flows
- admin/business scripts
- check in / check out dialogue
- service FAQ
- handoff logic

### AI Omniverse side
- kiosk hardware
- room / cửa / device triggers
- environment state

### CIOS side
- CRM record
- customer lead capture
- compliance log
- audit
- retention
- enterprise workflow later

---

# 15. NHỮNG FILE DEV CẦN THÊM SAU FILE NÀY

1. `OM_AI_BUSINESS_FRONTDESK_VERTICAL_PLAN_2026.md`
2. `OM_AI_HOSPITALITY_AND_RESTAURANT_USE_CASES_SPEC.md`
3. `OM_AI_CHECKIN_CHECKOUT_FLOW_SPEC.md`
4. `OM_AI_RECEPTIONIST_AND_GUEST_FAQ_SPEC.md`
5. `OM_AI_BUSINESS_FRONTDESK_ADMIN_DASHBOARD_SPEC.md`
6. `OM_AI_TO_CIOS_BRIDGE_FOR_FRONTDESK_SPEC.md`
7. `OM_AI_TO_AI_OMNIVERSE_DEVICE_TRIGGER_BOUNDARY_SPEC.md`
8. `OM_AI_SPINOUT_CRITERIA_FOR_THIRD_APP_2026.md`

---

# 16. HARD RULES

1. Không đưa vertical này vào AI Omniverse core.
2. Không tạo app thứ 3 ngay bây giờ.
3. Không trộn hospitality UX với family / learning UX trong cùng flow.
4. Không để business frontdesk làm rối persona library chung.
5. Không gắn CIOS trực tiếp vào toàn bộ Om AI từ ngày đầu, chỉ nối qua integration boundary.
6. Không để physical device logic đi sâu vào Om AI core.
7. Vertical này phải được build theo kiểu có thể spin out sau.

---

# 17. KẾT LUẬN CHỐT

## Câu hỏi: nên đưa vào app nào?
### Trả lời:
**Đưa vào Om AI**

## Câu hỏi: có nên tạo app tương tự thứ 3 sau khi 2 app kia xong không?
### Trả lời:
**Có thể, nhưng chưa nên làm ngay**
Chỉ nên làm sau khi vertical này chứng minh giá trị thật.

## Giải pháp tối ưu nhất:

### Giai đoạn 1:
Om AI Business Frontdesk / Hospitality module

### Giai đoạn 2:
Nếu đủ lớn, spin out thành app thứ 3

Đây là lựa chọn tối ưu nhất về:
- sản phẩm
- kỹ thuật
- nhân sự
- tốc độ
- rủi ro
- khả năng scale

---

END OF FILE

*File này là FINAL. Mọi thay đổi phải được approve bởi Product Owner trước khi chỉnh sửa.*
