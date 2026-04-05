# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke-auth-dashboard.spec.ts >> dashboard redirects to login when session missing
- Location: e2e/smoke-auth-dashboard.spec.ts:13:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForURL: Test timeout of 30000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
============================================================
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e2]:
    - complementary [ref=e3]:
      - generic [ref=e4]:
        - paragraph [ref=e5]: Product Surface
        - link "OMDALA App" [ref=e6] [cursor=pointer]:
          - /url: /dashboard/
      - navigation "App navigation" [ref=e7]:
        - link "Dashboard" [ref=e8] [cursor=pointer]:
          - /url: /dashboard/
        - link "Nodes" [ref=e9] [cursor=pointer]:
          - /url: /nodes/
        - link "Resources" [ref=e10] [cursor=pointer]:
          - /url: /resources/
        - link "Offers" [ref=e11] [cursor=pointer]:
          - /url: /offers/
        - link "Requests" [ref=e12] [cursor=pointer]:
          - /url: /requests/
        - link "Profile" [ref=e13] [cursor=pointer]:
          - /url: /profile/
        - link "Settings" [ref=e14] [cursor=pointer]:
          - /url: /settings/
    - generic [ref=e15]:
      - generic [ref=e16]:
        - paragraph [ref=e17]: Dashboard Shell
        - heading "Welcome back, OMDALA Operator." [level=1] [ref=e18]
        - paragraph [ref=e19]: This dashboard is the next stable development step after the masterbrand lock. It creates the frame for real node, resource, trust, and activity modules.
      - generic [ref=e20]:
        - article [ref=e21]:
          - strong [ref=e22]: Session
          - paragraph [ref=e23]: Passwordless draft session loaded for the auth service contract.
        - article [ref=e24]:
          - strong [ref=e25]: Primary role
          - paragraph [ref=e26]: expert
        - article [ref=e27]:
          - strong [ref=e28]: Next modules
          - paragraph [ref=e29]: Nodes, resources, offers, requests, and trust summaries.
        - article [ref=e30]:
          - strong [ref=e31]: Nodes in shell
          - paragraph [ref=e32]: 2 structured nodes are ready for CRUD iteration.
        - article [ref=e33]:
          - strong [ref=e34]: Offer flow
          - paragraph [ref=e35]: 2 offer records now exist for create, detail, and edit flows.
        - article [ref=e36]:
          - strong [ref=e37]: Request flow
          - paragraph [ref=e38]: 2 request records now exist for create, detail, and edit flows.
      - generic [ref=e39]:
        - heading "Core workspaces" [level=2] [ref=e40]
        - generic [ref=e41]:
          - link "Open nodes" [ref=e42] [cursor=pointer]:
            - /url: /nodes/
          - link "Open resources" [ref=e43] [cursor=pointer]:
            - /url: /resources/
          - link "Open offers" [ref=e44] [cursor=pointer]:
            - /url: /offers/
          - link "Open requests" [ref=e45] [cursor=pointer]:
            - /url: /requests/
      - generic [ref=e46]:
        - heading "Primary node trust summary" [level=2] [ref=e47]
        - list [ref=e48]:
          - listitem [ref=e49]: "Level: established"
          - listitem [ref=e50]: "Score: 82"
          - listitem [ref=e51]: "Highlights: Verification is complete. 4 proof-backed signals already exist."
          - listitem [ref=e52]: "Blockers:"
      - generic [ref=e53]:
        - heading "Suggested next matches" [level=2] [ref=e54]
        - generic [ref=e55]:
          - article [ref=e56]:
            - strong [ref=e57]: "88"
            - heading "Package a stronger public offer" [level=3] [ref=e58]
            - paragraph [ref=e59]: Turn the clearest part of this node into a structured offer with proof and availability.
            - link "Follow next action" [ref=e61] [cursor=pointer]:
              - /url: /resources/new/
          - article [ref=e62]:
            - strong [ref=e63]: "84"
            - heading "Activate space capacity" [level=3] [ref=e64]
            - paragraph [ref=e65]: A space resource exists and can be converted into a booking-ready host workflow.
            - link "Follow next action" [ref=e67] [cursor=pointer]:
              - /url: /resources/
      - generic [ref=e68]:
        - article [ref=e69]:
          - paragraph [ref=e70]: Inbox
          - heading "Notifications" [level=2] [ref=e71]
          - list [ref=e72]:
            - listitem [ref=e73]:
              - strong [ref=e74]: Trust can move one level higher
              - text: — OMDALA Operator Node has enough activity to request one more verification proof this week.
            - listitem [ref=e75]:
              - strong [ref=e76]: Draft offer still needs packaging
              - text: — One offer is still in draft and should be tightened before broader distribution.
            - listitem [ref=e77]:
              - strong [ref=e78]: A collaboration match is ready for review
              - text: — A new match candidate aligns with current node trust and available capacity.
        - article [ref=e79]:
          - paragraph [ref=e80]: AI Layer
          - heading "Suggested actions" [level=2] [ref=e81]
          - list [ref=e82]:
            - listitem [ref=e83]:
              - strong [ref=e84]: planner
              - text: — Package the strongest resource into a premium outward offer.
              - link "Weekly strategy capacity is the clearest candidate for the next published offer from OMDALA Operator Node." [ref=e85] [cursor=pointer]:
                - /url: /offers/new/
            - listitem [ref=e86]:
              - strong [ref=e87]: operator
              - text: — Collect one more proof before wider distribution.
              - link "Strengthen trust before opening the next surface to restricted public traffic." [ref=e88] [cursor=pointer]:
                - /url: /resources/
            - listitem [ref=e89]:
              - strong [ref=e90]: analyst
              - text: — Review active requests and match them against current capacity.
              - link "Use request signals to decide whether to price for speed, trust, or fit." [ref=e91] [cursor=pointer]:
                - /url: /requests/
  - alert [ref=e92]
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | test("login screen submits and shows status", async ({ page }) => {
  4  |   await page.goto("/login?lang=en");
  5  | 
  6  |   await expect(page.locator("h1")).toContainText("Enter the OMDALA app");
  7  |   await page.fill('input[name="email"]', "operator@omdala.com");
  8  |   await page.click('button[type="submit"]');
  9  | 
  10 |   await expect(page.locator(".auth-status")).toBeVisible();
  11 | });
  12 | 
  13 | test("dashboard redirects to login when session missing", async ({ page }) => {
  14 |   await page.goto("/dashboard?lang=en");
> 15 |   await page.waitForURL(/\/login\?lang=en&next=%2Fdashboard/);
     |              ^ Error: page.waitForURL: Test timeout of 30000ms exceeded.
  16 |   await expect(page.locator("h1")).toContainText("Enter the OMDALA app");
  17 | });
  18 | 
```