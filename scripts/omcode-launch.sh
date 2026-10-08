#!/bin/bash
# ─── omcode-launch.sh — Mở OMCODE IDE từ terminal ──────────────────────────

URL="http://localhost:3000/omcode"
PORT=3000

# Kiểm tra port 3000 có đang chạy không
if lsof -Pi ":$PORT" -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo "🟢 Dev server đang chạy tại port $PORT"
else
  echo "🚀 Khởi động dev server…"
  npm run dev:app &
  sleep 4
fi

# Mở browser (macOS)
if command -v open >/dev/null 2>&1; then
  open "$URL"
# Linux
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open "$URL"
# Windows WSL
elif command -v explorer.exe >/dev/null 2>&1; then
  explorer.exe "$URL"
else
  echo "👉 Mở trình duyệt và truy cập: $URL"
fi

echo "✅ OMCODE đã mở!"
