import { describe, expect, it } from "vitest";
import { ApiClientError } from "@/lib/api-client";
import { describeAiChatError, secondsUntilNextUtcMidnight } from "./ai-chat-errors";

const NOW = new Date("2026-10-31T20:30:00Z");

describe("secondsUntilNextUtcMidnight", () => {
  it("counts to the next UTC midnight", () => {
    expect(secondsUntilNextUtcMidnight(NOW)).toBe(3.5 * 3600);
    expect(secondsUntilNextUtcMidnight(new Date("2026-11-01T00:00:00Z"))).toBe(86400);
    expect(secondsUntilNextUtcMidnight(new Date("2026-11-01T23:59:59Z"))).toBe(1);
  });
});

describe("describeAiChatError", () => {
  const cap = (retryAfter: number | null = null) =>
    new ApiClientError("The daily AI usage limit for this account was reached.", "ai_tenant_cap_exceeded", 429, retryAfter);

  it("explains the daily cap in EN with a reset time", () => {
    const message = describeAiChatError(cap(), "en", NOW)!;
    expect(message).toMatch(/daily AI limit/);
    expect(message).toMatch(/resets at .*2026/);
  });

  it("explains the daily cap in VI with a reset time", () => {
    const message = describeAiChatError(cap(), "vi", NOW)!;
    expect(message).toMatch(/hạn mức AI trong ngày/);
    expect(message).toMatch(/làm mới lúc .*2026/);
  });

  it("uses Retry-After when the browser could read it", () => {
    const fromHeader = describeAiChatError(cap(60), "en", NOW)!;
    const computed = describeAiChatError(cap(null), "en", NOW)!;
    expect(fromHeader).not.toBe(computed);
  });

  it("explains an inactive subscription (402) in both languages", () => {
    const error = new ApiClientError("An active subscription is required to use AI.", "subscription_inactive", 402);
    expect(describeAiChatError(error, "en", NOW)).toMatch(/active subscription is required/i);
    expect(describeAiChatError(error, "vi", NOW)).toMatch(/gói đăng ký đang hoạt động/);
  });

  it("maps outages to a retry message and leaves other errors to the caller", () => {
    expect(describeAiChatError(new ApiClientError("x", "DATABASE_UNAVAILABLE", 503), "en", NOW)).toMatch(/temporarily unavailable/);
    expect(describeAiChatError(new ApiClientError("x", "ai_cap_not_configured", 503), "vi", NOW)).toMatch(/tạm thời không khả dụng/);
    expect(describeAiChatError(new ApiClientError("bad", "invalid_request", 400), "en", NOW)).toBeNull();
    expect(describeAiChatError(new Error("boom"), "en", NOW)).toBeNull();
  });
});
