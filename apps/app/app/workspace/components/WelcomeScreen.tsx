// ─── WelcomeScreen — Zero-config startup cho OMCODE ───────────────────────
"use client";

import * as React from "react";

interface RecentProject {
  name: string;
  path: string;
  openedAt: number;
}

const RECENTS_KEY = "omcode:recents";

function loadRecents(): RecentProject[] {
  try {
    const raw = localStorage.getItem(RECENTS_KEY);
    if (raw) return JSON.parse(raw).slice(0, 6);
  } catch {}
  return [];
}

export function saveRecentProject(name: string, path: string) {
  try {
    const recents: RecentProject[] = loadRecents().filter((r) => r.path !== path);
    recents.unshift({ name, path, openedAt: Date.now() });
    localStorage.setItem(RECENTS_KEY, JSON.stringify(recents.slice(0, 10)));
  } catch {}
}

interface WelcomeScreenProps {
  onOpenFolder: () => void;
  onOpenRecent?: (path: string) => void;
}

export function WelcomeScreen({ onOpenFolder, onOpenRecent }: WelcomeScreenProps) {
  const [recents, setRecents] = React.useState<RecentProject[]>([]);

  React.useEffect(() => {
    setRecents(loadRecents());
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        padding: 40,
        background: "linear-gradient(135deg, #060d1a 0%, #0a192f 50%, #060d1a 100%)",
        overflow: "auto",
      }}
    >
      {/* Logo */}
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 20,
          background: "linear-gradient(135deg, #7ef2ff, #5cd9ff)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 36,
          fontWeight: 800,
          color: "#04101f",
          marginBottom: 24,
          boxShadow: "0 0 40px rgba(126,242,255,0.3)",
        }}
      >
        OM
      </div>

      <h1
        style={{
          fontSize: 32,
          fontWeight: 800,
          color: "#f7fbff",
          margin: "0 0 8px",
          letterSpacing: -0.5,
        }}
      >
        OMCODE
      </h1>
      <p style={{ fontSize: 15, color: "#6b7f99", margin: "0 0 40px", textAlign: "center" }}>
        AI Code OS — Viết code thông minh trên MacBook của bạn.
        <br />
        Local-first. Không cần đăng nhập. Dữ liệu không rời máy.
      </p>

      {/* Primary action */}
      <button
        onClick={onOpenFolder}
        style={{
          padding: "14px 32px",
          borderRadius: 10,
          border: "none",
          background: "linear-gradient(135deg, #7ef2ff, #5cd9ff)",
          color: "#04101f",
          fontSize: 15,
          fontWeight: 700,
          cursor: "pointer",
          boxShadow: "0 4px 20px rgba(126,242,255,0.3)",
          transition: "transform 0.15s",
          marginBottom: 16,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        🗂 Mở dự án
      </button>
      <p style={{ fontSize: 12, color: "#6b7f99", margin: 0 }}>
        hoặc kéo thả folder vào đây (Chrome/Edge)
      </p>

      {/* Recent projects */}
      {recents.length > 0 && (
        <div style={{ marginTop: 40, width: "100%", maxWidth: 520 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#7ef2ff",
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginBottom: 12,
            }}
          >
            Dự án gần đây
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {recents.map((r) => (
              <button
                key={r.path}
                onClick={() => onOpenRecent?.(r.path)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.06)",
                  background: "rgba(255,255,255,0.02)",
                  color: "#dbe7f5",
                  fontSize: 13,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(126,242,255,0.05)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,0.02)")
                }
              >
                <span style={{ fontSize: 16 }}>📁</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: "#f7fbff" }}>{r.name}</div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#6b7f99",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {r.path}
                  </div>
                </div>
                <span style={{ fontSize: 11, color: "#6b7f99", whiteSpace: "nowrap" }}>
                  {new Date(r.openedAt).toLocaleDateString("vi-VN")}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick tips */}
      <div
        style={{
          marginTop: 40,
          padding: 16,
          borderRadius: 10,
          border: "1px solid rgba(126,242,255,0.1)",
          background: "rgba(126,242,255,0.03)",
          maxWidth: 520,
          width: "100%",
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 700, color: "#7ef2ff", marginBottom: 10 }}>
          💡 Phím tắt nhanh
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "auto 1fr",
            gap: "6px 16px",
            fontSize: 12,
            color: "#a8b9d0",
          }}
        >
          <span style={{ color: "#7ef2ff", fontFamily: "ui-monospace, monospace" }}>⌘K</span>
          <span>AI Command Palette</span>
          <span style={{ color: "#7ef2ff", fontFamily: "ui-monospace, monospace" }}>⌘I</span>
          <span>Inline AI (chọn code → hỏi AI)</span>
          <span style={{ color: "#7ef2ff", fontFamily: "ui-monospace, monospace" }}>⌘⇧P</span>
          <span>Command Palette (tất cả lệnh)</span>
          <span style={{ color: "#7ef2ff", fontFamily: "ui-monospace, monospace" }}>/</span>
          <span>Slash commands trong chat (/explain, /test...)</span>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: "auto", paddingTop: 24, fontSize: 11, color: "#6b7f99" }}>
        OMCODE v0.1 · Local-first · 7 AI providers · Monaco Editor · Git · Terminal
      </div>
    </div>
  );
}
