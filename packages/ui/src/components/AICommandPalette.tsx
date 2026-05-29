// ─── AI Command Palette — Windsurf-inspired ─────────────────────────────
"use client";

import * as React from "react";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  shortcut?: string;
  action: () => void;
  section?: string;
}

interface AICommandPaletteProps {
  commands?: CommandItem[];
  aiEnabled?: boolean;
  placeholder?: string;
  locale?: "vi" | "en";
  onClose?: () => void;
}

const TRANSLATIONS = {
  vi: {
    placeholder: "Lệnh thông minh — nhập '/' để tìm lệnh hoặc hỏi AI...",
    noResults: "Không tìm thấy",
    recent: "Gần đây",
    ai: "AI Assistant",
    aiThinking: "AI đang suy nghĩ...",
    nav: "Điều hướng",
    actions: "Hành động",
    close: "Đóng (Esc)",
  },
  en: {
    placeholder: "Smart command — type '/' to find commands or ask AI...",
    noResults: "No results",
    recent: "Recent",
    ai: "AI Assistant",
    aiThinking: "AI is thinking...",
    nav: "Navigation",
    actions: "Actions",
    close: "Close (Esc)",
  },
};

export function AICommandPalette({
  commands = [],
  aiEnabled = true,
  locale = "vi",
  onClose,
}: AICommandPaletteProps) {
  const t = TRANSLATIONS[locale];
  const [query, setQuery] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [aiResponse, setAiResponse] = React.useState("");
  const [isAiLoading, setIsAiLoading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  const filtered = React.useMemo(() => {
    if (!query) return commands;
    const q = query.toLowerCase();
    return commands.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        (c.description?.toLowerCase().includes(q) ?? false),
    );
  }, [query, commands]);

  const sections = React.useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    for (const item of filtered) {
      const sec = item.section || t.actions;
      if (!map.has(sec)) map.set(sec, []);
      map.get(sec)!.push(item);
    }
    return map;
  }, [filtered, t.actions]);

  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  React.useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose?.();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const item = filtered[selectedIndex];
        if (item) item.action();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [filtered, selectedIndex, onClose]);

  const handleAiSubmit = React.useCallback(async () => {
    if (!aiEnabled || !query.trim()) return;
    setIsAiLoading(true);
    // In production: call /v1/ai/complete
    await new Promise((r) => setTimeout(r, 1200));
    setAiResponse(
      locale === "vi"
        ? `Tôi đã phân tích yêu cầu: "${query}". Bạn có thể thử sử dụng lệnh \n• Tạo nút mạng mới \n• Xem bảng điều khiển \n• Liên hệ hỗ trợ`
        : `I've analyzed: "${query}". Try using \n• Create new node \n• View dashboard \n• Contact support`,
    );
    setIsAiLoading(false);
  }, [aiEnabled, query, locale]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 600,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "10vh",
        background: "rgba(6, 13, 26, 0.6)",
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 640,
          background: "rgba(15, 29, 51, 0.95)",
          borderRadius: 16,
          border: "1px solid rgba(126, 242, 255, 0.15)",
          boxShadow: "0 25px 50px rgba(0,0,0,0.4), 0 0 30px rgba(126,242,255,0.08)",
          overflow: "hidden",
          animation: "scaleIn 200ms cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {/* Input */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "16px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(126,242,255,0.7)" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && query.trim().startsWith("?")) {
                handleAiSubmit();
              }
            }}
            placeholder={t.placeholder}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#f7fbff",
              fontSize: 16,
              fontFamily: "'Inter', system-ui, sans-serif",
            }}
          />
          <span style={{ color: "rgba(168,185,208,0.5)", fontSize: 12 }}>{t.close}</span>
        </div>

        {/* AI Response */}
        {(isAiLoading || aiResponse) && (
          <div
            style={{
              padding: "12px 20px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(126,242,255,0.04)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #7ef2ff, #3d8bff)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  color: "#060d1a",
                  fontWeight: 700,
                }}
              >
                AI
              </div>
              <span style={{ color: "#7ef2ff", fontSize: 13, fontWeight: 600 }}>{t.ai}</span>
            </div>
            {isAiLoading ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 16,
                    height: 16,
                    border: "2px solid rgba(126,242,255,0.2)",
                    borderTopColor: "#7ef2ff",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
                <span style={{ color: "rgba(168,185,208,0.7)", fontSize: 14 }}>{t.aiThinking}</span>
              </div>
            ) : (
              <p style={{ color: "#a8b9d0", fontSize: 14, lineHeight: 1.6, margin: 0, whiteSpace: "pre-line" }}>
                {aiResponse}
              </p>
            )}
          </div>
        )}

        {/* Results */}
        <div ref={listRef} style={{ maxHeight: 320, overflowY: "auto" }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center", color: "rgba(168,185,208,0.5)" }}>
              {t.noResults}
            </div>
          ) : (
            Array.from(sections.entries()).map(([section, items]) => (
              <div key={section}>
                <div
                  style={{
                    padding: "8px 20px",
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "rgba(168,185,208,0.4)",
                  }}
                >
                  {section}
                </div>
                {items.map((item, idx) => {
                  const globalIdx = filtered.indexOf(item);
                  const isSelected = globalIdx === selectedIndex;
                  return (
                    <button
                      key={item.id}
                      onClick={() => item.action()}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "10px 20px",
                        textAlign: "left",
                        border: "none",
                        background: isSelected
                          ? "rgba(126, 242, 255, 0.08)"
                          : "transparent",
                        cursor: "pointer",
                        transition: "background 150ms",
                      }}
                    >
                      {item.icon && (
                        <span style={{ fontSize: 16, opacity: 0.7 }}>{item.icon}</span>
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ color: "#f7fbff", fontSize: 14, fontWeight: 500 }}>
                          {item.label}
                        </div>
                        {item.description && (
                          <div style={{ color: "rgba(168,185,208,0.6)", fontSize: 12 }}>
                            {item.description}
                          </div>
                        )}
                      </div>
                      {item.shortcut && (
                        <kbd
                          style={{
                            padding: "2px 8px",
                            borderRadius: 6,
                            background: "rgba(255,255,255,0.06)",
                            color: "rgba(168,185,208,0.7)",
                            fontSize: 11,
                            fontFamily: "'JetBrains Mono', monospace",
                          }}
                        >
                          {item.shortcut}
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>

      <style>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.96) translateY(-8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
