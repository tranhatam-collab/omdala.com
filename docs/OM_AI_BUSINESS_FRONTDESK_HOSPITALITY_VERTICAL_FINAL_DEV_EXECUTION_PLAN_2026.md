# OM_AI_BUSINESS_FRONTDESK_HOSPITALITY_VERTICAL_FINAL_DEV_EXECUTION_PLAN_2026.md

Version: 1.0
Status: FINAL DEV EXECUTION PLAN
Product: Om AI
Vertical: Business Frontdesk / Hospitality
Timeline: Q2 – Q4/2026
Duration: 26 weeks / 6 months
Execution mode: Conversation-first, modular, spin-out ready
Owner: Product / Architecture / Dev Handoff

---

# 1. MỤC TIÊU CHÍNH

Build vertical **business_frontdesk** bên trong **Om AI** theo cách:

- tách biệt hoàn toàn với family / education / personal flows
- sẵn sàng spin-out thành app thứ 3 khi đủ traction
- kết nối đúng boundary với AI Omniverse và CIOS
- đạt hiệu quả pilot thực tế thay vì chỉ demo đẹp

## KPI thành công giai đoạn 1

- Conversation self-resolution rate ≥ 75%
- Guest satisfaction (CSAT) > 85%
- Average handle time giảm ≥ 40%
- Human handoff rate ≤ 22%
- Pilot readiness đạt trước cuối Q3/2026
- Spin-out decision readiness trước cuối Q4/2026

---

# 2. TRIẾT LÝ THIẾT KẾ

## 2.1 Modular and spin-out ready

Toàn bộ code của vertical này phải sống trong namespace riêng:

- `business_frontdesk/`
- hoặc `hospitality/`

Không được rải logic cốt lõi của vertical này vào core chung một cách tùy tiện.

Mọi phần mở rộng phải thiết kế theo hướng:
- extract được trong 4–6 tuần
- không phải rewrite lõi
- không phá Om AI core

## 2.2 Boundary rõ ràng, không vi phạm

### Om AI phụ trách
- dialogue
- persona
- flow engine
- memory
- human handoff
- multilingual interaction
- hospitality logic
- business conversation reporting

### AI Omniverse phụ trách
- physical triggers
- kiosk hardware state
- room/device state
- lock/door/display/loa/mic integration
- physical action proof

### CIOS phụ trách
- lead
- CRM
- audit
- log
- compliance
- retention
- enterprise workflow bridge

Mọi giao tiếp giữa 3 hệ chỉ đi qua API contracts sạch, không gọi chéo bừa bãi.

## 2.3 UX isolation

Business Frontdesk / Hospitality không được hiện ra trong:
- Om AI personal mode
- Om AI family mode
- Om AI education mode

Toàn bộ navigation, persona browsing, onboarding, admin, analytics của vertical này phải được tách riêng.

## 2.4 Zero contamination

Không reuse bừa:
- education personas
- family-safe tones
- casual learning flows
- prompt styles của teacher / language partner

Vertical này phải có persona library, policy và tone riêng.

## 2.5 Conversation-first, not hardware-first

Giai đoạn 1 ưu tiên:
- guest interaction
- workflow
- FAQ
- check-in / check-out
- booking guidance
- upsell
- handoff

Không để hardware/kiosk/device complexity làm chậm MVP lõi.

---

# 3. PHẠM VI GIAI ĐOẠN 1

## 3.1 In scope

- restaurant host AI
- hotel frontdesk AI
- check-in assistant
- check-out assistant
- guest FAQ assistant
- multilingual customer interaction
- business receptionist
- service recommendation
- human handoff
- kiosk mode cơ bản
- Omniverse trigger integration boundary
- CIOS bridge boundary
- admin dashboard cho vertical
- pilot deployment cho 8–10 khách hàng thực

## 3.2 Out of scope cho giai đoạn 1

