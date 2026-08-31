"use client";

import * as React from "react";
import { resolveLanguage, withLanguageParam } from "@omdala/core";
import { AICommandPalette, useLocationSearchParam } from "@omdala/ui";
import { LocaleLink } from "./LocaleLink";
import { APP_COPY, t } from "@/lib/bilingual-copy";

interface SmartLayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { id: "dashboard", labelKey: "Dashboard", shortLabel: "DB", href: "/dashboard" },
  { id: "brands", labelKey: "Brands", shortLabel: "BR", href: "/brands" },
  { id: "profile", labelKey: "Profile", shortLabel: "PF", href: "/profile" },
  { id: "settings", labelKey: "Settings", shortLabel: "ST", href: "/settings" },
  { id: "workspace", labelKey: "Workspace", shortLabel: "OM", href: "/workspace" },
] as const;

export function SmartLayout({ children }: SmartLayoutProps) {
  const language = resolveLanguage(useLocationSearchParam("lang"));
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
        label: t(language, APP_COPY.layout.navLabels[item.labelKey]),
        description: `${t(language, APP_COPY.layout.openLabel)} ${t(language, APP_COPY.layout.navLabels[item.labelKey])}`,
        section: t(language, APP_COPY.layout.navigationSection),
        action: () => {
          window.location.assign(withLanguageParam(item.href, language));
          setPaletteOpen(false);
        },
      })),
    ],
    [language],
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
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32, paddingLeft: 8 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
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
            <span style={{ fontWeight: 700, fontSize: 18, color: "#f7fbff", letterSpacing: 0 }}>
              OMDALA
            </span>
          )}
        </div>

        <button
          onClick={() => setPaletteOpen(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 14px",
            borderRadius: 8,
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
          <span aria-hidden="true">K</span>
          {!sidebarCollapsed && (
            <>
              <span style={{ flex: 1, textAlign: "left" }}>
                {t(language, APP_COPY.layout.appNavigation)}
              </span>
              <kbd
                style={{
                  padding: "2px 6px",
                  borderRadius: 4,
                  background: "rgba(255,255,255,0.08)",
                  fontSize: 11,
                  fontFamily: "var(--font-mono, monospace)",
                }}
              >
                Ctrl K
              </kbd>
            </>
          )}
        </button>

        <nav
          aria-label={t(language, APP_COPY.layout.appNavigation)}
          style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}
        >
          {NAV_ITEMS.map((item) => (
            <LocaleLink
              key={item.id}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 14px",
                borderRadius: 8,
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
              <span aria-hidden="true" style={{ fontSize: 12, width: 24, textAlign: "center" }}>
                {item.shortLabel}
              </span>
              {!sidebarCollapsed && (
                <span>{t(language, APP_COPY.layout.navLabels[item.labelKey])}</span>
              )}
            </LocaleLink>
          ))}
        </nav>

        <button
          onClick={() => setSidebarCollapsed((c) => !c)}
          aria-label={t(
            language,
            sidebarCollapsed
              ? APP_COPY.layout.expandNavigation
              : APP_COPY.layout.collapseNavigation,
          )}
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
          {sidebarCollapsed ? ">" : "<"}
        </button>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, minWidth: 0, overflow: "auto" }}>
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
              Omdala Operator
            </h1>
            <p style={{ fontSize: 13, color: "#6b7f99", margin: "4px 0 0" }}>
              {t(language, APP_COPY.layout.productSurface)}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <LocaleLink href="/settings" className="app-button app-button--ghost">
              {t(language, APP_COPY.layout.navLabels.Settings)}
            </LocaleLink>
            <LocaleLink href="/profile" className="app-button app-button--primary">
              {t(language, APP_COPY.layout.navLabels.Profile)}
            </LocaleLink>
          </div>
        </header>

        {/* Page Content */}
        <div style={{ padding: 32 }}>{children}</div>
      </main>

      {paletteOpen && (
        <AICommandPalette
          commands={commands}
          aiEnabled={false}
          locale={language === "vi" ? "vi" : "en"}
          onClose={() => setPaletteOpen(false)}
        />
      )}
    </div>
  );
}
