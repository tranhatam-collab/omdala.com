# UNIVERSAL BILINGUAL LANGUAGE REBUILD COMMAND

## Status: Mandatory
## Priority: Highest
## Scope: Entire website currently in redevelopment
## Applies to: DEV / Content / QA / Design / AI / Codex / CMS / SEO

Từ thời điểm này, toàn bộ website phải được rà soát, chuẩn hóa, viết lại và kiểm tra lại toàn bộ ngôn ngữ song ngữ theo chuẩn tuyệt đối trước khi được phép live.

Mục tiêu không phải là “dịch lại nội dung”.
Mục tiêu là tái cấu trúc toàn bộ hệ ngôn ngữ của website để đạt chuẩn:

1. Tiếng Việt Nam có dấu đầy đủ, chuẩn chính tả, chuẩn văn bản, rõ nghĩa, thống nhất toàn site.
2. Tiếng Anh chuẩn Mỹ quốc tế, tự nhiên, rõ ràng, không dịch máy từng chữ, không sai ngữ pháp, không dùng giọng bán hàng rẻ tiền.
3. Mỗi ngôn ngữ có metadata SEO riêng, title riêng, description riêng, alt text riêng, URL logic rõ ràng, không dùng chung bừa bãi.
4. Mọi chữ trên site phải đi qua một nguồn nội dung chuẩn, không hard-code rải rác trong component, template, script hay CMS không kiểm soát.
5. Không được phép live bất kỳ page nào khi còn chữ sai, chữ thiếu dấu, lệch tông, lẫn ngôn ngữ, sai heading, sai CTA, sai menu, sai meta, sai alt text hoặc sai logic song ngữ.

## PHẠM VI BẮT BUỘC RÀ TOÀN BỘ

Rà toàn bộ từng chữ trên tất cả các lớp sau:

- menu chính
- menu phụ
- footer
- hero
- section title
- paragraph
- CTA
- button
- form label
- placeholder
- empty state
- error message
- badge/status
- metadata
- OG title
- OG description
- Twitter metadata
- schema name/description
- image filename
- image alt text
- image caption
- article title
- article dek
- article body
- article related links
- legal pages
- trust pages
- newsletter
- contact
- CMS fields
- search results text
- system notification text

## NGUYÊN TẮC NGÔN NGỮ BẮT BUỘC

### Tiếng Việt Nam

- Có dấu đầy đủ 100 phần trăm
- Không viết tắt tùy tiện
- Không dùng slang
- Không pha giọng quảng cáo
- Câu rõ, ngắn, đúng nghĩa
- Viết như một hệ thống nghiêm túc, không viết như bài đăng mạng xã hội
- Giữ một chuẩn thuật ngữ thống nhất từ đầu đến cuối

### Tiếng Anh

- Chuẩn Mỹ quốc tế
- Không dịch từng chữ từ tiếng Việt
- Không hype
- Không dùng sales copy yếu
- Không dùng cấu trúc máy dịch
- Phải đọc như nội dung thật do một team quốc tế chuyên nghiệp viết
- Phải giữ đúng nghĩa hệ thống của bản tiếng Việt

## QUY TẮC SONG NGỮ

- Tiếng Việt là bản chuẩn nguồn nội dung
- Tiếng Anh là bản ngôn ngữ quốc tế thứ hai
- Hai bản phải tương đương về nghĩa, không được lệch định vị
- Không để một trang đúng tiếng Việt nhưng tiếng Anh yếu, hoặc ngược lại
- Không trộn tiếng Việt và tiếng Anh lẫn lộn trong cùng một block nếu không có lý do rõ ràng
- Không để page nào chỉ hoàn chỉnh một ngôn ngữ mà live

## QUY TẮC SEO BẮT BUỘC

Mỗi page và mỗi bài phải có:

- H1 duy nhất
- title riêng theo từng ngôn ngữ
- meta description riêng theo từng ngôn ngữ
- canonical đúng
- hreflang đúng nếu có URL song ngữ tách riêng
- OG title riêng
- OG description riêng
- OG image đúng
- alt text ảnh riêng theo ngôn ngữ
- internal link đúng ngôn ngữ đang đọc
- schema đúng loại trang

Không được:

- dùng chung một title cho cả hai ngôn ngữ
- dùng description dịch máy
- để thiếu alt text
- để URL ngẫu nhiên
- để heading sai cấp
- để bài viết không có internal link
- để metadata bị trùng hàng loạt