- full spin-out thành app thứ 3
- full enterprise customization at scale
- deep device orchestration
- full PMS/ERP replacement
- full omnichannel call center suite
- custom branded deployments quá sâu cho từng khách hàng
- advanced analytics beyond pilot-critical needs

---

# 4. CẤU TRÚC CODE VÀ KIẾN TRÚC BẮT BUỘC

```text
OmAI/
├── core/                            ← Shared platform, không sửa tùy tiện
├── shared/                          ← Chỉ import nếu cần
├── feature_flags/
│   └── business_frontdesk_enabled
├── business_frontdesk/              ← Vertical mới, 100% code chính nằm đây
│   ├── personas/
│   ├── flows/
│   │   ├── checkin/
│   │   ├── checkout/
│   │   ├── restaurant_host/
│   │   ├── guest_faq/
│   │   ├── receptionist/
│   │   └── upsell/
│   ├── knowledge_base/
│   ├── memory/
│   ├── policies/
│   ├── analytics/
│   ├── integrations/
│   │   ├── omniverse_trigger/
│   │   └── cios_bridge/
│   ├── admin_dashboard/
│   ├── kiosk_mode/
│   ├── reports/
│   └── tests/
└── docs/
    └── business_frontdesk/
```

## Hard rules về cấu trúc

1. Vertical này không được nhúng sâu vào `core/`.
2. Shared layer chỉ được import, không sửa tùy tiện để "tiện".
3. Mọi integration phải có adapter riêng.
4. Mọi flow lớn phải có module riêng.
5. Mọi phần có khả năng spin-out phải nằm trong namespace rõ ràng.

---

# 5. CẤU TRÚC CHỨC NĂNG CỐT LÕI

## 5.1 Persona layer

Giai đoạn 1 phải có ít nhất 6 persona cốt lõi:
- Restaurant Host
- Hotel Frontdesk
- Check-in Assistant
- Check-out Assistant
- Guest Support Agent
- Business Receptionist

Có thể thêm:
- FAQ Receptionist
- Service Recommendation Agent
- Multilingual Concierge

## 5.2 Flow layer

Flow lõi bắt buộc:
- Check-in
- Check-out
- Restaurant Host
- Guest FAQ
- Reception / Visitor Routing
- Upsell / Service Recommendation
- Human Handoff

## 5.3 Knowledge layer

Phải hỗ trợ:
- upload knowledge base
- structured FAQ
- service information
- operating hours
- policy answers
- room / booking / table guidance
- multilingual content

## 5.4 Integration layer

Phải sẵn sàng bridge với:
- AI Omniverse trigger layer
- CIOS CRM / audit / retention bridge

## 5.5 Admin layer

Phải có dashboard riêng cho vertical để:
- quản lý personas
- quản lý flows
- quản lý knowledge base
- xem metrics
- xem handoff
- xem conversation outcomes
- quản lý pilot deployments

## 5.6 Kiosk mode

Giai đoạn 1 chỉ cần:
- screen + voice
- quick buttons
- easy language selection
- visible fallback to human help
- stable realtime interaction

---

# 6. ROADMAP 26 TUẦN

Sprint length: 2 tuần
Total: 13 sprints / 26 tuần

---

# 7. PHASE 0 — KICK-OFF & SETUP

## Timeline

Tuần 1–2
4/4/2026 – 18/4/2026

## Mục tiêu

Khóa boundary, skeleton, ownership, feature flag, monitoring và ADR ngay từ đầu.

## Tasks chính

- tạo repository branch: `feature/business-frontdesk-vertical`
- khóa Boundary Spec giữa Om AI / AI Omniverse / CIOS
- tạo vertical folder structure hoàn chỉnh
- tạo Persona Library v1 với 6 personas lõi
- setup Feature Flag system
- setup conversation tracing / monitoring
- setup ADR process
- setup documentation structure cho flow / prompt / policy

## Deliverables

