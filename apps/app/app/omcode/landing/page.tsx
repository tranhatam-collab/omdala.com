// ─── OMCODE Landing Page — Marketing page giới thiệu toàn bộ tính năng ───
"use client";

import * as React from "react";

const FEATURES = [
  { icon: "🤖", title: "Verified AI Catalog", desc: "Danh sách model lấy từ AIAGENT contract 1.0.0 qua OMDALA API đã xác thực." },
  { icon: "⚡", title: "Single AI Authority", desc: "Mọi AI request đi qua OMDALA API và AIAGENT; không có direct-provider fallback." },
  { icon: "💬", title: "Reconciled AI Chat", desc: "Chỉ hiển thị kết quả sau khi run, signed receipt, usage và cost đã đối soát." },
  { icon: "/", title: "Slash Commands", desc: "/explain /test /refactor /fix /doc /commit — 1 click auto-fill context." },
  { icon: "@", title: "@-mentions", desc: "@filename trong chat để AI đọc thêm context từ file cụ thể." },
  { icon: "📝", title: "Code Apply + Diff", desc: "AI sinh code → xem diff → Apply vào file. Before/after preview." },
  { icon: "⌘I", title: "Inline AI", desc: "Chọn code → Ctrl+I → AI auto-fill context trong chat." },
  { icon: "📊", title: "Cost Dashboard", desc: "Theo dõi token và chi phí authoritative từ AIAGENT receipt theo ngày/tuần." },
  { icon: "🗨️", title: "Chat History", desc: "Lưu toàn bộ lịch sử chat, search, filter theo workspace." },
  { icon: "📁", title: "File System Access", desc: "Mở folder thật từ MacBook. Không qua server. Local-first 100%." },
  { icon: "🖥️", title: "Monaco Editor", desc: "VS Code-grade editor với syntax highlight, IntelliSense, error squiggles." },
  { icon: "🌳", title: "Git Native", desc: "Stage, commit, branch, diff — full git workflow trong IDE." },
  { icon: "📊", title: "Status Bar", desc: "Git branch, changes, file count, language, UTF-8, online indicator." },
  { icon: "🔑", title: "Protected API Gateway", desc: "Browser dùng phiên OMDALA; credential AIAGENT chỉ tồn tại trong secret store phía server." },
  { icon: "⚛️", title: "Project Detection", desc: "Auto-detect React, Next.js, Vue, Rust, Go, Python... + logo project." },
];

const SECURITY = [
  { icon: "🔒", title: "Local-First Workspace", desc: "File dự án ở trên máy; chỉ context người dùng chọn mới được gửi khi chủ động gọi AI." },
  { icon: "🔑", title: "No Browser AI Keys", desc: "Credential AIAGENT có scope nằm trong Cloudflare/GitHub secret store, không ở localStorage." },
  { icon: "⚠️", title: "Risk Acknowledgment", desc: "Terms of Service bắt buộc trước lần dùng đầu tiên. Terminal/file warnings." },
  { icon: "🛡️", title: "Permission Layer", desc: "Luồng duyệt rõ ràng cho thay đổi file và lệnh có ảnh hưởng." },
  { icon: "📜", title: "MIT Licensed", desc: "Open source core. Kiểm tra code bất cứ lúc nào. Không vendor lock-in." },
  { icon: "🔍", title: "Receipt-backed Audit", desc: "Chat history, code edits và cost log gắn với run/receipt đã đối soát." },
];

