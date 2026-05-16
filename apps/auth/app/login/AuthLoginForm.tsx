"use client";

import { OMDALA_INBOXES, resolveLanguage } from "@omdala/core";
import {
  AUTH_COPY,
  getMagicLinkSentMessage,
  pickBilingualValue,
} from "@omdala/ui";
import { useRouter, useSearchParams } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { ApiClientError, apiJsonRequest } from "@/lib/api-client";

type StatusTone = "error" | "idle" | "info" | "success";

function normalizeRedirectPath(value: string | null, fallback: string) {
  if (!value || !value.startsWith("/")) {
    return fallback;
  }

  return value;
}

export function AuthLoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const language = resolveLanguage(searchParams.get("lang"));
  const verifiedTokenRef = useRef<string | null>(null);
  const copy = AUTH_COPY.magicLinkForm;

  const [email, setEmail] = useState("operator@omdala.com");
  const [redirectTo, setRedirectTo] = useState(
    normalizeRedirectPath(searchParams.get("next"), "/dashboard"),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ message: string; tone: StatusTone }>({
    message: "",
    tone: "idle",
  });

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token || verifiedTokenRef.current === token) {
      return;
    }

    verifiedTokenRef.current = token;
    const nextPath = normalizeRedirectPath(
      searchParams.get("next"),
      redirectTo,
    );
    setStatus({
      tone: "info",
      message: pickBilingualValue(language, copy.verifying),
    });

    void (async () => {
      try {
        const data = await apiJsonRequest<{
          authenticated: boolean;
          redirectTo: string;
        }>(
          "/v1/auth/session/exchange",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token, next: nextPath }),
          },
          pickBilingualValue(language, copy.verifyError),
        );

        setStatus({
          tone: "success",
          message: pickBilingualValue(language, copy.verified),
        });
        router.replace(`https://app.omdala.com${data.redirectTo}`);
      } catch (error) {
        setStatus({
          tone: "error",
          message:
            error instanceof ApiClientError
              ? error.message
              : error instanceof Error
                ? error.message
                : pickBilingualValue(language, copy.invalidLink),
        });
      }
    })();
  }, [language, redirectTo, router, searchParams]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus({
      tone: "info",
      message: pickBilingualValue(language, copy.sending),
    });

    try {
      await apiJsonRequest(
        "/v1/auth/magic-link/request",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            redirectTo: normalizeRedirectPath(redirectTo, "/dashboard"),
          }),
        },
        pickBilingualValue(language, copy.sendError),
      );

      setStatus({
        tone: "success",
        message: pickBilingualValue(
          language,
          getMagicLinkSentMessage(OMDALA_INBOXES.noreply),
        ),
      });
    } catch (error) {
      setStatus({
        tone: "error",
        message:
          error instanceof ApiClientError
            ? error.message
            : error instanceof Error
              ? error.message
              : pickBilingualValue(language, copy.genericSendError),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          {pickBilingualValue(language, copy.email)}
          <input
            type="email"
            name="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="operator@omdala.com"
            required
          />
        </label>
        <label>
          {pickBilingualValue(language, copy.redirect)}
          <input
            type="text"
            name="redirectTo"
            value={redirectTo}
            onChange={(event) => setRedirectTo(event.target.value)}
          />
        </label>
        <button type="submit" className="auth-button" disabled={isSubmitting}>
          {isSubmitting
            ? pickBilingualValue(language, copy.sendingShort)
            : pickBilingualValue(language, copy.send)}
        </button>
      </form>

      {status.message ? (
        <p className={`auth-status auth-status--${status.tone}`}>
          {status.message}
        </p>
      ) : null}
    </>
  );
}