- Architecture Decision Record (ADR) set
- code skeleton hoàn chỉnh
- boundary contracts draft v1
- feature flag ready
- monitoring base ready

## Acceptance criteria

- team review xong boundary
- không còn tranh cãi về ownership giữa 3 hệ
- namespace vertical được approve
- feature flag hoạt động
- docs skeleton sẵn sàng cho sprint tiếp theo

---

# 8. PHASE 1 — FOUNDATION & CORE ENGINE

## Timeline

Tuần 3–8
21/4/2026 – 30/5/2026

---

## Sprint 2 — Tuần 3–4

### Tasks chính

- build `business_frontdesk` module base
- build Persona Engine riêng cho vertical
- setup business tone, policy, safety constraints
- tạo 6 personas cốt lõi với prompt templates chuẩn

### Owner

- Backend
- Dialogue / AI Engineer

### Deliverables

- 6 personas ready
- persona config + policy binding
- persona test dataset

### Acceptance criteria

- 50 dialogue mẫu pass 100% theo expected intent class
- không lẫn tone education / family
- persona retrieval/filtering hoạt động đúng theo vertical

---

## Sprint 3 — Tuần 5–6

### Tasks chính

- build Core Flow Engine
- hoàn thiện flows:
  - Check-in
  - Check-out
  - Restaurant Host

### Owner

- Dialogue / AI Engineer
- Backend

### Deliverables

- 3 flows hoàn chỉnh
- flow-state handling
- failure and fallback design

### Acceptance criteria

- intent recognition ≥ 95% trên tập kiểm thử nội bộ
- flow transitions không gãy
- escalation / handoff state rõ ràng

---

## Sprint 4 — Tuần 7–8

### Tasks chính

- multilingual support:
  - VI
  - EN
  - ZH
  - KO
  - JP
- build Knowledge Base Manager
- policy enforcement cho multilingual content

### Owner

- Fullstack
- Dialogue / AI Engineer

### Deliverables

- multilingual layer hoạt động
- admin upload KB
- KB lookup and response grounding

### Acceptance criteria

- 100% policy enforcement trên câu trả lời từ KB
- ngôn ngữ chuyển đúng theo lựa chọn user
- fallback sang human nếu KB không chắc chắn

---

# 9. PHASE 2 — FULL FEATURES & INTEGRATION

## Timeline

Tuần 9–14
1/6/2026 – 11/7/2026

---

## Sprint 5 — Tuần 9–10

### Tasks chính

- build Upsell Engine
- build Human Handoff logic
- cấu hình escalation levels
- add service recommendation logic

### Owner

- Backend
- Dialogue / AI Engineer

### Deliverables

- upsell suggestions
- handoff engine
- staff handoff states

### Acceptance criteria

- handoff ratio trong môi trường test < 20% với test set mục tiêu
- upsell không phá UX
- escalation không làm vòng lặp hội thoại

---

## Sprint 6 — Tuần 11–12

### Tasks chính

- build Kiosk Mode
  - screen UI + voice + quick buttons
  - language switch UI
  - human help request UI
  - timeout / idle logic

### Owner

- Frontend / Kiosk
- Fullstack

### Deliverables

- kiosk prototype realtime
- kiosk UI flows
- kiosk fallback states

### Acceptance criteria

- kiosk prototype chạy ổn realtime
- user có thể bắt đầu flow không cần huấn luyện
- quick actions dễ hiểu và không gây rối

---

## Sprint 7 — Tuần 13–14

### Tasks chính

- Integration Layer:
  - Omniverse Trigger
  - CIOS Bridge API v1
  - contract tests
  - event schema locking

### Owner

- Integration
- Backend

### Deliverables

- Omniverse trigger adapter
- CIOS bridge adapter
- integration contracts stable

### Acceptance criteria

- 100% contract test pass
- không leak domain logic giữa các hệ
- retry/failure handling rõ ràng

