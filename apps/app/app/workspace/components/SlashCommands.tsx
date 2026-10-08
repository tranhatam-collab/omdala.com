// ─── Slash Commands — /explain /test /refactor /fix /doc /commit ──────────
"use client";

import * as React from "react";

export interface SlashCommand {
  id: string;
  label: string;
  description: string;
  prefix: string;
  promptBuilder: (selection?: string, filePath?: string) => string;
}

export const SLASH_COMMANDS: SlashCommand[] = [
  {
    id: "explain",
    label: "/explain",
    description: "Giải thích code đang chọn",
    prefix: "/explain",
    promptBuilder: (sel, fp) =>
      `Giải thích chi tiết đoạn code sau${fp ? ` trong file ${fp}` : ""}:\n\n${sel || ""}`,
  },
  {
    id: "test",
    label: "/test",
    description: "Viết unit test cho code đang chọn",
    prefix: "/test",
    promptBuilder: (sel, fp) =>
      `Viết unit test (Jest/Vitest) cho đoạn code sau${fp ? ` trong file ${fp}` : ""}:\n\n${sel || ""}`,
  },
  {
    id: "refactor",
    label: "/refactor",
    description: "Refactor code — cleaner, faster, DRY",
    prefix: "/refactor",
    promptBuilder: (sel, fp) =>
      `Refactor đoạn code sau${fp ? ` trong file ${fp}` : ""} để cleaner, faster, tuân thủ best practices. Giữ nguyên behavior.\n\n${sel || ""}`,
  },
  {
    id: "fix",
    label: "/fix",
    description: "Sửa lỗi / bug trong code",
    prefix: "/fix",
    promptBuilder: (sel, fp) =>
      `Phát hiện và sửa lỗi trong đoạn code sau${fp ? ` trong file ${fp}` : ""}. Giải thích nguyên nhân và đưa ra code đã sửa.\n\n${sel || ""}`,
  },
  {
    id: "doc",
    label: "/doc",
    description: "Tạo JSDoc / documentation",
    prefix: "/doc",
    promptBuilder: (sel, fp) =>
      `Thêm JSDoc / documentation cho đoạn code sau${fp ? ` trong file ${fp}` : ""}. Trả về code đã có comment.\n\n${sel || ""}`,
  },
  {
    id: "commit",
    label: "/commit",
    description: "Viết commit message từ diff",
    prefix: "/commit",
    promptBuilder: () =>
      `Viết commit message (tiếng Anh, conventional commits) từ diff hiện tại. Ngắn gọn, rõ ràng.`,
  },
];

interface SlashMenuProps {
  query: string;
  onSelect: (cmd: SlashCommand) => void;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLTextAreaElement | null>;
}

export function SlashMenu({ query, onSelect, onClose, anchorRef }: SlashMenuProps) {
  const filtered = SLASH_COMMANDS.filter(
    (c) => c.prefix.toLowerCase().includes(query.toLowerCase()) ||
           c.description.toLowerCase().includes(query.toLowerCase())
  );

  const menuRef = React.useRef<HTMLDivElement>(null);
  const [pos, setPos] = React.useState({ top: 0, left: 0 });

  React.useEffect(() => {
    if (anchorRef.current && menuRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPos({
        top: rect.top - Math.min(220, filtered.length * 44) - 4,
        left: rect.left,
      });
    }
  }, [anchorRef, filtered.length]);

  React.useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [onClose]);

  if (filtered.length === 0) return null;

  return (
    <div
      ref={menuRef}
      style={{
        position: "fixed",
        top: pos.top,
        left: pos.left,
        width: 320,
        background: "#0a1424",
        border: "1px solid rgba(126,242,255,0.2)",
        borderRadius: 8,
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        zIndex: 200,
        overflow: "hidden",
      }}
    >
      {filtered.map((cmd) => (
        <button
          key={cmd.id}
          onClick={() => onSelect(cmd)}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            width: "100%",
            padding: "10px 14px",
            border: "none",
            borderBottom: "1px solid rgba(255,255,255,0.04)",
            background: "transparent",
            color: "#dbe7f5",
            fontSize: 12,
            cursor: "pointer",
            textAlign: "left",
            transition: "background 0.1s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(126,242,255,0.08)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "transparent")
          }
        >
          <span style={{ fontWeight: 700, color: "#7ef2ff" }}>{cmd.label}</span>
          <span style={{ fontSize: 11, color: "#6b7f99", marginTop: 2 }}>
            {cmd.description}
          </span>
        </button>
      ))}
    </div>
  );
}
