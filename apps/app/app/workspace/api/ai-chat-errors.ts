import { ApiClientError, isServiceUnavailableError } from "@/lib/api-client";

export type ChatLanguage = "en" | "vi";

const SECONDS_PER_DAY = 86400;

/** Seconds until the next UTC midnight, when the per-tenant daily cap resets. */
export function secondsUntilNextUtcMidnight(now: Date): number {
  const elapsed = now.getUTCHours() * 3600 + now.getUTCMinutes() * 60 + now.getUTCSeconds();
  return SECONDS_PER_DAY - elapsed;
}

function formatReset(resetAt: Date, lang: ChatLanguage): string {
  // The viewer's own clock and zone, with the zone named so the time is unambiguous.
  return new Intl.DateTimeFormat(lang === "vi" ? "vi-VN" : "en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(resetAt);
}

/**
 * A clear EN/VI message for the AI errors users can act on, or null when the error is not one of
 * them (the caller keeps its generic message).
 *
 * - 429 ai_tenant_cap_exceeded: the daily cap was reached; it resets at the next UTC midnight. The
 *   reset time comes from Retry-After when the browser can read it, otherwise it is computed.
 * - 402 subscription_inactive: an active subscription is required.
 * - 502/503/504 or a known unavailable code: temporarily unavailable.
 */
export function describeAiChatError(error: unknown, lang: ChatLanguage, now: Date = new Date()): string | null {
  if (!(error instanceof ApiClientError)) return null;

  if (error.code === "ai_tenant_cap_exceeded") {
    const seconds = error.retryAfterSeconds ?? secondsUntilNextUtcMidnight(now);
    const resetAt = new Date(now.getTime() + seconds * 1000);
    const when = formatReset(resetAt, lang);
    return lang === "vi"
      ? `Tài khoản đã dùng hết hạn mức AI trong ngày. Hạn mức được làm mới lúc ${when}.`
      : `This account has used its daily AI limit. The limit resets at ${when}.`;
  }

  if (error.code === "subscription_inactive") {
    return lang === "vi"
      ? "Cần có gói đăng ký đang hoạt động để dùng AI. Hãy kiểm tra gói của bạn trong Tài khoản."
      : "An active subscription is required to use AI. Check your plan in Account.";
  }

  if (error.code === "ai_cap_not_configured" || isServiceUnavailableError(error)) {
    return lang === "vi"
      ? "Dịch vụ AI tạm thời không khả dụng. Vui lòng thử lại sau."
      : "The AI service is temporarily unavailable. Please retry shortly.";
  }

  return null;
}
