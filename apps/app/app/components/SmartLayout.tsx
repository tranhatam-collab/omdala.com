// ─── Smart Layout — AI Command Palette + Glass Sidebar ─────────────────
"use client";

import * as React from "react";
import { AICommandPalette, SmartButton } from "@omdala/ui";
import { VI } from "@omdala/core";

interface SmartLayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { id: "dashboard", label: VI.nav.dashboard, icon: "⊞", href: "/dashboard" },
  { id: "nodes", label: VI.nav.nodes, icon: "◈", href: "/nodes" },
  { id: "resources", label: VI.nav.resources, icon: "▣", href: "/resources" },
  { id: "trust", label: VI.nav.trust, icon: "◉", href: "/trust" },
  // { id: "commitments", label: VI.nav.commitments, icon: "◊", href: "/commitments" },
  // { id: "analytics", label: VI.nav.analytics, icon: "◫", href: "/analytics" },
];

export function SmartLayout({ children }: SmartLayoutProps) {
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const commands = React.useMemo(
    () => [
      ...NAV_ITEMS.map((item) => ({
        id: item.id,
        label: item.label,
        description: `${VI.nav.open} ${item.label}`,
        icon: item.icon,
        section: "Điều hướng",
        action: () => {
          window.location.href = item.href;
          setPaletteOpen(false);
        },
      })),
      {
        id: "ai-complete",
        label: VI.ai.askAnything,
        description: VI.ai.suggestions,
        icon: "✦",
        section: "AI Assistant",
        action: () => {
          setPaletteOpen(false);
        },
      },
      {
        id: "logout",
        label: VI.nav.logout,
        description: VI.auth.logoutSuccess,
        icon: "→",
        section: "Hành động",
        action: () => {
          localStorage.removeItem("omcode:account");
          localStorage.removeItem("omcode:session-id");
          window.location.href = "/";
        },
      },
    ],
    [],
  );

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "var(--om-midnight, #060d1a)",
        fontFamily: "var(--font-sans, 'Inter', system-ui, sans-serif)",
      }}
    >
      {/* Sidebar */}
      <aside
        style={{
          width: sidebarCollapsed ? 72 : 260,
          flexShrink: 0,
          background: "rgba(10, 22, 40, 0.95)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          flexDirection: "column",
          padding: "20px 16px",
          transition: "width 300ms cubic-bezier(0.4,0,0.2,1)",
          position: "relative",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32, paddingLeft: 8 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "linear-gradient(135deg, #7ef2ff, #3d8bff)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 14,
              color: "#060d1a",
              flexShrink: 0,
            }}
          >
            OM
          </div>
          {!sidebarCollapsed && (
            <span style={{ fontWeight: 700, fontSize: 18, color: "#f7fbff", letterSpacing: "-0.02em" }}>
              OMDALA
            </span>
          )}
        </div>

        {/* Command Trigger */}
        <button
          onClick={() => setPaletteOpen(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 14px",
            borderRadius: 10,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#a8b9d0",
            fontSize: 13,
            cursor: "pointer",
            marginBottom: 20,
            transition: "all 200ms",
            width: "100%",
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLElement).style.background = "rgba(126,242,255,0.08)";
            (e.target as HTMLElement).style.borderColor = "rgba(126,242,255,0.2)";
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.background = "rgba(255,255,255,0.05)";
            (e.target as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
          }}
        >
          <span>⌘</span>
          {!sidebarCollapsed && (
            <>
              <span style={{ flex: 1, textAlign: "left" }}>{VI.ai.commandPlaceholder.slice(0, 20)}...</span>
              <kbd
                style={{
                  padding: "2px 6px",
                  borderRadius: 4,
                  background: "rgba(255,255,255,0.08)",
                  fontSize: 11,
                  fontFamily: "var(--font-mono, monospace)",
                }}
              >
                ⌘K
              </kbd>
            </>
          )}
        </button>

        {/* Nav Items */}
        <nav style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
          {NAV_ITEMS.map((item) => (
            <a
              key={item.id}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 14px",
                borderRadius: 10,
                color: "#a8b9d0",
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 500,
                transition: "all 200ms",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.background = "rgba(126,242,255,0.06)";
                el.style.color = "#f7fbff";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.background = "transparent";
                el.style.color = "#a8b9d0";
              }}
            >
              <span style={{ fontSize: 18, width: 24, textAlign: "center" }}>{item.icon}</span>
              {!sidebarCollapsed && <span>{item.label}</span>}
            </a>
          ))}
        </nav>

        {/* Toggle Sidebar */}
        <button
          onClick={() => setSidebarCollapsed((c) => !c)}
          style={{
            marginTop: "auto",
            padding: 8,
            borderRadius: 8,
            background: "rgba(255,255,255,0.05)",
            border: "none",
            color: "#6b7f99",
            cursor: "pointer",
            fontSize: 18,
            transition: "all 200ms",
          }}
        >
          {sidebarCollapsed ? "→" : "←"}
        </button>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, minWidth: 0, overflow: "auto" }}>
        {/* Topbar */}
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 32px",
            background: "rgba(6, 13, 26, 0.8)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "#f7fbff", margin: 0 }}>
              {VI.app.tagline}
            </h1>
            <p style={{ fontSize: 13, color: "#6b7f99", margin: "4px 0 0" }}>
              {VI.app.poweredBy}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <SmartButton variant="secondary" size="sm">
              {VI.nav.notifications}
            </SmartButton>
            <SmartButton variant="primary" size="sm">
              {VI.nav.profile}
            </SmartButton>
          </div>
        </header>

        {/* Page Content */}
        <div style={{ padding: 32 }}>{children}</div>
      </main>

      {/* AI Command Palette */}
      {paletteOpen && (
        <AICommandPalette
          commands={commands}
          locale="vi"
          onClose={() => setPaletteOpen(false)}
        />
      )}
    </div>
  );
}
