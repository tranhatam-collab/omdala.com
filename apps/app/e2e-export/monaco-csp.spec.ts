import { expect, test } from "@playwright/test";
import { watchCsp } from "../../../packages/ui/testing/csp";
import { injectWorkspaceFixture } from "../e2e/fixtures/workspace-fixture";

// WO-T3-19: the workspace editor is self-hosted and runs under the shipped CSP
// (script-src 'self' 'unsafe-inline'; worker-src 'self'; no 'unsafe-eval', no CDN).
test.describe("Monaco under the shipped CSP", () => {
  test("the response carries the production CSP without unsafe-eval or a CDN", async ({ request }) => {
    const response = await request.get("/workspace/");
    const csp = response.headers()["content-security-policy"] ?? "";
    expect(csp).toContain("worker-src 'self'");
    expect(csp).not.toContain("unsafe-eval");
    expect(csp).not.toMatch(/jsdelivr|cdn\./);
  });

  test("opens a file in the editor, loads only same-origin assets, and raises no CSP violation", async ({ page, baseURL }) => {
    const requests: string[] = [];
    page.on("request", (request) => requests.push(request.url()));
    const violations = await watchCsp(page);
    await page.route("**/v1/ai/models", (route) => route.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await injectWorkspaceFixture(page);
    await page.addInitScript(() => {
      try { localStorage.setItem("omcode:terms:accepted:v1", "true"); } catch {}
    });
    await page.goto("/workspace/?fixture=1");
    await expect(page.getByText("OMDALA Workspace")).toBeVisible({ timeout: 20000 });

    await page.getByText("package.json", { exact: true }).click();
    const editor = page.locator(".monaco-editor").first();
    await expect(editor).toBeVisible({ timeout: 30000 });
    await expect(editor.locator(".view-lines")).toContainText("test-project");

    // Typing exercises the editor worker (a worker blocked by worker-src would log a violation).
    await editor.locator(".view-lines").click();
    await page.keyboard.type("// ok");
    await expect(editor.locator(".view-lines")).toContainText("// ok");
    await page.waitForTimeout(1500);

    const origin = new URL(baseURL!).origin;
    // The only other origin is the app's own API (allowed by connect-src); no CDN for Monaco.
    const foreign = requests.filter((url) => /^https?:/.test(url) && ![origin, "https://api.omdala.com"].includes(new URL(url).origin));
    expect(foreign).toEqual([]);
    expect(requests.some((url) => url.includes("/monaco/vs/editor/editor.main.js"))).toBe(true);
    expect(await violations()).toEqual([]);
  });
});
