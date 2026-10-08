"use client";

import {
  resolveLanguage,
  resolvePublicOrigin,
  type OmdalaLanguage,
} from "@omdala/core";
import { AUTH_COPY, pickBilingualValue, useLocationSearchParam } from "@omdala/ui";
import { Suspense } from "react";
import { AuthLoginForm } from "./AuthLoginForm";

export default function LoginPage() {
  const language: OmdalaLanguage = resolveLanguage(useLocationSearchParam("lang"));
  const copy = AUTH_COPY.authHostLoginPage;
  const releaseEnvironment = process.env.NEXT_PUBLIC_RELEASE_ENVIRONMENT;
  const authHostname = new URL(resolvePublicOrigin(
    "auth",
    process.env.NEXT_PUBLIC_AUTH_ORIGIN,
    releaseEnvironment,
  )).hostname;
  const appHostname = new URL(resolvePublicOrigin(
    "app",
    process.env.NEXT_PUBLIC_APP_ORIGIN,
    releaseEnvironment,
  )).hostname;
  const apiHostname = new URL(resolvePublicOrigin(
    "api",
    process.env.NEXT_PUBLIC_AUTH_API_BASE,
    releaseEnvironment,
  )).hostname;

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
            <li>Host: {authHostname}</li>
            <li>{language === "vi" ? "Cookie phiên chỉ thuộc host" : "Session cookie is host-only on"}: {apiHostname}</li>
            <li>{language === "vi" ? "Chuỗi điều hướng" : "Redirect chain"}: {appHostname} -&gt; {authHostname} -&gt; {appHostname}</li>
            <li>{language === "vi" ? "Xác minh token qua" : "Token verification via"}: {apiHostname}</li>
            <li>{pickBilingualValue(language, copy.topologyItems.exchange)}</li>
          </ul>
        </aside>
      </section>
    </main>
  );
}
