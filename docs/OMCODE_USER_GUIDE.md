# OMCODE User Guide — AI Code OS v0.1

> **Quy tắc nguồn AI (bắt buộc):** OMCODE chỉ kết nối **AIAGENT** (`https://api.aiagent.iai.one`, staging `https://staging-api.aiagent.iai.one`) hoặc model local trên loopback. Không dùng OpenAI/Anthropic/Google hay bất kỳ nhà cung cấp AI ngoài nào. Hướng dẫn này mô tả bản web v0.1; với OMCODE Desktop 0.2.3 xem `apps/omcode-desktop/README.md` (mục *AIAGENT Contract*).
>
> **Trạng thái:** Đây là hướng dẫn phát triển cho web v0.1, không phải hướng dẫn production. Không nhập client key production vào bản web này. Chính sách bắt buộc nằm tại [`docs/governance/OMCODE_AI_SOURCE_POLICY_2026-09-27.md`](governance/OMCODE_AI_SOURCE_POLICY_2026-09-27.md).

## Quick Start

### Cách 1: Từ Terminal (khuyến nghị)

```bash
npm run omcode
```

Hoặc từ root repo:
```bash
bash scripts/omcode-launch.sh
```

Script tự động:
- Kiểm tra dev server đang chạy chưa
- Khởi động nếu chưa có
- Mở browser với `http://localhost:3000/omcode`

### Cách 2: Thủ công

1. Mở Chrome/Edge trên MacBook
2. Truy cập: `http://localhost:3000/omcode`
3. Click **"🗂 Mở dự án"** → chọn folder code
4. **⚙️ Settings** (top-right) → chỉ kiểm tra UI bằng fixture local; không nhập client key thật vào web v0.1
5. Dùng OMCODE Desktop cho kết nối AIAGENT thật; Desktop lưu credential trong Keychain

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘K` | AI Command Palette |
| `⌘I` | Inline AI (chọn code trong editor → hỏi AI) |
| `⌘⇧P` | Command Palette (tất cả lệnh) |
| `Enter` (trong chat) | Gửi message |
| `Shift+Enter` | Xuống dòng trong chat |
| `/` | Slash commands trong chat |

---

## Slash Commands

Gõ `/` trong chat input để mở menu:

| Command | Mô tả | Context tự động |
|---------|-------|-----------------|
| `/explain` | Giải thích code đang chọn | File active |
| `/test` | Viết unit test | File active |
| `/refactor` | Refactor cleaner/faster | File active |
| `/fix` | Sửa lỗi / bug | File active |
| `/doc` | Thêm JSDoc / documentation | File active |
| `/commit` | Viết commit message từ diff | Git diff |

---

## @-mentions

Trong chat, gõ `@filename` để AI đọc thêm context từ file đó.

Ví dụ:
```
Hãy refactor hàm này trong @utils.ts
```

AI sẽ nhận thêm nội dung file `utils.ts` trong context.

---

## Apply Code

Khi AI trả về code block (```), mỗi block có nút **"✓ Apply"**.
- Click → code được ghi đè vào **file active** trong editor
- Không cần copy-paste thủ công

---

## Settings Panel (⚙️)

**Kết nối AI**: chỉ **AIAGENT**. Web v0.1 chưa có credential flow đạt chuẩn production nên không được nhận client key thật. Danh sách model production phải do catalog AIAGENT trả về sau khi xác thực; không có tùy chọn nhập key của nhà cung cấp AI khác.
- Production: `https://api.aiagent.iai.one`
- Staging (khi được cấp): `https://staging-api.aiagent.iai.one`
- Model local (tùy chọn): chỉ qua loopback (`http://127.0.0.1:…`)

**Default Model**: Chọn model mặc định cho tất cả chat.

**Auto-approve**: Bật/tắt auto-approve cho low/medium risk actions.

---

## Privacy & Local-First

- File dự án được đọc qua File System Access API; chỉ context được người dùng chấp thuận mới được gửi tới AIAGENT trong bản production đã duyệt
- Chat history lưu trong localStorage
- Không lưu client key hoặc credential dài hạn trong localStorage
- Web production phải dùng session cookie `HttpOnly` hoặc token ngắn hạn do backend cấp; flow này chưa có trong web v0.1
- OMCODE Desktop lưu client credential bằng Keychain
- Local dev v0.1 không yêu cầu đăng nhập; web production bắt buộc có auth/session đạt chuẩn
- Model local qua loopback (ví dụ Ollama) được phép; mọi nhà cung cấp AI cloud ngoài AIAGENT bị từ chối

---

## Troubleshooting

| Vấn đề | Giải pháp |
|--------|-----------|
| "Lỗi: client key không hợp lệ" | Không nhập lại key vào web v0.1; kiểm tra kết nối trong OMCODE Desktop hoặc liên hệ operator AIAGENT |
| "Không thể mở folder" | Dùng Chrome/Edge, bật File System Access API |
| AI không hiểu context | Dùng `@filename` để thêm context |
| Streaming chậm | Giảm delay trong AIChatPanel.tsx (30ms → 10ms) |

---

## Beta Feedback

Gửi feedback qua: [omcode-feedback@iai.one](mailto:omcode-feedback@iai.one)

Mẫu feedback:
- Feature yêu thích?
- Bug gặp phải?
- Feature mong muốn thêm?
