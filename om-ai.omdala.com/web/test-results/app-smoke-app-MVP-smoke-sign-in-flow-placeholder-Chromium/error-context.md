# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app-smoke.spec.ts >> app MVP smoke: sign in flow placeholder
- Location: web/e2e/app-smoke.spec.ts:3:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Send magic link')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=Send magic link')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e2]:
    - generic [ref=e3]:
      - paragraph [ref=e4]: Authenticated Surface
      - heading "OMDALA App" [level=1] [ref=e5]
      - paragraph [ref=e6]: This surface is for logged-in operators working with nodes, resources, trust, and action flows. Use the auth entry points below to continue the next build phase.
      - generic [ref=e7]:
        - link "Log in" [ref=e8] [cursor=pointer]:
          - /url: /login/
        - link "Create account" [ref=e9] [cursor=pointer]:
          - /url: /signup/
      - generic [ref=e10]:
        - link "Open dashboard shell" [ref=e11] [cursor=pointer]:
          - /url: /dashboard/
        - link "Back to omdala.com" [ref=e12] [cursor=pointer]:
          - /url: https://omdala.com
  - alert [ref=e13]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('app MVP smoke: sign in flow placeholder', async ({ page }) => {
  4  |   await page.goto('/');
  5  |   // Expect sign-in UI present on web app
> 6  |   await expect(page.locator('text=Send magic link')).toBeVisible();
     |                                                      ^ Error: expect(locator).toBeVisible() failed
  7  |   await page.fill('input[placeholder="you@domain.com"]', 'verify@app.omdala.com');
  8  |   // Intercept magic-link request
  9  |   const [response] = await Promise.all([
  10 |     page.waitForResponse((resp) => resp.url().includes('/v1/auth/magic-link/request') && resp.status() === 201),
  11 |     page.click('text=Send magic link'),
  12 |   ]);
  13 |   // Ensure response ok
  14 |   expect(response.ok()).toBeTruthy();
  15 | });
  16 | 
```