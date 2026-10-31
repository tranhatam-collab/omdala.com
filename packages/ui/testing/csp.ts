// Collects Content-Security-Policy violations in the page (type-only Playwright import).
import type { Page } from "@playwright/test";

export type CspViolation = { directive: string; blocked: string };

export async function watchCsp(page: Page): Promise<() => Promise<CspViolation[]>> {
  const consoleHits: string[] = [];
  page.on("console", (message) => {
    if (/Content Security Policy|Refused to/i.test(message.text())) consoleHits.push(message.text().slice(0, 200));
  });
  await page.addInitScript(() => {
    (window as unknown as { __csp: CspViolation[] }).__csp = [];
    document.addEventListener("securitypolicyviolation", (event) => {
      (window as unknown as { __csp: CspViolation[] }).__csp.push({
        directive: event.violatedDirective,
        blocked: event.blockedURI,
      });
    });
  });
  return async () => {
    const inPage = await page.evaluate(() => (window as unknown as { __csp?: CspViolation[] }).__csp ?? []);
    return [...inPage, ...consoleHits.map((text) => ({ directive: "console", blocked: text }))];
  };
}
