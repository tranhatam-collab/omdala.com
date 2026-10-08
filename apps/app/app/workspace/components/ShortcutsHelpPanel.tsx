// ─── ShortcutsHelpPanel — Keyboard shortcuts overlay ──────────────────────
"use client";

import * as React from "react";
import { useI18n } from "../hooks/useI18n";

interface ShortcutsHelpPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShortcutsHelpPanel({ isOpen, onClose }: ShortcutsHelpPanelProps) {
  const { t } = useI18n();
  if (!isOpen) return null;

  const shortcuts = [
    { key: "⌘ S", label: t("shortcutSave") },
    { key: "⌘ K", label: t("shortcutPalette") },
    { key: "⌘ ⇧ C", label: t("shortcutChat") },
    { key: "⌘ ⇧ T", label: t("shortcutTerminal") },
    { key: "⌘ ⇧ E", label: t("shortcutExplorer") },
    { key: "⌘ ,", label: t("shortcutSettings") },
    { key: "?", label: t("shortcutHelp") },
    { key: "⌘ N", label: t("shortcutNewFile") },
    { key: "⌘ W", label: t("shortcutCloseTab") },
  ];

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(2,6,15,0.7)",
        zIndex: 999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#0a1424",
          border: "1px solid rgba(126,242,255,0.2)",
          borderRadius: 10,
          width: "min(420px, 90vw)",
          maxHeight: "80vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
        }}
      >
        <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#7ef2ff" }}>⌨️ {t("shortcutsTitle")}</div>
          <span style={{ flex: 1 }} />
          <button onClick={onClose} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#a8b9d0", padding: "4px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer" }}>
            {t("close")}
          </button>
        </div>
        <div style={{ overflow: "auto", padding: 18 }}>
          {shortcuts.map((s) => (
            <div
              key={s.key}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 0",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              <span style={{ fontSize: 13, color: "#a8b9d0" }}>{s.label}</span>
              <span
                style={{
                  fontSize: 11,
                  fontFamily: "monospace",
                  color: "#7ef2ff",
                  background: "rgba(126,242,255,0.08)",
                  padding: "3px 8px",
                  borderRadius: 5,
                  border: "1px solid rgba(126,242,255,0.15)",
                }}
              >
                {s.key}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
