/**
 * Market Resolver
 * Detects market from browser locale, persists choice, handles switching.
 */

export type Market = "en" | "vi";

interface LocaleMapping {
  browserLocalePrefix: string;
  market: Market;
  currency: "USD" | "VND";
  language: "en" | "vi";
}

const LOCALE_MAP: LocaleMapping[] = [
  { browserLocalePrefix: "vi", market: "vi", currency: "VND", language: "vi" },
  { browserLocalePrefix: "en", market: "en", currency: "USD", language: "en" },
];

const STORAGE_KEY = "omdala_market";
const COOKIE_NAME = "omdala_market";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export function detectMarketFromBrowser(acceptLanguage?: string | null): Market {
  const lang = (acceptLanguage ?? "en").toLowerCase();
  // Check vi first (more specific)
  if (lang.startsWith("vi")) return "vi";
  return "en";
}

export function getMarketConfig(market: Market) {
  const found = LOCALE_MAP.find((m) => m.market === market);
  if (!found) throw new Error(`Unknown market: ${market}`);
  return found;
}

// ─── Client-side persistence ─────────────────────────────────

export function persistMarket(market: Market): void {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(STORAGE_KEY, market);
  }
  if (typeof document !== "undefined") {
    document.cookie = `${COOKIE_NAME}=${market};path=/;max-age=${COOKIE_MAX_AGE}`;
  }
}

export function loadPersistedMarket(): Market | null {
  if (typeof localStorage !== "undefined") {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "vi") return stored;
  }
  return null;
}

export function resolveMarket(
  browserLocale?: string | null,
  forceDefault?: Market
): Market {
  // 1. Force override (for testing or admin config)
  if (forceDefault) return forceDefault;

  // 2. User-persisted choice
  const persisted = loadPersistedMarket();
  if (persisted) return persisted;

  // 3. Browser detection
  return detectMarketFromBrowser(browserLocale);
}

// ─── Currency formatter ──────────────────────────────────────

export function formatPrice(amount: number, currency: "USD" | "VND", locale?: string): string {
  const loc = locale ?? (currency === "VND" ? "vi-VN" : "en-US");
  return new Intl.NumberFormat(loc, {
    style: "currency",
    currency,
    minimumFractionDigits: currency === "VND" ? 0 : 2,
    maximumFractionDigits: currency === "VND" ? 0 : 2,
  }).format(amount);
}

export function formatEffectiveMonthly(price: number, currency: "USD" | "VND", locale?: string): string {
  const loc = locale ?? (currency === "VND" ? "vi-VN" : "en-US");
  const suffix = currency === "VND" ? "/tháng" : "/mo";
  return new Intl.NumberFormat(loc, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price) + suffix;
}
