# PROJECT_ORGANIZATION_SUMMARY_2026.md

**Version**: 2.0  
**Status**: CANONICAL PROJECT ORGANIZATION SUMMARY  
**Date**: April 8, 2026  
**Audience**: Founder, CTO, Team A, Team B, Team Platform

---

# 1. TÓM TẮT TỔ CHỨC DỰ ÁN

Từ thời điểm này, hệ được hiểu là **3 lớp tách biệt nhưng cùng hệ sinh thái**:

1. **OMDALA Platform**  
   Root platform tại `omdala.com/`  
   Chứa shared surfaces, shared packages, shared services, docs, infra.

2. **Om AI**  
   Workspace riêng tại `om-ai.omdala.com/`  
   Là sản phẩm AI human call / learning / communication / business interaction.

3. **Omniverse**  
   Workspace riêng tại `omniverse.omdala.com/`  
   Là sản phẩm device / rooms / scenes / gateway / physical orchestration.

**Hard rule**: không được gộp lại thành một app, một dashboard, hoặc một roadmap chung.

---

# 2. CẤU TRÚC THƯ MỤC ĐÚNG TRÊN MÁY

```text
omdala.com/
├── apps/                       # root platform surfaces
│   ├── web/
│   ├── app/
│   ├── auth/
│   ├── admin/
│   └── docs/
├── services/                   # root platform services
│   ├── api/
│   ├── auth/
│   ├── ai/
│   ├── matching/
│   ├── notifications/
│   └── trust/
├── packages/                   # shared packages
│   ├── core/
│   ├── seo/
│   ├── types/
│   └── ui/
├── docs/                       # shared planning + architecture docs
├── infra/                      # DB schema + migrations
├── scripts/                    # deploy + ops scripts
├── om-ai.omdala.com/           # product workspace — Om AI
└── omniverse.omdala.com/       # product workspace — Omniverse
```

---

# 3. NHỮNG GÌ KHÔNG CÒN ĐÚNG NỮA

Các đường dẫn sau **không còn là source of truth**:

- `/ai-om/`
- `/ai-omniverse/`
- mô hình `/shared-core/` như một thư mục top-level độc lập

Nếu tài liệu cũ còn nhắc các path trên, hãy map lại như sau:

- `/ai-om/*` -> `/om-ai.omdala.com/*`
- `/ai-omniverse/*` -> `/omniverse.omdala.com/*`
- `/shared-core/*` -> shared layers đang nằm ở root `apps/`, `services/`, `packages/`

---

# 4. VAI TRÒ CỦA TỪNG LỚP

## 4.1 OMDALA Platform

Thuộc root `omdala.com/`.

Chứa:

- public web `apps/web`
- app shell `apps/app`
- auth surface `apps/auth`
- admin surface `apps/admin`
- docs surface `apps/docs`
- API worker `services/api`
- shared packages `packages/*`
- shared execution docs trong `docs/`

Không nên nhét toàn bộ product logic của Om AI hoặc Omniverse vào đây.

## 4.2 Om AI

Thuộc `om-ai.omdala.com/`.

Chứa:

- Om AI web
- Om AI backend
- Om AI gateway/runtime liên quan
- Om AI iOS / Android
- Om AI specs, release docs, verification scripts

Đây là nơi dành cho:

- live call
- persona
- learning
- memory
- recap
- family / school / business interaction

## 4.3 Omniverse

Thuộc `omniverse.omdala.com/`.

Chứa:

- Omniverse web
- Omniverse backend
- Omniverse iOS / Android
- Omniverse docs và phase plans

Đây là nơi dành cho:

- homes
- rooms
- devices
- scenes
- automation
- gateway
- proof / physical logs

---

# 5. TRẠNG THÁI THỰC TẾ HIỆN TẠI

## 5.1 Root platform

Đã có code thật và đang hoạt động:

- `apps/web`
- `apps/app`
- `apps/auth`
- `apps/admin`
- `apps/docs`
- `services/api`
- `packages/*`
- `.github/workflows/*`

## 5.2 Om AI

Đã có workspace lớn, có code và tài liệu dày.

Đây là workspace trưởng thành nhất trong 2 product workspaces.

## 5.3 Omniverse

Đã có workspace riêng, backend package, docs phase O1-O4, delivery plan, execution report.

Mức trưởng thành còn thấp hơn Om AI và vẫn cần nhiều implementation để lên MVP runtime thật.

---

# 6. TEAM ASSIGNMENTS

## Team A — Omniverse

Chịu trách nhiệm:

- `omniverse.omdala.com/`
- devices / rooms / scenes / automation / gateway
- Omniverse web + backend + mobile

## Team B — Om AI

Chịu trách nhiệm:

- `om-ai.omdala.com/`
- live calls / personas / learning / memory / recap
- Om AI web + backend + mobile

## Team Platform

Chịu trách nhiệm:

- root `apps/`, `services/`, `packages/`
- auth/session
- API platform
- billing / notifications / analytics / workspace
- CI/CD / deploy / infra baseline

---

# 7. READ ORDER CHO TEAM

## Nếu là founder / CTO / PM

1. `docs/PROJECT_CONTEXT_ENGINE.md`
2. `docs/MASTER_DEV_COMPLETION_PLAN_2026-04-08.md`
3. `docs/OM_AI_AND_AI_OMNIVERSE_SPLIT_MASTER_DEV_ADJUSTMENT_2026.md`
4. `docs/OMDALA_SHARED_PLATFORM_CORE_BOUNDARY_2026.md`

## Nếu là Team A

1. `docs/PROJECT_CONTEXT_ENGINE.md`
2. `docs/AI_OMNIVERSE_MASTER_DEV_PLAN_2026.md`
3. `docs/AI_OMNIVERSE_WEB_ADMIN_PLAN_2026.md`
4. `omniverse.omdala.com/docs/AI_OMNIVERSE_DELIVERY_PLAN_2026.md`

## Nếu là Team B

1. `docs/PROJECT_CONTEXT_ENGINE.md`
2. `docs/OM_AI_MASTER_DEV_PLAN_2026.md`
3. `docs/OM_AI_WEB_ADMIN_PLAN_2026.md`
4. `om-ai.omdala.com/README.md`

## Nếu là Team Platform

1. `docs/PROJECT_CONTEXT_ENGINE.md`
2. `docs/OMDALA_SHARED_PLATFORM_CORE_BOUNDARY_2026.md`
3. `docs/MASTER_DEV_COMPLETION_PLAN_2026-04-08.md`
4. `README.md`

---

# 8. HARD RULES

1. Không gọi `Om AI` là `OmCode`.
2. Không dùng `Om AI` như tên chung cho mọi nhánh AI trong hệ.
3. Không đưa teacher / lesson / persona vào Omniverse.
4. Không đưa room / device / scene / automation phức tạp vào Om AI.
5. Không dùng docs cũ có path `/ai-om/` hoặc `/ai-omniverse/` như nguồn sự thật mới.

---

# 9. KẾT LUẬN

Hiện tại tổ chức đúng của dự án là:

- root `omdala.com/` = ecosystem platform + shared foundation
- `om-ai.omdala.com/` = Om AI product workspace
- `omniverse.omdala.com/` = Omniverse product workspace

Mọi kế hoạch dev tiếp theo phải bám theo mô hình này.

---

# END OF FILE
