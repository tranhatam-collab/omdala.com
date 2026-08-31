// ─── TerminalPanel — Bash-like shell trong browser ──────────────────────
"use client";

import * as React from "react";
import type { TerminalEntry } from "../hooks/useTerminal";

interface TerminalPanelProps {
  history: TerminalEntry[];
  cwd: string;
  onExecute: (command: string) => void;
}

export function TerminalPanel({ history, cwd, onExecute }: TerminalPanelProps) {
  const [input, setInput] = React.useState("");
  const [historyIndex, setHistoryIndex] = React.useState(-1);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const commandHistory = React.useMemo(
    () => history.filter((h) => h.type === "command").map((h) => h.text.replace("$ ", "")),
    [history],
  );

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const handleSubmit = () => {
    if (!input.trim()) return;
    onExecute(input.trim());
    setInput("");
    setHistoryIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      const newIndex = historyIndex + 1;
      if (newIndex < commandHistory.length) {
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex]);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const newIndex = historyIndex - 1;
      if (newIndex >= 0) {
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex]);
      } else {
        setHistoryIndex(-1);
        setInput("");
      }
      return;
    }

    if (e.key === "l" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onExecute("clear");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <div style={{
        padding: "8px 16px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#f7fbff", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Terminal
        </span>
        <span style={{ fontSize: 11, color: "#6b7f99", fontFamily: "var(--font-mono, monospace)" }}>
          {cwd ? `~/${cwd}` : "~"}
        </span>
      </div>

      {/* Output */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflow: "auto",
          padding: "12px 16px",
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          fontSize: 13,
          lineHeight: 1.6,
        }}
        onClick={() => inputRef.current?.focus()}
      >
        {history.map((entry) => (
          <div key={entry.id} style={{ marginBottom: 4, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {entry.type === "command" && (
              <span style={{ color: "#7ef2ff", fontWeight: 500 }}>{entry.text}</span>
            )}
            {entry.type === "output" && (
              <span style={{ color: "#a8b9d0" }}>{entry.text}</span>
            )}
            {entry.type === "error" && (
              <span style={{ color: "#f87171" }}>{entry.text}</span>
            )}
            {entry.type === "info" && (
              <span style={{ color: "#6b7f99", fontStyle: "italic" }}>{entry.text}</span>
            )}
          </div>
        ))}
      </div>

      {/* Input */}
      <div style={{
        padding: "8px 16px",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      }}>
        <span style={{ color: "#4ade80", fontSize: 13, flexShrink: 0 }}>➜</span>
        <span style={{ color: "#60a5fa", fontSize: 13, flexShrink: 0 }}>
          {cwd ? cwd.split("/").pop() : "~"}
        </span>
        <span style={{ color: "#a8b9d0", fontSize: 13, flexShrink: 0 }}>%</span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Nhập lệnh..."
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: "#f7fbff",
            fontFamily: "inherit",
            fontSize: 13,
            caretColor: "#7ef2ff",
          }}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />
      </div>
    </div>
  );
}
