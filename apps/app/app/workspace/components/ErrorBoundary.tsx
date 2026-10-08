// ─── ErrorBoundary — Bắt lỗi toàn app + tự động báo cáo ───────────────────
"use client";

import * as React from "react";
import { dict, type Lang } from "../hooks/useI18n";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

const ERROR_LOG_KEY = "omcode:error:log";

function getCurrentLang(): Lang {
  try {
    return (localStorage.getItem("omcode:lang") as Lang) || "vi";
  } catch {
    return "vi";
  }
}

function t(key: string) {
  const lang = getCurrentLang();
  return dict[lang][key] || key;
}

function saveError(error: Error, info: React.ErrorInfo) {
  try {
    const all: Array<{ id: string; message: string; stack?: string; componentStack?: string; timestamp: number }> =
      JSON.parse((localStorage.getItem(ERROR_LOG_KEY) as string) || "[]");
    all.push({
      id: `err-${Date.now()}`,
      message: error.message,
      stack: error.stack,
      componentStack: info.componentStack || undefined,
      timestamp: Date.now(),
    });
    localStorage.setItem(ERROR_LOG_KEY, JSON.stringify(all.slice(-100)));
  } catch {}
}

export function getErrorLog() {
  try {
    return JSON.parse(localStorage.getItem(ERROR_LOG_KEY) || "[]");
  } catch { return []; }
}

export function clearErrorLog() {
  localStorage.removeItem(ERROR_LOG_KEY);
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    saveError(error, info);
    console.error("OMCODE Error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#060d1a",
          color: "#dbe7f5",
          fontFamily: "system-ui, sans-serif",
          padding: 24,
        }}>
          <div style={{
            maxWidth: 500,
            padding: 32,
            borderRadius: 12,
            border: "1px solid rgba(239,68,68,0.2)",
            background: "rgba(239,68,68,0.05)",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>💥</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#ef4444", marginBottom: 8 }}>
              {t("errorTitle")}
            </div>
            <div style={{ fontSize: 12, color: "#a8b9d0", marginBottom: 16, lineHeight: 1.5 }}>
              {t("errorDesc")}
            </div>
            <div style={{
              fontSize: 10,
              color: "#6b7f99",
              background: "rgba(0,0,0,0.3)",
              padding: 10,
              borderRadius: 6,
              textAlign: "left",
              marginBottom: 16,
              fontFamily: "monospace",
              overflow: "auto",
              maxHeight: 120,
            }}>
              {this.state.error?.message}
            </div>
            <button
              onClick={() => { this.setState({ hasError: false, error: undefined }); }}
              style={{
                padding: "10px 24px",
                borderRadius: 8,
                border: "none",
                background: "linear-gradient(135deg,#7ef2ff,#5cd9ff)",
                color: "#04101f",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {t("retry")}
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
