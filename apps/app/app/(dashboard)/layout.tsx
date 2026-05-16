"use client";

import { APP_PRIMARY_NAV } from "@omdala/core";
import { resolveLanguage, type OmdalaLanguage } from "@omdala/core";
import { Suspense, useEffect, useState } from "react";
import { LocaleLink } from "../components/LocaleLink";
import { APP_COPY, t } from "@/lib/bilingual-copy";
import { DashboardAuthGate } from "./DashboardAuthGate";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [language, setLanguage] = useState<OmdalaLanguage>("en");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setLanguage(resolveLanguage(new URLSearchParams(window.location.search).get("lang")));
  }, []);

  return (
    <Suspense
      fallback={
        <main className="app-shell">
          <section className="dashboard-panel">
            <p className="app-eyebrow">{t(language, APP_COPY.layout.fallbackEyebrow)}</p>
            <h1>{t(language, APP_COPY.layout.fallbackTitle)}</h1>
          </section>
        </main>
      }
    >
      <DashboardAuthGate>
        <main className="app-shell dashboard-layout">
          <aside className="dashboard-sidebar">
            <section className="dashboard-card">
              <p className="app-eyebrow">{t(language, APP_COPY.layout.productSurface)}</p>
              <LocaleLink href="/dashboard" className="dashboard-brand">
                OMDALA App
              </LocaleLink>
            </section>

            <nav
              className="dashboard-card dashboard-nav"
              aria-label={t(language, APP_COPY.layout.appNavigation)}
            >
              {APP_PRIMARY_NAV.map((item) => {
                const itemLabel = APP_COPY.layout.navLabels[
                  item.label as keyof typeof APP_COPY.layout.navLabels
                ];

                return (
                  <LocaleLink key={item.href} href={item.href}>
                    {itemLabel ? t(language, itemLabel) : item.label}
                  </LocaleLink>
                );
              })}
            </nav>
          </aside>

          <section className="dashboard-main">{children}</section>
        </main>
      </DashboardAuthGate>
    </Suspense>
  );
}
