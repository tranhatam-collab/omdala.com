# OMCODE User Guide — AI Code OS v0.1

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
4. **⚙️ Settings** (top-right) → nhập API key OpenAI / Anthropic / Google
5. **💬 AI Chat** → chọn model → bắt đầu hỏi AI

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

**API Keys**: Nhập key cho 7 providers:
- OpenAI (GPT-4o, o1, o3)
- Anthropic (Claude 3.5/3.7 Sonnet, Opus)
- Google (Gemini 1.5 Pro/Flash)
- Groq (Llama 3, Mixtral)
- Together AI, Mistral, DeepSeek

**Default Model**: Chọn model mặc định cho tất cả chat.

**Auto-approve**: Bật/tắt auto-approve cho low/medium risk actions.

---

## Privacy & Local-First

- Dữ liệu không rời máy (File System Access API)
- Chat history lưu trong localStorage
- API key lưu trong localStorage (không gửi đi server)
- Không cần đăng nhập
- Offline với Ollama (chưa cài, có thể thêm sau)

---

## Troubleshooting

| Vấn đề | Giải pháp |
|--------|-----------|
| "Lỗi: API key không hợp lệ" | Vào Settings → kiểm tra key |
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
