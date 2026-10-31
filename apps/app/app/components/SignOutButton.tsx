"use client";

import { resolveLanguage } from "@omdala/core";
import { useLocationSearchParam } from "@omdala/ui";
import { useState } from "react";
import { apiJsonRequest } from "@/lib/api-client";
import { buildAuthLoginUrl } from "@/lib/auth-redirect";
import { APP_COPY, t } from "@/lib/bilingual-copy";

export function SignOutButton() {
  const language = resolveLanguage(useLocationSearchParam("lang"));
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function signOut() {
    setIsSigningOut(true);
    try {
      await apiJsonRequest("/v1/auth/logout", { method: "POST" }, "Unable to sign out.");
    } catch {
      // The API clears the cookies when it can; the auth host re-checks the session either way.
    }
    window.location.replace(buildAuthLoginUrl(language, "/dashboard"));
  }

  return (
    <button
      type="button"
      className="app-button app-button--ghost"
      onClick={signOut}
      disabled={isSigningOut}
    >
      {t(language, isSigningOut ? APP_COPY.layout.signingOut : APP_COPY.layout.signOut)}
    </button>
  );
}
