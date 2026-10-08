# REPO_SPLIT_DECISION_AND_FOLDER_STRUCTURE_2026.md

**Version**: 1.0
**Status**: REPOSITORY AND FOLDER STRUCTURE LOCK
**Scope**: Định nghĩa cấu trúc thư mục và ownership sau khi tách thành 2 dự án
**Date**: April 4, 2026

---

# 1. MỤC TIÊU

File này chốt cách team dev phải hiểu cấu trúc trên máy:

- `OMDALA` là hệ sinh thái mẹ
- `Om AI` là một dự án riêng
- `AI Omniverse` là một dự án riêng
- shared platform vẫn nằm trong `omdala.com`

Không tiếp tục làm theo tư duy một app, một dashboard, một roadmap chung.

---

# 2. CẤU TRÚC THƯ MỤC CHUẨN TRÊN MÁY

```text
New project/
  omdala.com/
    apps/
    packages/
    services/
    docs/
    scripts/
    infra/
    om-ai.omdala.com/
    omniverse.omdala.com/
```

Ý nghĩa:

- `apps/`, `packages/`, `services/`, `docs/`, `scripts/`, `infra/`:
  shared ecosystem layer của OMDALA
- `om-ai.omdala.com/`:
  product workspace riêng cho Om AI
- `omniverse.omdala.com/`:
  product workspace riêng cho AI Omniverse

---

# 3. QUYẾT ĐỊNH REPO

## 3.1 Giai đoạn hiện tại

Hiện tại giữ một super-root trên máy là `omdala.com`, bên trong có:

- shared platform core
- Om AI project
- AI Omniverse project

Lý do:

- dễ gom tài liệu và quyết định hệ thống vào một nơi
- chưa phải tách hẳn Git remote ngay
- thuận tiện cho product, architecture, dev handoff
- dễ theo dõi shared-core boundary trong giai đoạn đầu

## 3.2 Giai đoạn tiếp theo

Khi từng app bắt đầu có release cycle độc lập rõ ràng, có thể:

- tách `om-ai.omdala.com/` thành repo riêng
- tách `omniverse.omdala.com/` thành repo riêng
- giữ `omdala.com` làm ecosystem + shared platform repo

Hiện tại, folder split là bắt buộc, còn repo split có thể staged.

---

# 4. TRÁCH NHIỆM CỦA TỪNG FOLDER

## 4.1 `omdala.com/apps`

Chỉ dành cho shared ecosystem surfaces hoặc cổng mẹ:

- masterbrand web
- shared docs/admin tối thiểu
- auth/account entry points
- API gateway shell nếu cần

Không nhét product-specific flow phức tạp của Om AI hay Omniverse vào đây.

## 4.2 `om-ai.omdala.com`

Chịu trách nhiệm cho toàn bộ Om AI:

- product docs
- mobile/web/backend plan riêng
- live call
- persona
- learning
- family/school/business modes
- memory
- subscription logic ở tầng product

## 4.3 `omniverse.omdala.com`

Chịu trách nhiệm cho toàn bộ AI Omniverse:

- product docs
- mobile/web/backend plan riêng
- rooms
- devices
- scenes
- gateways
- automation
- physical proof

---

# 5. CẤU TRÚC CHUẨN CHO `om-ai.omdala.com`

```text
om-ai.omdala.com/
  app/
  web/
  backend/
  ios/
  android/
  gateway/
  shared/
  scripts/
  .github/
```

Lưu ý:

- workspace này đã tồn tại nội dung thật
- nhiều file lịch sử vẫn đang dùng prefix `AI_OM_*`
- tên sản phẩm canonical từ bây giờ là `Om AI`

Team dev được phép giữ tên file cũ tạm thời nếu đang có giá trị tham chiếu, nhưng mọi file mới phải dùng `OM_AI_*` hoặc `Om AI` trong nội dung.

---

# 6. CẤU TRÚC CHUẨN CHO `omniverse.omdala.com`

```text
omniverse.omdala.com/
  app/
  web/
  backend/
  ios/
  android/
  shared/
  docs/
  scripts/
  .github/
  .wrangler/
```

Đây là workspace riêng cho app vạn vật.

Không đưa lesson, teacher, family learning, sales roleplay vào folder này.

---

# 7. SHARED CORE ĐƯỢC PHÉP ĐẶT Ở ROOT

Chỉ các lớp sau được đặt ở root `omdala.com` để cả 2 app dùng:

- auth
- account
- workspace core
- billing core
- provider registry
- analytics base
- notifications core
- security baseline
- design tokens mức nền
- ecosystem docs và decision records

Mọi domain logic còn lại phải đi vào đúng product folder.

---

# 8. NHỮNG THỨ KHÔNG ĐƯỢC LÀM

1. Không đặt `Om AI` product roadmap vào `omniverse.omdala.com`
2. Không đặt `AI Omniverse` device graph vào `om-ai.omdala.com`
3. Không tiếp tục tạo thêm thư mục lẫn lộn kiểu `ai.omdala.com`
4. Không giữ một dashboard chung rồi nhét cả 2 domain vào
5. Không để docs shared và docs product chồng nhau không có ownership

---

# 9. TÌNH TRẠNG HIỆN TẠI TRÊN MÁY

Đã đúng:

- `om-ai.omdala.com/` đã được gom vào trong `omdala.com/`
- `omniverse.omdala.com/` đã được tạo như workspace riêng

Còn phải làm tiếp:

- viết batch docs riêng cho Om AI
- viết batch docs riêng cho AI Omniverse
- chuẩn hóa lại các file index/completion từng dùng tên cũ `AI Om`
- dọn các thư mục backup/tạm không thuộc source of truth ra khỏi luồng dev chính

---

# 10. CHỈ ĐẠO CHO TEAM DEV

Từ thời điểm này:

- đọc `OM_AI_AND_AI_OMNIVERSE_SPLIT_MASTER_DEV_ADJUSTMENT_2026.md` trước
- đọc file boundary shared core
- đọc file team responsibility
- dùng file này để hiểu folder nào thuộc app nào

Không được bắt đầu code thêm nếu chưa rõ:

- feature đó thuộc Om AI hay Omniverse
- shared hay domain-specific
- folder nào là nơi đúng để đặt tài liệu và code

---

# END OF FILE