---

# 10. PHASE 3 — INTERNAL TESTING & POLISH

## Timeline

Tuần 15–18
13/7/2026 – 8/8/2026

## Tasks chính

- automation test suite
- regression tests cho tất cả flows
- load test 500 concurrent conversations
- security audit
- moderation audit
- tracing + reporting polish
- admin dashboard refinement
- kiosk mode stability check
- multilingual quality review

## Deliverables

- Internal Beta version
- Test Report
- Security + Moderation Report
- Pilot Readiness Checklist

## Acceptance criteria

- automation coverage ≥ 85%
- 500 concurrent conversations load test pass với degradation chấp nhận được
- error rate trong môi trường nội bộ < 0.5%
- moderation pass cho các scenario hospitality/business phổ biến
- dashboard đủ dùng cho pilot ops team

---

# 11. PHASE 4 — PILOT & ITERATION

## Timeline

Tuần 19–26
10/8/2026 – 31/10/2026

## Mục tiêu

Deploy thực chiến và đo giá trị thật, không chỉ đo demo.

## Pilot target

- 8–10 khách hàng thực
- TP.HCM + Đà Nẵng
- ưu tiên nơi sẵn sàng công nghệ
- ưu tiên pilot 2 tháng miễn phí có theo dõi sát

---

## Sprint 10–11 — Tuần 19–22

### Tasks chính

- soft launch
- deploy pilot
- monitoring 24/7
- daily triage
- training tài liệu cho site staff
- collect real conversations
- tune handoff and FAQ coverage

### Deliverables

- live pilot environments
- daily incident review
- adoption dashboard

### Acceptance criteria

- pilot sites hoạt động ổn định
- site staff dùng được
- escalation/handoff có quy trình rõ

---

## Sprint 12–13 — Tuần 23–26

### Tasks chính

- iterate từ real data
- fix top conversation failures
- optimize handoff
- optimize KB coverage
- optimize kiosk interaction
- chuẩn bị Go / No-Go spin-out package
- tổng hợp pilot report cuối kỳ

### Deliverables

- Pilot Final Report
- Spin-out Readiness Review
- KPI Decision Pack

### Acceptance criteria

- Conversation completion rate ≥ 75%
- Guest satisfaction ≥ 85%
- Average handle time giảm ≥ 40%
- Handoff rate ≤ 22%

---

# 12. RESOURCE & TEAM STRUCTURE TỐI ƯU

## Team chuẩn

| Role | Số lượng | Trách nhiệm |
|---|---|---|
| Product Owner | x1 | Hospitality / service domain expert |
| Tech Lead | x1 | Kiến trúc spin-out + boundary discipline |
| Backend | x2 | Persona + flow + integration + analytics |
| Dialogue / AI Engineer | x2 | Prompting, memory, multilingual, QA on interaction logic |
| Frontend / Kiosk | x1 | Admin + kiosk UI |
| QA / Automation | x1 | Coverage + regression + load coordination |
| DevOps | x0.5 | Monitoring + CI/CD + feature flags |

**Tổng: 7.5 – 8 người**

Có thể scale xuống 6 người nếu:
- shared platform mạnh
- reuse tốt monitoring/auth/admin foundation
- scope pilot được giữ chặt

---

# 13. QUY TRÌNH DEV BẮT BUỘC

## 13.1 Git flow

Dùng:
- `feature/`
- `hotfix/`
- `release/`

Mọi PR phải có:
- 2 approvals
- linked ADR nếu thay đổi kiến trúc
- test evidence nếu thay boundary hoặc flow

## 13.2 CI/CD

Bắt buộc có:
- unit tests
- contract tests
- boundary tests
- security scan
- policy regression checks

## 13.3 Monitoring

Phải có:
- conversation tracing
- flow outcome logging
- error dashboard
- handoff dashboard
- KB miss dashboard
- language distribution dashboard