export default function OmcCodeLanding() {
  return (
    <div style={{ minHeight: "100vh", background: "#060d1a", color: "#dbe7f5", fontFamily: "system-ui, sans-serif" }}>
      {/* Hero */}
      <div style={{
        padding: "80px 24px 60px",
        textAlign: "center",
        background: "linear-gradient(135deg, #060d1a 0%, #0a192f 50%, #060d1a 100%)",
      }}>
        <div style={{
          width: 100, height: 100, borderRadius: 24,
          background: "linear-gradient(135deg, #7ef2ff, #5cd9ff)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 48, fontWeight: 800, color: "#04101f",
          margin: "0 auto 24px",
          boxShadow: "0 0 60px rgba(126,242,255,0.3)",
        }}>
          OM
        </div>
        <h1 style={{ fontSize: 42, fontWeight: 800, color: "#f7fbff", margin: "0 0 12px", letterSpacing: -1 }}>
          OMCODE
        </h1>
        <p style={{ fontSize: 18, color: "#6b7f99", maxWidth: 600, margin: "0 auto 32px", lineHeight: 1.6 }}>
          AI Code OS — local-first workspace with one verified AIAGENT authority, receipt-backed chat,
          code diff preview, cost tracking, and native Git.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <a href="/omcode" style={{
            padding: "14px 32px", borderRadius: 10, border: "none",
            background: "linear-gradient(135deg, #7ef2ff, #5cd9ff)",
            color: "#04101f", fontSize: 15, fontWeight: 700, textDecoration: "none",
            boxShadow: "0 4px 20px rgba(126,242,255,0.3)",
          }}>
            🚀 Launch OMCODE
          </a>
          <a href="#features" style={{
            padding: "14px 32px", borderRadius: 10, border: "1px solid rgba(126,242,255,0.3)",
            color: "#7ef2ff", fontSize: 15, fontWeight: 600, textDecoration: "none",
          }}>
            Explore Features
          </a>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", justifyContent: "center", gap: 40, padding: "40px 24px", flexWrap: "wrap" }}>
        {[
          { n: "1", l: "AI Authority" },
          { n: "14", l: "Project Types" },
          { n: "0", l: "Browser AI Keys" },
          { n: "100%", l: "Receipt Required" },
        ].map((s) => (
          <div key={s.l} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#7ef2ff" }}>{s.n}</div>
            <div style={{ fontSize: 12, color: "#6b7f99" }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Features */}
      <div id="features" style={{ padding: "60px 24px", maxWidth: 1200, margin: "0 auto" }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: "#f7fbff", textAlign: "center", marginBottom: 40 }}>
          ⚡ 15 Production Features
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {FEATURES.map((f) => (
            <div key={f.title} style={{
              padding: 20, borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(255,255,255,0.02)",
            }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{f.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#f7fbff", marginBottom: 6 }}>{f.title}</div>
              <div style={{ fontSize: 12, color: "#a8b9d0", lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Security */}
      <div style={{ padding: "60px 24px", maxWidth: 1200, margin: "0 auto" }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: "#f7fbff", textAlign: "center", marginBottom: 40 }}>
          🛡️ Security & Privacy First
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {SECURITY.map((s) => (
            <div key={s.title} style={{
              padding: 20, borderRadius: 10,
              border: "1px solid rgba(74,222,128,0.1)",
              background: "rgba(74,222,128,0.02)",
            }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#4ade80", marginBottom: 6 }}>{s.title}</div>
              <div style={{ fontSize: 12, color: "#a8b9d0", lineHeight: 1.5 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Plans */}
      <div style={{ padding: "60px 24px", maxWidth: 900, margin: "0 auto" }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: "#f7fbff", textAlign: "center", marginBottom: 40 }}>
          💳 Plans
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
          {[
            { name: "Free", price: "$0", color: "#6b7f99", features: ["Verified AIAGENT catalog", "Local-first workspace", "Basic chat", "File explorer", "Monaco editor", "Git panel", "Cost dashboard"] },
            { name: "Pro", price: "$9/mo", color: "#7ef2ff", features: ["Plan-scoped quota", "Receipt-backed AI", "Team sharing", "Advanced diff", "Export history", "Protected API gateway", "Usage ledger"] },
            { name: "Enterprise", price: "Custom", color: "#4ade80", features: ["Scoped workspace", "SSO / SAML", "Contracted SLA", "Isolated credentials", "Custom integrations", "Priority support", "Audit receipts"] },
          ].map((p) => (
            <div key={p.name} style={{
              padding: 24, borderRadius: 12,
              border: `1px solid ${p.color}30`,
              background: "rgba(255,255,255,0.02)",
              display: "flex", flexDirection: "column",
            }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: p.color }}>{p.name}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#f7fbff", margin: "8px 0" }}>{p.price}</div>
              <div style={{ flex: 1 }}>
                {p.features.map((f) => (
                  <div key={f} style={{ fontSize: 12, color: "#a8b9d0", padding: "4px 0", display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: p.color }}>✓</span> {f}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: "40px 24px", textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ fontSize: 12, color: "#6b7f99" }}>
          OMCODE v0.1 · Local-first AI Code OS · Angel Edu Tam Foundation · IAI ONE
        </div>
        <div style={{ fontSize: 11, color: "#6b7f99", marginTop: 8 }}>
          <a href="https://docs.omdala.com/omcode/terms" target="_blank" rel="noopener noreferrer" style={{ color: "#7ef2ff", textDecoration: "none" }}>Terms</a>
          {" · "}
          <a href="https://docs.omdala.com/omcode/guide" target="_blank" rel="noopener noreferrer" style={{ color: "#7ef2ff", textDecoration: "none" }}>Docs</a>
          {" · "}
          <a href="mailto:omcode@iai.one" style={{ color: "#7ef2ff", textDecoration: "none" }}>Contact</a>
        </div>
      </div>
    </div>
  );
}
