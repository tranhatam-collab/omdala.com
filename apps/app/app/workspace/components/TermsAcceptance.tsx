// ─── TermsAcceptance — Modal bắt buộc đồng ý ToS lần đầu dùng ────────────
"use client";

import * as React from "react";

const TERMS_KEY = "omcode:terms:accepted:v1";

export function hasAcceptedTerms(): boolean {
  try {
    return localStorage.getItem(TERMS_KEY) === "true";
  } catch { return false; }
}

export function acceptTerms() {
  localStorage.setItem(TERMS_KEY, "true");
}

export function TermsAcceptance({ onAccept }: { onAccept: () => void }) {
  const [scrolled, setScrolled] = React.useState(false);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(2,6,15,0.9)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          background: "#0a1424",
          border: "1px solid rgba(239,68,68,0.3)",
          borderRadius: 12,
          width: "min(600px, 95vw)",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 24px 80px rgba(0,0,0,0.8)",
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid rgba(239,68,68,0.2)",
            background: "rgba(239,68,68,0.05)",
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 800, color: "#ef4444" }}>
            ⚠️ Terms of Service & Risk Acknowledgment
          </div>
          <div style={{ fontSize: 11, color: "#6b7f99", marginTop: 4 }}>
            You must read and accept before using OMCODE. This is a local-first tool with direct filesystem access.
          </div>
        </div>

        <div
          onScroll={(e) => {
            const el = e.currentTarget;
            if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) {
              setScrolled(true);
            }
          }}
          style={{
            overflow: "auto",
            padding: 20,
            flex: 1,
            color: "#dbe7f5",
            fontSize: 12,
            lineHeight: 1.6,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: "#f7fbff", marginBottom: 12 }}>
            🚨 CRITICAL RISKS — READ CAREFULLY
          </div>

          <RiskSection
            title="1. Direct File System Access"
            content="OMCODE can read, create, modify, and DELETE files on your computer. AI agents and commands may perform bulk operations. Always use Git for version control."
          />
          <RiskSection
            title="2. Terminal Command Execution"
            content="The integrated terminal runs shell commands with YOUR user privileges. AI-generated commands (including /commit, /fix, /refactor) may execute destructive operations like rm -rf. REVIEW EVERY COMMAND before pressing Enter."
          />
          <RiskSection
            title="3. AI Code Apply Overwrites Files"
            content="Clicking 'Apply' on AI-generated code blocks will OVERWRITE your file without automatic backup. The AI may hallucinate APIs, generate non-compiling code, or introduce security vulnerabilities."
          />
          <RiskSection
            title="4. No Warranty & Limited Liability"
            content="OMCODE is provided AS IS. Angel Edu Tam Foundation and IAI ONE disclaim all liability for data loss, corruption, or security breaches. Maximum liability is capped at $100 USD."
          />
          <RiskSection
            title="5. API Keys in localStorage"
            content="Your API keys are stored in browser localStorage. They are never sent to our servers, but any script on localhost:3000 can access them. Rotate keys regularly."
          />
          <RiskSection
            title="6. Backup Responsibility"
            content="You are SOLELY responsible for backing up your data. We strongly recommend: (a) Initialize Git in every project, (b) Commit before AI operations, (c) Use Time Machine or equivalent."
          />

          <div style={{ marginTop: 16, padding: 12, background: "rgba(126,242,255,0.05)", border: "1px solid rgba(126,242,255,0.15)", borderRadius: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#7ef2ff" }}>✅ Best Practices</div>
            <ul style={{ fontSize: 11, color: "#a8b9d0", marginTop: 6, paddingLeft: 16 }}>
              <li>Always initialize Git before opening a project in OMCODE</li>
              <li>Review every AI-generated command before execution</li>
              <li>Test AI code in a separate branch before applying to main</li>
              <li>Keep regular backups of important projects</li>
              <li>Use separate API keys for development vs production</li>
            </ul>
          </div>

          <div style={{ marginTop: 16, fontSize: 11, color: "#6b7f99" }}>
            Full legal terms: <code style={{ color: "#7ef2ff" }}>docs/OMCODE_TERMS_OF_SERVICE.md</code>
          </div>
        </div>

        <div
          style={{
            padding: "14px 20px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          {!scrolled && (
            <span style={{ fontSize: 10, color: "#f59e0b" }}>⬆️ Scroll to bottom to enable</span>
          )}
          <span style={{ flex: 1 }} />
          <button
            disabled={!scrolled}
            onClick={() => {
              acceptTerms();
              onAccept();
            }}
            style={{
              padding: "10px 24px",
              borderRadius: 8,
              border: "none",
              background: scrolled
                ? "linear-gradient(135deg,#ef4444,#dc2626)"
                : "rgba(255,255,255,0.1)",
              color: scrolled ? "#fff" : "#6b7f99",
              fontSize: 12,
              fontWeight: 700,
              cursor: scrolled ? "pointer" : "not-allowed",
            }}
          >
            {scrolled ? "I Understand the Risks & Agree to Terms" : "Scroll down to agree"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RiskSection({ title, content }: { title: string; content: string }) {
  return (
    <div
      style={{
        marginBottom: 12,
        padding: 10,
        background: "rgba(239,68,68,0.03)",
        border: "1px solid rgba(239,68,68,0.1)",
        borderRadius: 6,
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 700, color: "#ef4444", marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 11, color: "#a8b9d0" }}>{content}</div>
    </div>
  );
}
