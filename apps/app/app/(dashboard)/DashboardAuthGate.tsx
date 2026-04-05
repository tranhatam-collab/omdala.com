"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { hasValidClientSession } from "@/lib/session-client";

export function DashboardAuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    const valid = hasValidClientSession();
    setIsAuthed(valid);
    setIsReady(true);

    if (!valid) {
      const currentPath =
        typeof window === "undefined"
          ? "/dashboard"
          : window.location.pathname || "/dashboard";
      const params =
        typeof window === "undefined"
          ? new URLSearchParams()
          : new URLSearchParams(window.location.search);
      const lang = params.get("lang");
      const query = new URLSearchParams();
      if (lang) {
        query.set("lang", lang);
      }
      query.set("next", currentPath);
      router.replace(`/login?${query.toString()}`);
    }
  }, [router]);

  if (!isReady || !isAuthed) {
    return (
      <main className="app-shell">
        <section className="dashboard-panel">
          <p className="app-eyebrow">Session Check</p>
          <h1>Checking your operator session...</h1>
          <p className="app-copy">
            Redirecting to login if the current session is missing or expired.
          </p>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}
