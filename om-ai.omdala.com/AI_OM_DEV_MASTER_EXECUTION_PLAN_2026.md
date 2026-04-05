# AI_OM_DEV_MASTER_EXECUTION_PLAN_2026.md

Version: 1.0  
Status: Locked master execution plan for DEV / CODEX handoff  
Parent products: AI Om Core, AI Om Live  
Master brand: OMDALA  
Related systems: CIOS, Dash, OMDALA Reality OS  
Primary surfaces: iPhone, iPad, desktop web/PWA, tablet web, future desktop wrapper  
Date: April 4, 2026

---

# 1. Muc tieu tong the

AI Om phai duoc phat trien thanh mot he dieu hanh tuong tac nguoi-AI da vai tro, chay tren dien thoai, may tinh bang va may tinh, noi nguoi dung co the:

- goi va tro chuyen voi AI Agent theo vai tro nhu giao vien, giang vien, nguoi dong hanh, chuyen gia, le tan, tu van vien, huan luyen vien, tro ly dau tu, tro ly kinh doanh, tro ly khach hang;
- hoc tap, giai tri, luyen tieng Anh va cac ngon ngu khac;
- dieu khien thiet bi hoac tac vu thong qua man hinh, micro, loa, va cac tich hop khac khi can;
- chon hoac tu tao AI Agent rieng theo muc dich;
- dung nhieu nguon AI khac nhau, bao gom API ben thu ba, nguon mo, API mien phi duoc phe duyet, va ca API rieng do khach hang tu them;
- ket noi chat voi he OMDALA va mo rong sang cac be mat doanh nghiep nhu CIOS.

