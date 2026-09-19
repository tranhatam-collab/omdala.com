import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import http from "node:http";
import assert from "node:assert/strict";
import { startServer } from "../server/index.mjs";
import { loadPlaywright } from "./playwright-runtime.mjs";
import { createSourceManifest, manifestDigest } from "./integrity.mjs";
import { startGatewayFixture } from "../tests/fixtures/gateway-fixture.mjs";

const { chromium, webkit } = loadPlaywright();
const moduleRoot = path.resolve(import.meta.dirname, "..");
const metadata = JSON.parse(
  await fs.readFile(path.join(moduleRoot, "package.json"), "utf8"),
);
const sourceDigest = manifestDigest(await createSourceManifest(moduleRoot));
const scratch = await fs.realpath(
  await fs.mkdtemp(path.join(os.tmpdir(), "omcode-browser-")),
);
const project = path.join(scratch, "omcode-e2e");
await fs.mkdir(project);
await fs.writeFile(
  path.join(project, "README.md"),
  "# OMCODE E2E\n\nLocal workspace fixture.\n",
);
await fs.writeFile(
  path.join(project, "App.tsx"),
  "import { useState } from 'react';\n\nexport function App() {\n  const [count, setCount] = useState(0);\n  return <button onClick={() => setCount(count + 1)}>{count}</button>;\n}\n",
);
await fs.writeFile(
  path.join(project, "package.json"),
  JSON.stringify({ name: "omcode-e2e", private: true }),
);
const runtime = await startServer({
  dataDirectory: path.join(scratch, "state"),
});
runtime.store.set("projects", [{ root: project, name: "omcode-e2e" }]);
let calls = 0;
const fixture = http.createServer(async (req, res) => {
  let input = "";
  for await (const chunk of req) input += chunk;
  const request = JSON.parse(input || "{}");
  res.setHeader("Content-Type", "application/json");
  if (req.url === "/models")
    return res.end(JSON.stringify({ data: [{ id: "fixture-model" }] }));
  calls++;
  const message = request.messages.some((m) => m.role === "tool")
    ? { role: "assistant", content: "Đã chuẩn bị bản sửa. Chờ bạn áp dụng." }
    : {
        role: "assistant",
        content: null,
        tool_calls: [
          {
            id: "write-1",
            type: "function",
            function: {
              name: "propose_edit",
              arguments: JSON.stringify({
                path: "agent-result.js",
                content: "console.log('OMCODE_E2E_OK');\n",
                reason: "Kiểm thử luồng AI và xác nhận bản sửa.",
              }),
            },
          },
        ],
      };
  res.end(JSON.stringify({ choices: [{ message }] }));
});
await new Promise((resolve) => fixture.listen(0, "127.0.0.1", resolve));
process.env.OMCODE_TEST_API_KEY_GATEWAY ||= "sk-aiagent-e2e-fixture-key";
const gateway = await startGatewayFixture();
runtime.store.set("providers", [
  {
    id: "fixture",
    name: "E2E fixture",
    model: "fixture-model",
    models: ["fixture-model"],
    baseUrl: `http://127.0.0.1:${fixture.address().port}`,
    status: "connected",
  },
  {
    id: "gateway",
    name: "Gateway fixture",
    kind: "iai-one",
    model: "iai-one/iris-3",
    models: [],
    baseUrl: gateway.baseUrl,
    tenantId: "omcode-e2e",
    workspaceId: "omcode-e2e-ws",
    credentialRevision: 0,
    status: "not_checked",
  },
]);
runtime.store.set("skills", [
  {
    id: "e2e",
    name: "E2E verification",
    description: "Browser workflow test fixture.",
    source: "test fixture",
    path: scratch,
    digest: "fixture",
  },
]);
const evidence = path.resolve("evidence");
await fs.mkdir(evidence, { recursive: true });
const results = [];
let browser;
try {
  for (const [engine, browserType] of [
    ["chromium", chromium],
    ["webkit", webkit],
  ]) {
    runtime.store.set("preferences", { theme: "light" });
    browser = await browserType.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${runtime.origin}/#${runtime.token}`);
    await page.getByRole("heading", { name: "OMCODE", exact: true }).waitFor();
    await page.getByText(metadata.version, { exact: true }).waitFor();
    await page.getByRole("button", { name: "App.tsx", exact: true }).click();
    const editor = page.locator(".cm-content");
    await editor.waitFor();
    await editor.fill(`export const edited = 'saved by browser ${engine}';\n`);
    await page.getByRole("button", { name: "Lưu tệp", exact: true }).click();
    await page
      .getByText("Đã lưu tệp và bản khôi phục", { exact: true })
      .waitFor();
    assert.match(
      await fs.readFile(path.join(project, "App.tsx"), "utf8"),
      /saved by browser/,
    );
    results.push({ engine, check: "edit-save-real-file", ok: true });
    const draftText = `export const draft = 'recover ${engine}';\n`;
    await editor.fill(draftText);
    await page.evaluate(() => window.omcodeFlushDraft());
    page.once("dialog", (dialog) => dialog.accept());
    await page.reload();
    await page.getByRole("button", { name: "Bản lưu", exact: true }).click();
    await page
      .getByRole("button", { name: "Mở bản nháp", exact: true })
      .click();
    await page.locator(".cm-content").waitFor();
    assert.equal(
      (await page.locator(".cm-content").innerText()).trimEnd(),
      draftText.trimEnd(),
    );
    assert.match(
      await fs.readFile(path.join(project, "App.tsx"), "utf8"),
      /saved by browser/,
    );
    await page.getByRole("button", { name: "Lưu tệp", exact: true }).click();
    await page
      .getByText("Đã lưu tệp và bản khôi phục", { exact: true })
      .waitFor();
    results.push({ engine, check: "draft-recovery-after-reload", ok: true });
    await page
      .getByRole("textbox", { name: "Lệnh terminal", exact: true })
      .fill("/bin/pwd");
    await page.getByRole("button", { name: "Chạy lệnh", exact: true }).click();
    await page
      .locator(".terminal-output")
      .filter({ hasText: project })
      .waitFor();
    results.push({ engine, check: "real-terminal", ok: true });
    await page
      .getByRole("textbox", { name: "Yêu cầu AI", exact: true })
      .fill("Tạo agent-result.js");
    await page
      .getByRole("button", { name: "Gửi yêu cầu AI", exact: true })
      .click();
    await page
      .getByText("Đã chuẩn bị bản sửa. Chờ bạn áp dụng.", { exact: true })
      .waitFor({ timeout: 20000 });
    await page.locator(".proposal summary").last().click();
    await page
      .getByRole("button", { name: "Áp dụng bản sửa", exact: true })
      .last()
      .click();
    await page
      .getByRole("button", { name: "Đã áp dụng", exact: true })
      .last()
      .waitFor();
    assert.match(
      await fs.readFile(path.join(project, "agent-result.js"), "utf8"),
      /OMCODE_E2E_OK/,
    );
    results.push({ engine, check: "agent-proposal-approval-disk", ok: true });
    await page
      .getByRole("textbox", { name: "Lệnh terminal", exact: true })
      .fill(`'${process.execPath}' agent-result.js`);
    await page.getByRole("button", { name: "Chạy lệnh", exact: true }).click();
    await page
      .locator(".terminal-output")
      .filter({ hasText: "OMCODE_E2E_OK" })
      .waitFor();
    results.push({ engine, check: "execute-agent-produced-file", ok: true });
    await page.screenshot({
      path: path.join(evidence, `${engine}-desktop.png`),
      fullPage: true,
    });
    await page.getByRole("button", { name: "Kỹ năng", exact: true }).click();
    await page
      .getByRole("textbox", { name: "Tìm kỹ năng", exact: true })
      .fill("E2E");
    await page.getByText("E2E verification", { exact: true }).waitFor();
    results.push({ engine, check: "skill-library", ok: true });
    await page.getByRole("button", { name: "Kết nối", exact: true }).click();
    await page
      .getByRole("heading", { name: "Kết nối AI & Tools", exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Kiểm tra E2E fixture", exact: true })
      .click();
    await page.getByText("1 model · Đã kết nối", { exact: true }).waitFor();
    results.push({ engine, check: "provider-model-health", ok: true });
    await page
      .getByRole("button", { name: "Kiểm tra Gateway fixture", exact: true })
      .click();
    await page.getByText("17 model · Đã kết nối", { exact: true }).waitFor();
    results.push({ engine, check: "gateway-catalog-17-chat-models", ok: true });
    await page.getByRole("button", { name: "Tệp", exact: true }).click();
    await page
      .getByRole("combobox", { name: "Nhà cung cấp AI", exact: true })
      .selectOption({ label: "Gateway fixture" });
    assert.equal(
      await page.locator('select[aria-label="Mô hình AI"] option').count(),
      17,
    );
    results.push({ engine, check: "gateway-model-selector-17", ok: true });
    await page
      .getByRole("textbox", { name: "Yêu cầu AI", exact: true })
      .fill("Đề xuất tạo agent-result.js");
    await page
      .getByRole("button", { name: "Gửi yêu cầu AI", exact: true })
      .click();
    await page
      .locator(".receipt-meta")
      .filter({ hasText: "read-back đã xác minh" })
      .first()
      .waitFor({ timeout: 20000 });
    await page
      .locator(".receipt-meta")
      .filter({ hasText: "ledger led_" })
      .first()
      .waitFor();
    results.push({ engine, check: "gateway-billing-readback", ok: true });
    await page
      .getByRole("combobox", { name: "Lịch sử phiên", exact: true })
      .selectOption({ index: 1 });
    await page
      .getByText("Đã chuẩn bị bản sửa. Chờ bạn áp dụng.", { exact: true })
      .first()
      .waitFor();
    results.push({
      engine,
      check: "session-history-after-navigation",
      ok: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("button", { name: "Agent", exact: true }).click();
    await page
      .getByRole("textbox", { name: "Yêu cầu AI", exact: true })
      .waitFor();
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      true,
    );
    await page.screenshot({
      path: path.join(evidence, `${engine}-mobile-agent.png`),
      fullPage: true,
    });
    await page
      .getByRole("button", { name: "Trình soạn thảo", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Hiện cây tệp", exact: true })
      .click();
    await page.getByRole("button", { name: "App.tsx", exact: true }).click();
    await page.locator(".cm-content").waitFor();
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      true,
    );
    await page.screenshot({
      path: path.join(evidence, `${engine}-mobile-editor.png`),
      fullPage: true,
    });
    results.push({
      engine,
      check: "mobile-editor-agent-navigation-no-overflow",
      ok: true,
    });
    await page
      .getByRole("button", { name: "Đổi giao diện", exact: true })
      .click();
    await page.waitForFunction(
      () => document.documentElement.dataset.theme === "dark",
    );
    assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
    await page.screenshot({
      path: path.join(evidence, `${engine}-dark.png`),
      fullPage: true,
    });
    assert.deepEqual(errors, []);
    results.push({ engine, check: "theme-and-no-uncaught-errors", ok: true });
    await browser.close();
    browser = null;
  }
  assert.ok(calls >= 4);
  console.log(
    JSON.stringify({ passed: results.length, results, scratch }, null, 2),
  );
  await fs.writeFile(
    path.join(evidence, "e2e-results.json"),
    JSON.stringify(
      {
        time: new Date().toISOString(),
        ok: true,
        sourceDigest,
        passed: results.length,
        results,
        scratch,
      },
      null,
      2,
    ),
  );
} catch (error) {
  console.error(error);
  await fs.writeFile(
    path.join(evidence, "e2e-failure.json"),
    JSON.stringify({ error: error.message, results }, null, 2),
  );
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  await runtime.close();
  await new Promise((resolve) => fixture.close(resolve));
  await gateway.close();
}
