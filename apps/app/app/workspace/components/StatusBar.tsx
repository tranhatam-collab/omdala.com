// ─── StatusBar — Bottom status bar như VS Code ────────────────────────────
"use client";

import * as React from "react";
import type { GitStatus } from "../hooks/useGit";

interface StatusBarProps {
  gitBranch?: string | null;
  gitStatus?: GitStatus[];
  openFilesCount: number;
  activeFilePath?: string | null;
  bottomPanel: "terminal" | "git" | null;
}

export function StatusBar({
  gitBranch,
  gitStatus,
  openFilesCount,
  activeFilePath,
  bottomPanel,
}: StatusBarProps) {
  const changes = gitStatus?.filter((s) => s.status !== "untracked").length ?? 0;
  const lang = activeFilePath?.split(".").pop()?.toUpperCase() ?? "—";

  return (
    <div
      style={{
        height: 24,
        borderTop: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(6,13,26,0.95)",
        display: "flex",
        alignItems: "center",
        padding: "0 12px",
        fontSize: 11,
        color: "#6b7f99",
        gap: 16,
      }}
    >
      {/* Left: Git */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {gitBranch ? (
          <>
            <span style={{ color: "#7ef2ff" }}> {gitBranch}</span>
            {changes > 0 && (
              <span
                style={{
                  background: "rgba(251,191,36,0.15)",
                  color: "#fbbf24",
                  padding: "1px 5px",
                  borderRadius: 4,
                  fontSize: 10,
                }}
              >
                {changes} change{changes > 1 ? "s" : ""}
              </span>
            )}
          </>
        ) : (
          <span>— no git</span>
        )}
      </div>

      <span style={{ flex: 1 }} />

      {/* Center: indicators */}
      {bottomPanel && (
        <span style={{ color: "#7ef2ff" }}>
          {bottomPanel === "terminal" ? "🖥 Terminal" : "🌿 Git"}
        </span>
      )}

      <span style={{ flex: 1 }} />

      {/* Right: file info */}
      <span>{openFilesCount} file{openFilesCount !== 1 ? "s" : ""} open</span>
      <span>{lang}</span>
      <span>UTF-8</span>
      <span style={{ color: "#4ade80" }}>● Online</span>
      <span style={{ color: "#7ef2ff", fontWeight: 600 }}>OMCODE v0.1</span>
    </div>
  );
}