CIOS hien dang public nhu mot he "AI Agent Flow" cho tim kiem khach hang tu dong, co API v1, shell web toi uu mobile va PWA, registry module, compliance center, auth/member plans, CRM list/detail, audit log, retention rules va source discovery/crawl governance. Dieu nay cho thay CIOS co the tro thanh nhanh enterprise operations rat phu hop de AI Om Business mode ket noi sau. Nguon: [CIOS public site](https://cios.iai.one/).

---

# 2. Dinh vi san pham moi

## 2.1 AI Om khong con chi la app dieu khien

AI Om phai duoc dinh vi la:

**AI Om = Personal + Family + School + Business Agent OS**

No co 2 lop lon:

### Lop A - Reality Agent
- dieu khien thuc tai vat ly;
- dieu khien thiet bi, khong gian, scene, quy trinh;
- ket noi home, office, room, screen, speaker, mic, dashboard.

### Lop B - Human Interaction Agent
- goi AI nhu goi nguoi that;
- hoc voi AI;
- luyen noi va giao tiep voi AI;
- tam su, phan tu, ho tro cam xuc nhe;
- dung AI chuyen gia cho doanh nghiep;
- cho phep tao AI human / teacher / expert / companion / receptionist / sales trainer / investment explainer.

---

# 3. 4 nhom nguoi dung bat buoc

## 3.1 Phu huynh

Phu huynh co quyen:
- chon AI Agent cho con theo muc tieu;
- bat/tat cac nhom chuc nang nhu hoc tap, tieng Anh, giai tri, tam su, phan tu;
- gioi han thoi luong, khung gio, loai persona, ngon ngu, chu de;
- xem bao cao hoc tap va tom tat hoat dong;
- chan persona khong phu hop;
- cau hinh "chi hoc", "hoc + luyen noi", hoac "hoc + giai tri an toan".

## 3.2 Hoc sinh / nguoi hoc

Hoc sinh co the:
- goi giao vien AI;
- goi ban luyen noi tieng Anh;
- hoc theo bai, theo lop, theo muc tieu;
- lam bai tap, nghe giang, hoi lai;
- luyen phat am;
- hoc tu co ban den nang cao;
- hoc voi AI tutor, lecturer, coach, language partner.

## 3.3 Phu huynh / thay co / quan tri hoc tap

Nguoi lon co quyen cau hinh:
- chon bo AI Agent theo cap hoc;
- bat bo noi dung chuan;
- giao bai;
- xem tien do;
- xem loi phat am, tu vung, diem yeu giao tiep;
- chon phong cach chinh sua: nhe nhang, truc tiep, cuoi buoi moi sua.

## 3.4 Doanh nghiep

Doanh nghiep co the chon AI Agent cho:
- dau tu;
- kinh doanh;
- sales;
- cham soc khach hang;
- le tan;
- dao tao noi bo;
- mo phong tinh huong;
- thuyet trinh;
- onboarding nhan su;
- luyen phong van;
- AI customer-facing receptionist;
- AI explainer cho san pham/dich vu.

CIOS hien da public cac lop nhu auth + member plan, CRM list/detail, compliance center, audit logs, retention rules, source discovery va governance, nen AI Om Business khong nen lam lai cac lop doanh nghiep do tu dau ma nen thiet ke de cam duoc vao CIOS nhu mot "human interaction + live agent layer" cho doanh nghiep. Nguon: [CIOS public site](https://cios.iai.one/).

---

# 4. Khung san pham theo thi truong

## 4.1 Family Mode

Danh cho gia dinh, phu huynh, tre em, hoc sinh, nguoi tu hoc.

Cac nhom Agent:
- AI Teacher
- AI English Partner
- AI Story Teller
- AI Homework Helper
- AI Gentle Listener
- AI Creative Friend
- AI Parent-Safe Entertainment Guide

## 4.2 School Mode

Danh cho hoc sinh, trung tam hoc tap, lop hoc, giao vien.

Cac nhom Agent:
- Subject Teacher
- Lecturer
- Language Tutor
- Pronunciation Coach
- Study Planner
- Quiz Master
- Exam Trainer

## 4.3 Personal Growth Mode

Danh cho nguoi lon, nguoi di lam, nguoi muon luyen giao tiep va phat trien ca nhan.

Cac nhom Agent:
- Communication Coach
- Interview Coach
- Public Speaking Coach
- Reflection Companion
- Daily English Partner
- Confidence Builder

## 4.4 Business Mode

Danh cho ca nhan kinh doanh, SME, doi sales, CSKH, doanh nghiep.

Cac nhom Agent:
- Receptionist Agent
- Customer Service Agent
- Sales Roleplay Agent
- Product Explainer Agent
- Investment Research Assistant
- Business Communication Coach
- Internal Trainer
- Executive Briefing Agent

---

# 5. Quyen lua chon va kiem soat Agent

## 5.1 Nguoi dung phai duoc quyen chon Agent

Moi tai khoan hoac workspace phai chon duoc:
- nhom Agent mac dinh;
- ngon ngu chinh;
- muc do nghiem tuc / vui ve / chuyen nghiep;
- mode hoc tap / giai tri / giao tiep / kinh doanh;
- voice-only, avatar, hoac video avatar;
- muc do tu do cua cuoc tro chuyen;
- muc do chinh loi;
- muc do ghi nho.

## 5.2 Phu huynh / quan tri phai duoc quyen khoa quyen

Can co Parent / Admin Control de:
- cho phep hoac cam tung nhom Agent;
- gioi han do tuoi va chu de;
- gioi han so phut moi ngay;
- gioi han khung gio;
- bat "safe mode only";
- xem lich su tom tat;
- chan viec tu tao persona neu khong duoc phep.

## 5.3 Doanh nghiep phai co Agent Policy

Doanh nghiep can:
- chon AI Agent theo phong ban;
- chi dinh role-based access;
- chi cho phep mot so script va use case;
- luu log;
- kiem soat brand voice;
- gan knowledge base noi bo;
- gan CRM / lead / sales workflow ve sau qua CIOS.

---

# 6. Thiet bi va nen tang bat buoc ho tro

## 6.1 Thiet bi ho tro

- iPhone
- iPad
- dien thoai Android o phase sau neu muon
- desktop web
- tablet web
- future desktop wrapper hoac native shell neu can

## 6.2 Cach tuong tac

- man hinh
- micro
- loa
- camera neu bat avatar/video call
- bluetooth headset / speaker
- tai nghe
- ban phim khi dung text
- tich hop dashboard khi can

## 6.3 Quy tac UX

Moi tinh nang cot loi phai dung duoc tren:
- dien thoai
- may tinh bang
- may tinh

Khong duoc thiet ke chi hop voi mobile ma desktop thanh trai nghiem phu.  
Khong duoc thiet ke chi hop voi desktop ma mobile kho dung.

---

# 7. Kien truc cong nghe chot

## 7.1 Native + Web Hybrid

### Native iOS
Dung cho:
- call UI tot nhat;
- route am thanh;
- realtime voice;
- avatar call chat luong cao;
- push notification;
- background call handling;
- app store distribution;
- parental controls sau hon.

Apple co cac framework phu hop cho trai nghiem goi va hanh dong ung dung nhu CallKit, Speech va App Intents; day la ly do native phai la tuyen chinh cho call experience tot nhat. Nguon: [CallKit](https://developer.apple.com/documentation/callkit), [Speech](https://developer.apple.com/documentation/speech), [App Intents](https://developer.apple.com/documentation/appintents/app-intents).

### Web / PWA
Dung cho:
- dashboard;
- quan tri;
- tao persona;
- lesson library;
- transcript review;
- memory editing;
- subscription;
- desktop/tablet access;
- organization admin.

## 7.2 Realtime AI Layer

Nen build mot **Provider Router** thay vi khoa chet 1 nha cung cap.

OpenAI hien co Realtime API ho tro ket noi qua WebRTC va khuyen nghi WebRTC cho browser/mobile client. Tai lieu deprecations hien ghi ro Realtime beta cu (`OpenAI-Beta: realtime=v1`) da bi loai bo vao **February 27, 2026**. Vi file nay dong ngay April 4, 2026, moi thiet ke moi phai build truc tiep theo giao dien GA, khong di vao beta cu. Nguon: [OpenAI Realtime guide](https://developers.openai.com/api/docs/guides/realtime/), [OpenAI deprecations](https://platform.openai.com/docs/deprecations).

## 7.3 Avatar Layer

Bat buoc adapter-based:
- Tavus
- HeyGen
- custom provider
- voice-only
- still portrait fallback

## 7.4 AI Source Layer

He phai ho tro:
- OpenAI chinh thuc;
- nhieu AI uy tin khac qua adapter;
- nguon mo duoc duyet;
- free API khi phu hop;
- customer-supplied API keys;
- admin-managed provider priority;
- per-plan provider routing.

## 7.5 Dash / Open source enrichment

`dash.iai.one` hien tai toi khong doc duoc noi dung on dinh tu public endpoint luc kiem tra, nen khong dung no nhu nguon su that o buoc nay. Tuy nhien, he kien truc van nen chua cho mot `Dash Connector Layer` de sau nay gan them nguon mo, dashboard, model registry, experiment routing, hoac resource feeds khi ha tang do on dinh hon.

---

# 8. Provider Router bat buoc phai co

## 8.1 Vi sao can Router

Nguoi dung va to chuc se co nhu cau khac nhau:
- muon dung API rieng;
- muon dung API re;
- muon dung AI nhanh;
- muon dung AI gioi hon;
- muon dung nguon mo;
- muon khong phu thuoc mot cong ty.

## 8.2 Router phai ho tro

- default provider per workspace
- provider fallback
- provider priority list
- persona-specific provider
- country-specific provider
- cost-aware routing
- low-latency routing
- premium routing
- custom API key by user / org
- admin policy for approved providers only

## 8.3 Vi du routing

- Free user -> realtime-mini / voice-only / fallback avatar
- Pro user -> realtime manh hon / premium voice / optional avatar
- School workspace -> education-safe provider stack
- Business workspace -> enterprise-safe provider stack + logs
- Customer with own API key -> use customer key first if valid
- High cost exceeded -> degrade to voice-only or cheaper provider

OpenAI hien cong bo gia realtime/audio rieng, cho phep phan tang cost ro giua model realtime manh hon va model nho re hon. Dieu nay lam chien luoc router theo plan va cost tro nen thuc te hon. Nguon: [OpenAI realtime models](https://developers.openai.com/api/docs/models/gpt-realtime), [OpenAI model catalog](https://developers.openai.com/api/docs/models), [OpenAI pricing](https://developers.openai.com/api/docs/pricing/).

---

# 9. He Persona / Teacher / Expert / Model

## 9.1 Cac lop persona phai co

### Core Personas
- English Teacher
- Language Partner
- Subject Teacher
- Lecturer
- Gentle Listener
- Communication Coach

### Family Personas
- Parent-approved Tutor
- Story Teacher
- Safe Entertainment Guide

### Business Personas
- Receptionist
- Customer Support Trainer
- Sales Coach
- Investment Explainer
- Business Mentor
- Internal Lecturer

### Expert Personas
- Deep Subject Tutor
- Specialist Coach
- Consultant-style Agent
- Future Expert Agent Packs

## 9.2 Nguoi dung co the tao persona rieng

Co 3 cap tao persona:

### Cap 1 - Simple Persona Builder
Chon:
- ten
- gioi tinh bieu dat
- giong dieu
- ngon ngu
- avatar style
- muc tieu su dung

### Cap 2 - Advanced Persona Builder
Chon them:
- lesson style
- correction style
- role boundaries
- knowledge upload
- speaking style
- strictness
- humor level
- safety mode

### Cap 3 - Expert / Organization Persona Builder
Them:
- brand voice
- internal documents
- curriculum packs
- org-safe policies
- approval workflows
- custom API/provider binding

## 9.3 Quy dinh hinh anh / nguoi mau

Cho phep:
- synthetic avatar
- licensed preset models
- custom branded avatar
- user-created stylized persona where policy allows

Khong cho phep:
- gia mao nguoi that khong co quyen;
- deepfake trai phep;
- persona vi pham quyen hinh anh hoac quyen rieng tu.

---

# 10. 3 lop gia tri nguoi dung nhan duoc

## 10.1 Gia tri truc tiep

- hoc de hon;
- noi chuyen tu nhien hon;
- luyen ngoai ngu moi ngay;
- co nguoi dong hanh;
- co nguoi huong dan;
- co nguoi mo phong tinh huong;
- co the dung moi luc tren dien thoai, tablet, desktop.

## 10.2 Gia tri ca nhan hoa

- AI nho trinh do;
- nho bai cu;
- nho loi hay mac;
- nho muc tieu;
- nho phong cach yeu thich;
- nho boi canh gia dinh hoac cong viec.

## 10.3 Gia tri tang dan theo thoi gian

- cang dung cang dung nhu cau;
- tu co ban den chuyen sau;
- tu nguoi moi den chuyen gia;
- tu 1 nguoi den gia dinh, lop hoc, doanh nghiep;
- tu chatbot sang AI human thuc thu theo vai tro.

---

# 11. Quyen loi duoc huong theo nhom khach hang

## 11.1 Free User

- 30 phut mien phi moi ngay
- 1 den 2 persona loi
- voice-first
- text chat
- lesson co ban
- recap co ban
- lich su ngan
- dung duoc tren mobile va web

## 11.2 Personal Pro

- nhieu phut hon hoac quota thang
- nhieu persona hon
- memory dai han
- lesson plan ca nhan
- luyen noi nang cao
- correction sau hon
- avatar tot hon
- export recap tot hon

## 11.3 Family Plan

- nhieu ho so trong gia dinh
- parent dashboard
- child-safe mode
- chon agent cho tung con
- gioi han thoi gian rieng
- bao cao tien do hoc tap
- tieng Anh, hoc tap, giai tri an toan cung trong 1 goi

## 11.4 School / Education Plan

- teacher/admin dashboard
- lop hoc / hoc vien
- curriculum packs
- lesson assignment
- progress reports
- da ngon ngu
- quiz / roleplay / practice mode
- branded institution mode

## 11.5 Business Plan

- receptionist persona
- customer support persona
- sales training persona
- communication coach
- org admin
- logs
- custom KB
- role-based access
- provider control
- optional integration path to CIOS

## 11.6 Enterprise / Expert Plan

- multi-site
- advanced security
- custom personas
- internal expert agents
- custom provider stack
- customer-supplied APIs
- dashboards
- org analytics
- possible CIOS/Dash connector expansion

---

# 12. Goi de xuat

## 12.1 Free
Muc tieu: tang user base, tao thoi quen hang ngay

- 30 phut/ngay
- 1-2 persona loi
- voice + text
- web + mobile
- lesson co ban
- recap co ban

## 12.2 Pro Individual
Muc tieu: nguoi hoc nghiem tuc, nguoi di lam, nguoi luyen ngoai ngu

- quota lon hon
- nhieu persona
- long-term memory
- advanced lesson path
- pronunciation coaching
- roleplay nang cao
- avatar option

## 12.3 Family
Muc tieu: cha me va con cai dung chung he

- nhieu ho so
- parent control
- child safety
- report theo tung con
- chon AI Agent rieng theo nhu cau tung nguoi

## 12.4 Education / School
Muc tieu: trung tam, truong, giao vien

- class-based setup
- progress dashboard
- lesson assignment
- curriculum packs
- org reports
- admin controls

## 12.5 Business
Muc tieu: SME, doi sales, dich vu, startup

- receptionist
- CSKH
- sales coach
- customer practice
- internal training
- custom scripts
- logs
- team quotas

## 12.6 Enterprise / Custom
Muc tieu: to chuc lon, he rieng, AI stack rieng

- custom providers
- own API keys
- org policies
- advanced integrations
- CIOS-ready path
- future Dash-ready path
- premium support

---

# 13. Cach tinh va quan ly 30 phut mien phi

## 13.1 Bat buoc tinh o server

Khong tinh o client.  
Phai co:
- daily quota
- timezone policy
- plan-based quota
- voice-only vs avatar cost class
- provider-specific cost mapping

## 13.2 Quy tac trai nghiem

- canh bao con 5 phut
- canh bao con 1 phut
- khong cat ngang vo duyen giua cau
- soft landing
- moi nang cap goi hop ly

## 13.3 Bonus logic nen co

- bonus phut qua referral
- bonus phut qua streak
- bonus phut qua school / family invite
- campaign minutes

---

# 14. Tich hop voi CIOS

## 14.1 Vi sao tich hop

CIOS da co public nen nhu:
- auth/member plan
- CRM
- compliance center
- audit log
- retention
- source discovery
- governance queue
- mobile-ready shell / PWA foundation. Nguon: [CIOS public site](https://cios.iai.one/).

## 14.2 Vai tro AI Om trong he CIOS

AI Om Business co the la:
- live receptionist layer
- live explainer layer
- customer conversation layer
- sales roleplay layer
- staff training layer
- client-facing conversational front layer

## 14.3 Nguyen tac tich hop

Khong tron codebase ngay tu dau.  
Tach:
- AI Om = conversation-first platform
- CIOS = enterprise operations / CRM / governance / lead intelligence platform

Sau do noi qua:
- auth bridge
- org/workspace sync
- CRM context injection
- plan sync
- audit/event pipeline

---

# 15. Tich hop voi Dash / nguon mo / API rieng

## 15.1 Thiet ke bat buoc

He phai co:
- Provider Registry
- API Key Vault
- User-Supplied API Layer
- Open Source Connector Layer
- Admin Approval Layer

## 15.2 Khach hang tu them API

Can ho tro:
- them API key rieng
- chon provider mac dinh
- test connection
- set fallback
- gan cho persona/workspace
- billing policy ro: dung khoa cua khach hay dung khoa cua he

## 15.3 Muc mo theo plan

- Free: khong cho custom provider
- Pro: co the cho custom limited
- Business: cho approved custom providers
- Enterprise: full provider router + BYO API

---

# 16. Lo trinh build dung

## Phase 0 - Lock kien truc
- khoa family/school/business matrix
- khoa persona schema
- khoa provider router
- khoa pricing architecture
- khoa quota system
- khoa safety matrix

## Phase 1 - MVP that
- native iOS call shell
- web/PWA dashboard
- 3 persona loi
- 30 phut free/day
- recap
- subscription
- parent-safe mode co ban
- desktop/tablet usable

## Phase 2 - Family / School
- multi-profile family
- parent controls
- school dashboard
- teacher assignment
- lesson paths
- reports

## Phase 3 - Business / CIOS bridge
- org workspace
- receptionist persona
- sales persona
- customer support persona
- org admin
- logs
- CIOS integration adapter

## Phase 4 - Open provider ecosystem
- BYO API
- provider registry
- open source routing
- enterprise controls
- advanced personas
- expert packs

---

# 17. Nhung dieu DEV bat buoc luu y

1. Khong duoc build nhu 1 chatbot biet noi don gian.
2. Khong duoc hardcode 1 provider duy nhat.
3. Khong duoc de parent control lam sau cung.
4. Khong duoc tron school mode va business mode thanh cung 1 UX.
5. Khong duoc tinh quota o client.
6. Khong duoc chi toi uu mobile ma bo desktop/tablet.
7. Khong duoc de persona chi la prompt text don gian; phai co schema.
8. Khong duoc chi lam avatar dep ma quen curriculum, recap, analytics.
9. Khong duoc de user-created persona vuot qua safety policies.
10. Khong duoc phu thuoc vao 1 API "mien phi" thieu on dinh.
11. Khong duoc coi Dash la dependency bat buoc o buoc dau, vi hien chua xac thuc duoc public runtime on dinh.
12. Khong duoc build integration voi CIOS theo cach rang buoc chat qua som; phai theo adapter.

---

# 18. Kien truc file va module lon can hoan chinh tiep

Duoi day la **bo file con lai CODEX phai lam tiep** sau master plan nay.

## 18.1 File khoa kien truc
1. `AI_OM_LIVE_API_CONTRACT_V1.md`
2. `AI_OM_PROVIDER_ROUTER_ARCHITECTURE_2026.md`
3. `AI_OM_PERSONA_SCHEMA_V1.md`
4. `AI_OM_MEMORY_MODEL_V1.md`
5. `AI_OM_USAGE_METERING_AND_FREE_30_MIN_RULES.md`
6. `AI_OM_PRICING_AND_PLAN_LOGIC_2026.md`

## 18.2 File cho Family / School
7. `AI_OM_PARENT_CONTROL_AND_CHILD_SAFE_MODE_SPEC.md`
8. `AI_OM_FAMILY_PLAN_AND_MULTI_PROFILE_SPEC.md`
9. `AI_OM_SCHOOL_MODE_AND_TEACHER_ADMIN_SPEC.md`
10. `AI_OM_CURRICULUM_AND_LESSON_ENGINE_SPEC.md`
11. `AI_OM_LANGUAGE_LEARNING_AND_PRONUNCIATION_SPEC.md`

## 18.3 File cho Business / CIOS
12. `AI_OM_BUSINESS_MODE_SPEC.md`
13. `AI_OM_RECEPTIONIST_AND_CUSTOMER_AGENT_SPEC.md`
14. `AI_OM_SALES_ROLEPLAY_AND_TRAINING_SPEC.md`
15. `AI_OM_CIOS_BRIDGE_INTEGRATION_SPEC.md`
16. `AI_OM_ORG_ADMIN_AND_ROLE_POLICY_SPEC.md`

## 18.4 File cho Avatar / Realtime
17. `AI_OM_REALTIME_CALL_RUNTIME_SPEC.md`
18. `AI_OM_IOS_CALL_UI_AND_AUDIO_ROUTING_SPEC.md`
19. `AI_OM_AVATAR_PROVIDER_ADAPTER_SPEC.md`
20. `AI_OM_VOICE_ONLY_FALLBACK_SPEC.md`

## 18.5 File cho multi-provider / open ecosystem
21. `AI_OM_CUSTOM_API_KEY_AND_BYO_PROVIDER_SPEC.md`
22. `AI_OM_OPEN_SOURCE_CONNECTOR_LAYER_SPEC.md`
23. `AI_OM_PROVIDER_APPROVAL_AND_SECURITY_POLICY.md`
24. `AI_OM_COST_ROUTING_AND_PROVIDER_PRIORITY_SPEC.md`

## 18.6 File cho analytics / billing / safety
25. `AI_OM_ANALYTICS_AND_LEARNING_REPORTS_SPEC.md`
26. `AI_OM_MODERATION_AND_SAFETY_POLICY_SPEC.md`
27. `AI_OM_SUBSCRIPTION_BILLING_AND_UPGRADE_FLOW_SPEC.md`
28. `AI_OM_PRIVACY_EXPORT_DELETE_MEMORY_SPEC.md`

## 18.7 File cho app / web / repo
29. `AI_OM_FRONTEND_INFORMATION_ARCHITECTURE.md`
30. `AI_OM_WEB_PWA_DASHBOARD_SPEC.md`
31. `AI_OM_IOS_APP_MODULE_TREE.md`
32. `AI_OM_BACKEND_SERVICE_BOUNDARIES.md`
33. `AI_OM_REPO_STRUCTURE_AND_IMPLEMENTATION_ORDER.md`

---

# 19. Thu tu CODEX nen lam

## Batch 1 - Khoa loi truoc
- API contract
- persona schema
- provider router
- usage metering
- pricing logic
- repo structure

## Batch 2 - Build product core
- realtime runtime
- iOS call UI
- web PWA dashboard
- memory model
- avatar adapter
- voice-only fallback

## Batch 3 - Build family and school
- parent control
- family profiles
- school admin
- curriculum
- language learning

## Batch 4 - Build business
- business mode
- receptionist/customer agent
- sales roleplay
- org admin
- CIOS bridge

## Batch 5 - Build ecosystem openness
- BYO API
- provider approval/security
- open source connector layer
- cost routing
- analytics/safety/final polish

---

# 20. Ket luan chot cho DEV / CODEX

AI Om phai duoc build nhu mot he lon gom 4 truc dong thoi:

### Truc 1 - Hoc tap va ngoai ngu
cho hoc sinh, sinh vien, nguoi tu hoc, phu huynh

### Truc 2 - Giao tiep va dong hanh
cho ca nhan, phat trien ban than, phan tu, ho tro cam xuc nhe

### Truc 3 - Gia dinh va nha truong
cho phu huynh, giao vien, trung tam hoc tap, lop hoc

### Truc 4 - Doanh nghiep
cho kinh doanh, dau tu, le tan, khach hang, sales, dao tao noi bo, tich hop voi CIOS

He phai:
- chay tren dien thoai, tablet, desktop;
- dung duoc bang man hinh, mic, loa;
- ho tro goi AI nhu goi nguoi that;
- ho tro nhieu provider;
- co the mo cho khach hang tu them API;
- co parent control va org control;
- di tu co ban den chuyen sau den expert AI;
- co the tao persona chuan hoac persona rieng theo chinh sach.

Day khong phai mot app don gian.  
Day la mot **AI Agent Operating Layer cho con nguoi, gia dinh, hoc tap va doanh nghiep**.

---

# 21. Ghi chu cap nhat nguon va tinh kha thi

- CIOS public site hien the hien ro `v1.1.0`, `API v1`, shell mobile/PWA, registry, compliance, auth/member plan, CRM, audit, retention va governance queue, nen huong bridge doanh nghiep la co co so thuc te. Nguon: [CIOS public site](https://cios.iai.one/).
- OpenAI Realtime API hien ho tro WebRTC va khuyen nghi WebRTC cho browser/mobile, phu hop voi live call architecture cua AI Om. Nguon: [OpenAI Realtime guide](https://developers.openai.com/api/docs/guides/realtime/).
- Theo trang OpenAI deprecations, Realtime API beta cu da bi loai bo vao ngay **February 27, 2026**. File nay da khoa theo moc ngay tuyet doi nay de tranh nham lan. Nguon: [OpenAI deprecations](https://platform.openai.com/docs/deprecations).
- OpenAI hien co bang gia realtime/audio ro rang, giup thiet ke routing theo plan va quota thuc te hon. Nguon: [OpenAI realtime model pricing](https://developers.openai.com/api/docs/models/gpt-realtime), [OpenAI pricing](https://developers.openai.com/api/docs/pricing/).
- Apple co cac lop nen phu hop nhu CallKit, Speech, App Intents va Foundation Models cho viec xay trai nghiem goi, loi noi, hanh dong ung dung va augmentation on-device. Nguon: [CallKit](https://developer.apple.com/documentation/callkit), [Speech](https://developer.apple.com/documentation/speech), [App Intents](https://developer.apple.com/documentation/appintents/app-intents), [Foundation Models](https://developer.apple.com/apple-intelligence/).
- `dash.iai.one` chua doc duoc on dinh o lan kiem tra nay, nen chua dung lam dependency cung trong spec.

Buoc hop ly nhat tiep theo la viet tron **Batch 1** gom 6 file khoa loi dau tien de CODEX bat dau build khong lech.
