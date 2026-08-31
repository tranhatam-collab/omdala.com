// ─── ErrorLogPanel — View auto-saved error reports ────────────────────────
"use client";

import * as React from "react";
import { useI18n } from "../hooks/useI18n";
import { getErrorLog, clearErrorLog } from "./ErrorBoundary";

interface ErrorEntry {
  id: string;
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: number;
}

export function ErrorLogPanel() {
  const { t } = useI18n();
  const [logs, setLogs] = React.useState<ErrorEntry[]>(() => getErrorLog());
  const [copied, setCopied] = React.useState(false);

  const handleClear = () => {
    clearErrorLog();
    setLogs([]);
  };

  const handleCopy = () => {
    const text = JSON.stringify(logs, null, 2);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{ padding: 16, color: "#dbe7f5", fontSize: 12, overflow: "auto", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#ef4444" }}>🐛 {t("errorLog")}</span>
        <span style={{ flex: 1 }} />
        <button
          onClick={handleCopy}
          style={{
            padding: "3px 8px",
            borderRadius: 4,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "transparent",
            color: "#7ef2ff",
            fontSize: 10,
            cursor: "pointer",
          }}
        >
          {copied ? t("copied") : t("copy")}
        </button>
        <button
          onClick={handleClear}
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

      {logs.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "#6b7f99" }}>{t("noErrors")}</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[...logs].reverse().map((log) => (
            <div
              key={log.id}
              style={{
                padding: 10,
                borderRadius: 6,
                background: "rgba(239,68,68,0.05)",
                border: "1px solid rgba(239,68,68,0.1)",
              }}
            >
              <div style={{ fontSize: 10, color: "#ef4444", fontWeight: 700, marginBottom: 4 }}>
                {new Date(log.timestamp).toLocaleString()}
              </div>
              <div style={{ fontSize: 11, color: "#dbe7f5", marginBottom: 4, wordBreak: "break-word" }}>
                {log.message}
              </div>
              {log.componentStack && (
                <pre
                  style={{
                    margin: 0,
                    fontSize: 9,
                    color: "#6b7f99",
                    maxHeight: 100,
                    overflow: "auto",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {log.componentStack}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
