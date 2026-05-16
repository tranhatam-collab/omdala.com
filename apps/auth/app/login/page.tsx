"use client";

import { resolveLanguage, type OmdalaLanguage } from "@omdala/core";
import { AUTH_COPY, pickBilingualValue } from "@omdala/ui";
import { Suspense } from "react";
import { useEffect, useState } from "react";
import { AuthLoginForm } from "./AuthLoginForm";

export default function LoginPage() {
  const [language, setLanguage] = useState<OmdalaLanguage>("en");
  const copy = AUTH_COPY.authHostLoginPage;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setLanguage(resolveLanguage(new URLSearchParams(window.location.search).get("lang")));
  }, []);

  return (
    <main className="auth-shell">
      <section className="auth-grid">
        <article className="auth-panel">
          <p className="auth-eyebrow">{pickBilingualValue(language, copy.eyebrow)}</p>
          <h1>{pickBilingualValue(language, copy.title)}</h1>
          <p className="auth-copy">{pickBilingualValue(language, copy.body)}</p>

          <Suspense fallback={<p className="auth-copy">{pickBilingualValue(language, copy.preparing)}</p>}>
            <AuthLoginForm />
          </Suspense>
        </article>

        <aside className="auth-panel">
          <p className="auth-eyebrow">{pickBilingualValue(language, copy.topology)}</p>
          <ul className="auth-list">
            <li>{pickBilingualValue(language, copy.topologyItems.host)}</li>
            <li>{pickBilingualValue(language, copy.topologyItems.cookieDomain)}</li>
            <li>{pickBilingualValue(language, copy.topologyItems.redirectChain)}</li>
            <li>{pickBilingualValue(language, copy.topologyItems.tokenVerification)}</li>
            <li>{pickBilingualValue(language, copy.topologyItems.exchange)}</li>
          </ul>
        </aside>
      </section>
    </main>
  );
}
