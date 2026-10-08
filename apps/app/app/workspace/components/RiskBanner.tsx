// ─── RiskBanner — Warning trước thao tác nguy hiểm ────────────────────────
"use client";

import * as React from "react";
import { useI18n } from "../hooks/useI18n";

const RISK_KEYS = {
  terminal: "omcode:risk:terminal",
  applyCode: "omcode:risk:apply",
  deleteFile: "omcode:risk:delete",
};

function hasDismissed(key: string): boolean {
  try { return localStorage.getItem(key) === "dismissed"; } catch { return false; }
}

function dismiss(key: string) {
  localStorage.setItem(key, "dismissed");
}

export function TerminalRiskBanner() {
  const { t } = useI18n();
  const [show, setShow] = React.useState(!hasDismissed(RISK_KEYS.terminal));
  if (!show) return null;
  return (
    <div style={{
      background: "rgba(239,68,68,0.1)",
      border: "1px solid rgba(239,68,68,0.2)",
      borderRadius: 6,
      padding: "8px 12px",
      margin: "0 16px 8px",
      display: "flex",
      alignItems: "center",
      gap: 8,
    }}>
      <span style={{ fontSize: 14 }}>⚠️</span>
      <span style={{ flex: 1, fontSize: 11, color: "#fca5a5" }}>
        {t("terminalWarning")}
      </span>
      <button
        onClick={() => { dismiss(RISK_KEYS.terminal); setShow(false); }}
        style={{ background: "transparent", border: "none", color: "#fca5a5", fontSize: 10, cursor: "pointer" }}
      >
        {t("dismiss")}
      </button>
    </div>
  );
}

export function ApplyCodeRiskBanner() {
  const { t } = useI18n();
  const [show, setShow] = React.useState(!hasDismissed(RISK_KEYS.applyCode));
  if (!show) return null;
  return (
    <div style={{
      background: "rgba(245,158,11,0.1)",
      border: "1px solid rgba(245,158,11,0.2)",
      borderRadius: 6,
      padding: "8px 12px",
      margin: "0 0 8px",
      display: "flex",
      alignItems: "center",
      gap: 8,
    }}>
      <span style={{ fontSize: 14 }}>⚠️</span>
      <span style={{ flex: 1, fontSize: 10, color: "#fcd34d" }}>
        {t("applyWarning")}
      </span>
      <button
        onClick={() => { dismiss(RISK_KEYS.applyCode); setShow(false); }}
        style={{ background: "transparent", border: "none", color: "#fcd34d", fontSize: 10, cursor: "pointer" }}
      >
        {t("dismiss")}
      </button>
    </div>
  );
}

export function DeleteFileRiskBanner() {
  const { t } = useI18n();
  const [show, setShow] = React.useState(!hasDismissed(RISK_KEYS.deleteFile));
  if (!show) return null;
  return (
    <div style={{
      background: "rgba(239,68,68,0.1)",
      border: "1px solid rgba(239,68,68,0.2)",
      borderRadius: 6,
      padding: "8px 12px",
      margin: "0 0 8px",
      display: "flex",
      alignItems: "center",
      gap: 8,
    }}>
      <span style={{ fontSize: 14 }}>🗑️</span>
      <span style={{ flex: 1, fontSize: 10, color: "#fca5a5" }}>
        {t("deleteWarning")}
      </span>
      <button
        onClick={() => { dismiss(RISK_KEYS.deleteFile); setShow(false); }}
        style={{ background: "transparent", border: "none", color: "#fca5a5", fontSize: 10, cursor: "pointer" }}
      >
        {t("dismiss")}
      </button>
    </div>
  );
}
