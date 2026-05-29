// ─── CodeHistoryPanel — File edit history, undo/redo log ──────────────────
"use client";

import * as React from "react";

interface CodeEdit {
  id: string;
  path: string;
  timestamp: number;
  action: "edit" | "create" | "delete" | "apply";
  description: string;
  before?: string;
  after?: string;
}

const CODE_HISTORY_KEY = "omcode:code:history";

export function recordCodeEdit(edit: CodeEdit) {
  try {
    const all: CodeEdit[] = JSON.parse(localStorage.getItem(CODE_HISTORY_KEY) || "[]");
    all.push(edit);
    localStorage.setItem(CODE_HISTORY_KEY, JSON.stringify(all.slice(-500)));
  } catch {}
}

export function getCodeHistory(): CodeEdit[] {
  try {
    return JSON.parse(localStorage.getItem(CODE_HISTORY_KEY) || "[]");
  } catch { return []; }
}

export function clearCodeHistory() {
  localStorage.removeItem(CODE_HISTORY_KEY);
}

export function CodeHistoryPanel() {
  const [history, setHistory] = React.useState<CodeEdit[]>([]);
  const [search, setSearch] = React.useState("");
  const [selectedEdit, setSelectedEdit] = React.useState<CodeEdit | null>(null);

  React.useEffect(() => {
    setHistory(getCodeHistory());
    const iv = setInterval(() => setHistory(getCodeHistory()), 2000);
    return () => clearInterval(iv);
  }, []);

  const filtered = React.useMemo(() => {
    return history
      .filter((h) => !search || h.path.toLowerCase().includes(search.toLowerCase()) || h.description.toLowerCase().includes(search.toLowerCase()))
      .reverse();
  }, [history, search]);

  const actionIcon: Record<string, string> = { edit: "✏️", create: "📄", delete: "🗑️", apply: "🤖" };
  const actionColor: Record<string, string> = { edit: "#7ef2ff", create: "#4ade80", delete: "#ef4444", apply: "#a78bfa" };

  return (
    <div style={{ padding: 16, color: "#dbe7f5", fontSize: 12, overflow: "auto", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#7ef2ff" }}>📝 Code History</span>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 10, color: "#6b7f99" }}>{history.length} edits</span>
        <button
          onClick={() => { clearCodeHistory(); setHistory([]); }}
          style={{
            padding: "3px 8px",
            borderRadius: 4,
            border: "1px solid rgba(239,68,68,0.3)",
            background: "rgba(239,68,68,0.1)",
            color: "#ef4444",
            fontSize: 10,
            cursor: "pointer",
          }}
        >
          Clear
        </button>
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search file or description..."
        style={{
          width: "100%",
          marginBottom: 12,
          background: "rgba(0,0,0,0.3)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 6,
          padding: "6px 10px",
          color: "#dbe7f5",
          fontSize: 11,
          outline: "none",
        }}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {filtered.map((h) => (
          <button
            key={h.id}
            onClick={() => setSelectedEdit(selectedEdit?.id === h.id ? null : h)}
            style={{
              padding: "8px 10px",
              borderRadius: 6,
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.04)",
              textAlign: "left",
              cursor: "pointer",
              color: "inherit",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12 }}>{actionIcon[h.action] || "•"}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: actionColor[h.action] || "#a8b9d0" }}>
                {h.action.toUpperCase()}
              </span>
              <span style={{ fontSize: 10, color: "#6b7f99", flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>
                {h.path}
              </span>
              <span style={{ fontSize: 9, color: "#6b7f99" }}>
                {new Date(h.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div style={{ fontSize: 10, color: "#a8b9d0", marginTop: 2, paddingLeft: 18 }}>
              {h.description}
            </div>

            {selectedEdit?.id === h.id && h.before && h.after && (
              <div style={{ marginTop: 8, padding: 8, background: "rgba(0,0,0,0.3)", borderRadius: 6 }}>
                <div style={{ fontSize: 9, color: "#6b7f99", marginBottom: 4 }}>DIFF PREVIEW</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 9, color: "#ef4444", marginBottom: 2 }}>BEFORE</div>
                    <pre style={{ margin: 0, fontSize: 9, color: "#a8b9d0", maxHeight: 120, overflow: "auto", whiteSpace: "pre-wrap" }}>
                      {h.before.slice(0, 500)}
                    </pre>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 9, color: "#4ade80", marginBottom: 2 }}>AFTER</div>
                    <pre style={{ margin: 0, fontSize: 9, color: "#a8b9d0", maxHeight: 120, overflow: "auto", whiteSpace: "pre-wrap" }}>
                      {h.after.slice(0, 500)}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: "#6b7f99" }}>No code edits yet.</div>
      )}
    </div>
  );
}