## 13.4 Documentation

Mọi flow phải có:
- Mermaid diagram
- prompt template
- escalation map
- fallback rules
- owner rõ ràng

---

# 14. MILESTONES & GO / NO-GO

| Milestone | Date | Criteria |
|---|---|---|
| End Q2 — Foundation hoàn tất | 30/6/2026 | → Go cho Phase 2 |
| End Q3 — Full features + Internal Beta | 31/8/2026 | → Go cho Pilot |
| End Q4 checkpoint — Pilot kết thúc | 31/10/2026 | → Go / No-Go spin-out decision |

---

# 15. RỦI RO & MITIGATION

| Rủi ro | Mức độ | Mitigation |
|---|---|---|
| UX contamination | Cao | Feature flag + namespace cứng + IA riêng |
| Boundary leak | Trung bình | Contract test hàng tuần + ADR review |
| Pilot adoption chậm | Trung bình | Chọn khách hàng sẵn sàng công nghệ + pilot free 2 tháng |
| Spin-out khó | Thấp | Thiết kế spin-out boundary từ tuần 1 |
| Multilingual quality kém | Trung bình | Bộ test riêng theo ngôn ngữ + KB policy |
| Handoff quá cao | Trung bình | Tối ưu flow, KB, and escalation tuning |
| Kiosk UX khó dùng | Trung bình | Quick buttons + language-first UI + human fallback |
| Team scope creep | Cao | Product Owner chặn mọi yêu cầu ngoài vertical |

---

# 16. DEV HARD RULES

1. Vertical này phải conversation-first.
2. Mọi code mới phải nằm trong `business_frontdesk/` hoặc `hospitality/`.
3. Không sửa core chung chỉ vì tiện.
4. Không để feature này lộ vào family / education / personal UX.
5. Không reuse tone của teacher/persona học tập.
6. Mọi integration với AI Omniverse và CIOS phải qua adapter và contract test.
7. Kiosk mode là một surface của vertical, không phải một app riêng ở giai đoạn 1.
8. Pilot metrics là source of truth cho Go / No-Go, không phải cảm giác.
9. Từ ngày đầu phải build theo hướng spin-out ready.
10. Không nhận thêm scope "hay" nhưng không phục vụ KPI pilot.

---

# 17. GO / NO-GO SPIN-OUT CRITERIA

Spin-out thành app thứ 3 chỉ nên được đề xuất nếu đạt ít nhất 5 điều kiện:

1. Pilot có traction thật
2. Hospitality/frontdesk có pipeline khách hàng riêng
3. Pricing riêng có thể đứng vững
4. Dashboard/admin của vertical đủ lớn và khác Om AI core
5. Deployment requirements khác rõ rệt
6. Team sales/growth đang bán nó như product riêng
7. Kiosk/on-premise becomes major channel
8. Conversation workflows khác hẳn learning/business conversation chung

---

# 18. KẾT LUẬN CHỐT CHO DEV TEAM

Đây là kế hoạch giai đoạn 1 tối ưu nhất hiện tại vì:
- nhanh
- sạch
- đo được
- ít rủi ro hơn
- spin-out ready
- đủ chặt để pilot thật
- không làm bẩn Om AI core
- không kéo AI Omniverse đi sai hướng

## Chỉ đạo bắt đầu ngay

Bắt đầu từ tuần 1 với:
- Kick-off
- Boundary Spec
- ADR set
- namespace vertical
- feature flags
- persona v1
- monitoring base

Team dev chỉ cần bám đúng:
- boundary
- namespace
- sprint goals
- acceptance criteria
- KPI pilot

là có thể tạo ra vertical `business_frontdesk` chất lượng cao, sẵn sàng scale hoặc spin-out khi đủ điều kiện.

---

END OF FILE

*File này là FINAL. Mọi thay đổi phải được approve bởi Product Owner trước khi chỉnh sửa.*
