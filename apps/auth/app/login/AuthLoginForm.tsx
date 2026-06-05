"use client";

import { OMDALA_API_ORIGIN, OMDALA_INBOXES, resolveLanguage } from "@omdala/core";
import {
  AUTH_COPY,
  getMagicLinkSentMessage,
  pickBilingualValue,
} from "@omdala/ui";
import { useRouter, useSearchParams } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { ApiClientError, apiJsonRequest } from "@/lib/api-client";

const AUTH_GOOGLE_START_PATH = "/v1/auth/google/start";

function getAuthApiBase() {
  const env = process.env.NEXT_PUBLIC_AUTH_API_BASE;
  if (env) return env;
  if (process.env.NODE_ENV === "development") return "http://localhost:8787";
  return OMDALA_API_ORIGIN;
}

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
      const rawMessage =
        error instanceof ApiClientError
          ? error.message
          : error instanceof Error
            ? error.message
            : pickBilingualValue(language, copy.genericSendError);

      // Friendly message when mail service is down (502/522/503/504)
      const isMailUnavailable = /mail api|522|503|504|502|unreachable|timeout/i.test(rawMessage);
      const friendlyMessage = isMailUnavailable
        ? pickBilingualValue(language, {
            en: "Mail service is temporarily unavailable. Please retry shortly or contact support.",
            vi: "Dịch vụ gửi mail tạm thời không khả dụng. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.",
          })
        : rawMessage;

      setStatus({
        tone: "error",
        message: friendlyMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const googleStartUrl = `${getAuthApiBase()}${AUTH_GOOGLE_START_PATH}`;

  return (
    <>
      {/* Google OAuth */}
      <a className="auth-button auth-button--google" href={googleStartUrl}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
          <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
        </svg>
        {pickBilingualValue(language, { en: "Continue with Google", vi: "Tiếp tục bằng Google" })}
      </a>

      <div className="auth-divider">
        <span>{pickBilingualValue(language, { en: "or", vi: "hoặc" })}</span>
      </div>

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
