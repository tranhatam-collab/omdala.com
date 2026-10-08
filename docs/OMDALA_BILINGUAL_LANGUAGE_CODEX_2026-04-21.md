# OMDALA Bilingual Language Codex

Status: Active for `omdala.com`

## Source of truth

- Vietnamese source content: `/Users/tranhatam/Documents/Devnewproject/omdala.com/content/vi.json`
- English international layer: `/Users/tranhatam/Documents/Devnewproject/omdala.com/content/en.json`
- Shared web helper: `/Users/tranhatam/Documents/Devnewproject/omdala.com/apps/web/app/lib/bilingual-source.ts`

## Locked positioning

- Vietnamese source sentence:
  `OMDALA là nền tảng độc lập cho điều phối đời thực, niềm tin và thực thi có kiểm chứng.`
- English source sentence:
  `OMDALA is an independent platform for real-world coordination, trust, and verified execution.`

## Locked terminology

- `real-world coordination` -> `điều phối đời thực`
- `trust architecture` -> `kiến trúc niềm tin`
- `verified execution` -> `thực thi có kiểm chứng`
- `experts` -> `chuyên gia`
- `hosts` -> `đơn vị đón tiếp`
- `contact channel` -> `kênh liên hệ`
- `communities` -> `cộng đồng`
- `vision` -> `tầm nhìn`
- `contact` -> `liên hệ`

## Terms blocked from new public copy

- `host` trong câu tiếng Việt
- `điểm đón`
- `marketplace` trong câu tiếng Việt public
- `bề mặt liên hệ`
- `bề mặt hệ thống`
- pha trộn `English + tiếng Việt` trong cùng CTA hoặc label
- câu quảng cáo kiểu hype, quá mức hứa hẹn

## Tone rules

- Tiếng Việt: rõ, ngắn, có dấu đầy đủ, đúng nghĩa, không khẩu hiệu rỗng
- Tiếng Anh: US/international English, tự nhiên, không dịch sát chữ, không salesy
- Cả hai bản phải tương đương nghĩa và cùng một định vị sản phẩm

## CTA registry

- `Enter App` -> `Vào ứng dụng`
- `Docs` -> `Tài liệu`
- `Contact` -> `Liên hệ`
- `Return to OMDALA` -> `Quay về OMDALA`

## Navigation registry

- `What OMDALA Is` -> `OMDALA là gì`
- `How It Works` -> `Cách OMDALA vận hành`
- `Experts` -> `Chuyên gia`
- `Hosts` -> `Đơn vị đón tiếp`
- `Communities` -> `Cộng đồng`
- `Trust` -> `Niềm tin`
- `Vision` -> `Tầm nhìn`

## SEO rules locked for current rebuild

- Mỗi page phải có `seoTitle`, `seoDescription`, `breadcrumbLabel` riêng theo ngôn ngữ
- Không dùng lại description cũ nếu tiếng Việt còn lệch thuật ngữ
- Alt text logo dùng theo ngôn ngữ:
  - `OMDALA logo`
  - `Biểu trưng OMDALA`
- Breadcrumb tiếng Việt không dùng tiếng Anh chen vào trừ tên thương hiệu `OMDALA`

## Immediate implementation rule

Mọi lớp public text mới của `apps/web` phải đọc từ content source trước. Các phần body copy cũ còn nằm trong `apps/web/app/lib/content.ts` chỉ được giữ tạm thời cho đến khi hoàn tất migration page-by-page theo audit.
