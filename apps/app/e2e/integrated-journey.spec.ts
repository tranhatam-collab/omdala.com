import type { BrowserContext, Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

// Local-integrated journey: auth -> app against a real local API (T2's `local:stack`, persistent
// profile: sessions and magic links in a scratch PostgreSQL, mail to a loopback stub inbox).
// It is skipped unless the environment below is set, so normal runs stay hermetic.
//
//   E2E_LOCAL_API_URL      API base printed by local:stack ("API ready at ...")
//   E2E_LOCAL_MAIL_INBOX   mail inbox URL printed by local:stack ("mail inbox at ...")
//   E2E_LOCAL_AUTH_URL     a local server for the auth static export (apps/auth/e2e/serve-static.mjs)
//   E2E_BASE_URL           a local server for the app static export (apps/app/e2e/serve-static.mjs)
//
// The apps validate public origins strictly (HTTPS staging hosts only), so build both exports with
//   NEXT_PUBLIC_RELEASE_ENVIRONMENT=staging NEXT_PUBLIC_API_URL=https://api-staging.omdala.com
//   NEXT_PUBLIC_AUTH_ORIGIN=https://auth-staging.omdala.com NEXT_PUBLIC_APP_ORIGIN=https://app-staging.omdala.com
//   NEXT_PUBLIC_WEB_ORIGIN=https://staging.omdala.com NEXT_PUBLIC_BRAND_ORIGIN=https://brand-staging.omdala.com
//   NEXT_PUBLIC_AUTH_API_BASE=https://api-staging.omdala.com
// and this spec forwards the browser's requests for those hosts to the local servers. Nothing leaves
// the machine. The API rate-limits magic-link requests, so restart local:stack between runs.
// Then: E2E_BASE_URL=http://127.0.0.1:3017 pnpm e2e:app -g "local-integrated"
const API = process.env.E2E_LOCAL_API_URL?.replace(/\/+$/, "");
const MAIL = process.env.E2E_LOCAL_MAIL_INBOX;
const AUTH = process.env.E2E_LOCAL_AUTH_URL?.replace(/\/+$/, "");
const SEED_EMAIL = "local-dev@example.test";

test.skip(
  !API || !MAIL || !AUTH,
  "local-integrated journey needs E2E_LOCAL_API_URL, E2E_LOCAL_MAIL_INBOX and E2E_LOCAL_AUTH_URL (see the header of this spec)",
);

const PUBLIC = {
  api: "https://api-staging.omdala.com",
  auth: "https://auth-staging.omdala.com",
  app: "https://app-staging.omdala.com",
} as const;

function splitSetCookie(value: string): string[] {
  // Playwright joins repeated headers with newlines.
  return value.split("\n").filter(Boolean);
}

async function forwardPublicOrigins(context: BrowserContext, appLocalOrigin: string) {
  const targets: Record<string, string> = {
    [PUBLIC.api]: API!,
    [PUBLIC.auth]: AUTH!,
    [PUBLIC.app]: appLocalOrigin,
  };
  await context.route(/^https:\/\/(api|auth|app)-staging\.omdala\.com\//, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const base = targets[url.origin];
    const jar = await context.cookies(url.origin);
    const headers = { ...request.headers() };
    if (jar.length) headers.cookie = jar.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
    const response = await route.fetch({ url: `${base}${url.pathname}${url.search}`, headers });
    const setCookies = response
      .headersArray()
      .filter(({ name }) => name.toLowerCase() === "set-cookie")
      .flatMap(({ value }) => splitSetCookie(value));
    for (const raw of setCookies) {
      const [pair, ...attributes] = raw.split(";").map((part) => part.trim());
      const eq = pair.indexOf("=");
      const name = pair.slice(0, eq);
      const value = pair.slice(eq + 1);
      const maxAge = attributes.find((a) => /^max-age=/i.test(a))?.split("=")[1];
      const expired = value === "" || maxAge === "0";
      await context.addCookies([
        {
          name,
          value,
          url: url.origin,
          httpOnly: attributes.some((a) => /^httponly$/i.test(a)),
          secure: true,
          sameSite: ((): "Lax" | "Strict" | "None" => {
            const same = attributes.find((a) => /^samesite=/i.test(a))?.split("=")[1]?.toLowerCase();
            return same === "none" ? "None" : same === "strict" ? "Strict" : "Lax";
          })(),
          expires: expired ? 1 : -1,
        },
      ]);
    }
    const headersWithoutCookies = Object.fromEntries(
      response.headersArray().filter(({ name }) => name.toLowerCase() !== "set-cookie").map(({ name, value }) => [name, value]),
    );
    // Redirects (for example Next's trailing-slash 308) are followed here: Playwright does not
    // route the redirect target of a fulfilled response.
    // The local stack does not allow the staging public origins in CORS (finding for T2); the real
    // edge does, so answer as it would for the page that made the request.
    const origin = request.headers().origin;
    if (url.origin === PUBLIC.api && origin && !("access-control-allow-origin" in headersWithoutCookies)) {
      headersWithoutCookies["access-control-allow-origin"] = origin;
    }
    await route.fulfill({ response, headers: headersWithoutCookies });
  });
}

// A browser-side fetch goes through the forwarder like the app's own calls (context.request would not).
async function sessionStatus(page: Page): Promise<number> {
  return page.evaluate(async (api) => (await fetch(`${api}/v1/auth/session`, { credentials: "include" })).status, PUBLIC.api);
}

test.describe("local-integrated journey (real local API)", () => {
  test("request a magic link, follow it, reach the dashboard, sign out", async ({ page, context, request, baseURL }) => {
    await forwardPublicOrigins(context, new URL(baseURL!).origin);

    // 1. Request the magic link from the auth login page.
    await page.goto(`${PUBLIC.auth}/login/?lang=en&next=%2Fdashboard`);
    await page.locator('input[name="email"]').fill(SEED_EMAIL);
    await page.getByRole("button", { name: /send/i }).click();
    await expect(page.locator(".auth-status--success")).toBeVisible({ timeout: 20000 });

    // 2. Read the link from the loopback stub inbox (never a real mailbox).
    let token = "";
    await expect
      .poll(async () => {
        const inbox = (await (await request.get(MAIL!)).json()) as Array<{ to: string; html: string }>;
        const html = inbox.at(-1)?.html ?? "";
        token = /href="[^"]*[?&]token=([^&"]+)/.exec(html)?.[1] ?? "";
        return token;
      }, { timeout: 20000 })
      .not.toBe("");

    // 3. Follow it on the auth host: the token is exchanged and the browser lands on the dashboard.
    await page.goto(`${PUBLIC.auth}/login/?lang=en&next=%2Fdashboard&token=${token}`);
    await page.waitForURL(/app-staging\.omdala\.com\/dashboard/, { timeout: 30000 });
    await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible({ timeout: 30000 });
    expect(page.url()).not.toContain("token=");

    expect(await sessionStatus(page)).toBe(200);

    // 4. Sign out: the session is revoked and the dashboard sends the browser back to the auth host.
    await page.getByRole("button", { name: "Sign out" }).click();
    await page.waitForURL(/auth-staging\.omdala\.com\/login/, { timeout: 30000 });
    // The session was revoked server-side: the same cookies no longer authenticate.
    await page.goto(`${PUBLIC.app}/dashboard/?lang=en`);
    await page.waitForURL(/auth-staging\.omdala\.com\/login/, { timeout: 30000 });
  });
});