## QUY TẮC KỸ THUẬT BẮT BUỘC

1. Tạo hoặc chuẩn hóa nguồn nội dung:
   - `/content/vi.json`
   - `/content/en.json`
2. Nếu site có CMS:
   - khóa field song ngữ rõ ràng
   - không cho publish nếu thiếu một ngôn ngữ bắt buộc
3. Không hard-code text public trong:
   - component
   - template
   - script
   - page file
   - client-side logic
4. Nếu site dùng route song ngữ:
   - `/vi/...`
   - `/en/...`
   - language switcher phải đưa đúng sang page tương ứng
5. Nếu site chưa tách route:
   - vẫn phải tách metadata, content source, và render logic theo ngôn ngữ

## QUY TRÌNH THỰC HIỆN BẮT BUỘC

### Bước 1

Crawl toàn bộ site dev hiện tại và xuất danh sách tất cả URL, tất cả text node public, tất cả metadata, tất cả image alt, tất cả form text.

### Bước 2

Lập bảng kiểm kê song ngữ:

- URL
- page type
- trạng thái tiếng Việt
- trạng thái tiếng Anh
- lỗi chính tả
- lỗi ngữ nghĩa
- lỗi SEO
- lỗi UI text
- lỗi metadata
- lỗi alt text
- mức độ ưu tiên sửa

### Bước 3

Chuẩn hóa language codex:

- thuật ngữ khóa
- từ cấm
- giọng văn
- cấu trúc heading
- CTA registry
- form registry
- error/empty state registry

### Bước 4

Viết lại toàn bộ text theo nguồn chuẩn:

- Việt trước
- Anh sau
- đúng role từng page
- đúng role từng component

### Bước 5

Rà lại từng chữ một bởi:

- AI pass 1
- Human/Editor pass 2
- SEO pass 3
- QA pass 4

### Bước 6

Kiểm thử trước live:

- mobile
- desktop
- metadata
- language switcher
- internal links
- canonical
- hreflang
- schema
- image alt
- search snippet preview

### Bước 7

Chỉ được live khi:

- 100 phần trăm page public đã qua đủ 4 pass
- không còn text sai
- không còn thiếu dấu tiếng Việt
- không còn tiếng Anh dịch máy
- không còn metadata trùng lỗi
- không còn page lệch tông

## ĐỊNH NGHĨA HOÀN THÀNH

Một website chỉ được coi là hoàn thành ngôn ngữ song ngữ khi:

- mọi URL public đều có ngôn ngữ rõ ràng
- mọi chữ public đều nằm trong hệ content source
- mọi page đều đúng chuẩn tiếng Việt Nam có dấu
- mọi page đều đúng chuẩn tiếng Anh Mỹ quốc tế
- mọi page đều có SEO song ngữ riêng
- mọi ảnh đều có alt text đúng
- mọi CTA, menu, footer, form đều đồng nhất
- không còn text rác, text placeholder, text hard-code, text lẫn ngôn ngữ
- founder có thể rà ngẫu nhiên bất kỳ page nào mà không thấy lỗi

## BÁO CÁO BẮT BUỘC TRƯỚC KHI LIVE

Team phải nộp đúng 1 báo cáo tổng trước khi live gồm:

1. Tổng số URL đã rà
2. Tổng số page đã sửa
3. Tổng số lỗi tiếng Việt đã sửa
4. Tổng số lỗi tiếng Anh đã sửa
5. Tổng số metadata đã chuẩn hóa
6. Tổng số alt text đã chuẩn hóa
7. Tổng số CTA/form/menu/footer đã chuẩn hóa
8. Danh sách page còn treo nếu có
9. Danh sách quyết định ngôn ngữ quan trọng đã khóa
10. Xác nhận cuối:
   - đủ chuẩn tiếng Việt
   - đủ chuẩn tiếng Anh
   - đủ chuẩn SEO
   - đủ chuẩn live

## MỆNH LỆNH CUỐI

Không được phép coi đây là một nhiệm vụ dịch thuật.
Đây là nhiệm vụ tái cấu trúc toàn bộ hệ ngôn ngữ, SEO và UI text của website ở cấp production.

Chỉ khi toàn bộ hệ chữ đã đúng, hệ SEO đã đúng, hệ song ngữ đã đúng, website mới được phép live.
