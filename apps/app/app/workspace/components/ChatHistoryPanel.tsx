// ─── ChatHistoryPanel — Full searchable chat history ──────────────────────
"use client";

import * as React from "react";
import { useI18n } from "../hooks/useI18n";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  workspace: string;
  model?: string;
}

const HISTORY_KEY = "omcode:chat:global";

export function saveChatMessage(msg: ChatMessage) {
  try {
    const all: ChatMessage[] = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    all.push(msg);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(all.slice(-1000)));
  } catch {}
}

export function getChatHistory(): ChatMessage[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch { return []; }
}

export function clearChatHistory() {
  localStorage.removeItem(HISTORY_KEY);
}

export function ChatHistoryPanel() {
  const { t } = useI18n();
  const [history, setHistory] = React.useState<ChatMessage[]>([]);
  const [search, setSearch] = React.useState("");
  const [workspaceFilter, setWorkspaceFilter] = React.useState<string>("all");

  React.useEffect(() => {
    setHistory(getChatHistory());
    const iv = setInterval(() => setHistory(getChatHistory()), 2000);
    return () => clearInterval(iv);
  }, []);

  const workspaces = React.useMemo(() => {
    const set = new Set(history.map((h) => h.workspace));
    return ["all", ...Array.from(set)];
  }, [history]);

  const filtered = React.useMemo(() => {
    return history
      .filter((h) => (workspaceFilter === "all" ? true : h.workspace === workspaceFilter))
      .filter((h) => !search || h.content.toLowerCase().includes(search.toLowerCase()))
      .reverse();
  }, [history, search, workspaceFilter]);

  return (
    <div style={{ padding: 16, color: "#dbe7f5", fontSize: 12, overflow: "auto", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#7ef2ff" }}>💬 {t("history")}</span>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 10, color: "#6b7f99" }}>{history.length} {t("messages")}</span>
        <button
          onClick={() => { clearChatHistory(); setHistory([]); }}
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
          {t("clear")}
        </button>
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t("search") + "..."}
        style={{
          width: "100%",
          marginBottom: 8,
          background: "rgba(0,0,0,0.3)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 6,
          padding: "6px 10px",
          color: "#dbe7f5",
          fontSize: 11,
          outline: "none",
        }}
      />

      <select
        aria-label="Filter workspace"
        value={workspaceFilter}
        onChange={(e) => setWorkspaceFilter(e.target.value)}
        style={{
          width: "100%",
          marginBottom: 12,
          background: "rgba(0,0,0,0.3)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 6,
          padding: "5px 8px",
          color: "#dbe7f5",
          fontSize: 11,
          outline: "none",
        }}
      >
        {workspaces.map((w) => (
          <option key={w} value={w}>{w === "all" ? t("allWorkspaces") : w}</option>
        ))}
      </select>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {filtered.map((h) => (
          <div
            key={h.id}
            style={{
              padding: 8,
              borderRadius: 6,
              background: h.role === "user" ? "rgba(126,242,255,0.05)" : "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.04)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: h.role === "user" ? "#7ef2ff" : "#4ade80" }}>
                {h.role === "user" ? t("you") : t("ai")}
              </span>
              <span style={{ fontSize: 9, color: "#6b7f99" }}>
                {new Date(h.timestamp).toLocaleString()}
              </span>
              {h.model && (
                <span style={{ fontSize: 9, color: "#a8b9d0", marginLeft: "auto" }}>{h.model}</span>
              )}
            </div>
            <div style={{ fontSize: 11, color: "#dbe7f5", lineHeight: 1.4, wordBreak: "break-word" }}>
              {h.content.slice(0, 200)}{h.content.length > 200 ? "..." : ""}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: "#6b7f99" }}>{t("noMessages")}</div>
      )}
    </div>
  );
}
