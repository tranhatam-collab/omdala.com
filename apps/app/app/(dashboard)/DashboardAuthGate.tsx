"use client";

import { resolveLanguage, type OmdalaLanguage } from "@omdala/core";
import { useEffect, useState } from "react";
import { hasValidServerSession } from "@/lib/api-client";
import { buildAuthLoginUrl } from "@/lib/auth-redirect";
import { APP_COPY, t } from "@/lib/bilingual-copy";

export function DashboardAuthGate({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [language, setLanguage] = useState<OmdalaLanguage>("en");

  useEffect(() => {
    void (async () => {
      const params =
        typeof window === "undefined"
          ? new URLSearchParams()
          : new URLSearchParams(window.location.search);
      const locale = resolveLanguage(params.get("lang"));
      setLanguage(locale);

      const valid = await hasValidServerSession();
      setIsAuthed(valid);
      setIsReady(true);

      if (!valid) {
        const currentPath =
          typeof window === "undefined"
            ? "/dashboard"
            : `${window.location.pathname || "/dashboard"}${window.location.search || ""}`;

        if (typeof window !== "undefined") {
          window.location.replace(buildAuthLoginUrl(locale, currentPath));
        }
      }
    })();
  }, []);

  if (!isReady || !isAuthed) {
    return (
      <main className="app-shell">
        <section className="dashboard-panel">
          <p className="app-eyebrow">{t(language, APP_COPY.authGate.eyebrow)}</p>
          <h1>{t(language, APP_COPY.authGate.title)}</h1>
          <p className="app-copy">{t(language, APP_COPY.authGate.body)}</p>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}
