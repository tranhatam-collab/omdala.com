import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { loadPlaywright } from "./playwright-runtime.mjs";
import { verifyCandidateBundle } from "./bundle-verifier.mjs";
import { assertReleaseReceipt } from "./release-receipt.mjs";
import {
  liveSelection,
  selectLiveProvider,
  assertLiveProposal,
  assertLiveBilling,
  LIVE_CONTENT,
  LIVE_FILE,
  LIVE_PROMPT,
} from "./live-safety.mjs";

const selection = liveSelection();
const { webkit } = loadPlaywright();
const moduleRoot = path.resolve(import.meta.dirname, "..");
const app = path.resolve(
  process.env.OMCODE_E2E_APP || path.join(moduleRoot, "release/OMCODE.app"),
);
const candidate = await verifyCandidateBundle(app, moduleRoot);
const releaseReceiptPath = path.resolve(
  process.env.OMCODE_RELEASE_RECEIPT ||
    path.join(moduleRoot, "evidence/release-verification.json"),
);
// Reject stale or mismatched releases before reading a credential or making requests.
const releaseReceipt = JSON.parse(
  await fs.readFile(releaseReceiptPath, "utf8"),
);
assertReleaseReceipt(releaseReceipt, candidate);
const bundledApp = path.join(app, "Contents/Resources/app");
const bundledNode = path.join(app, "Contents/Resources/runtime/node");
process.env.OMCODE_KEYCHAIN_PATH ||= path.join(
  app,
  "Contents/Resources/runtime/OMCODEKeychain",
);
const { checkProvider, isAiagentHost } = await import(
  pathToFileURL(path.join(bundledApp, "server/providers.mjs"))
);
const { startServer } = await import(
  pathToFileURL(path.join(bundledApp, "server/index.mjs"))
);
const providerState =
  process.env.OMCODE_PROVIDER_STATE ||
  path.join(os.homedir(), "Library/Application Support/OMCODE");
const source = new DatabaseSync(path.join(providerState, "omcode.sqlite"), {
  readOnly: true,
});
const providerRow = source
  .prepare("SELECT value FROM settings WHERE key = ?")
  .get("providers");
const providers = providerRow ? JSON.parse(providerRow.value) : [];
source.close();
const provider = selectLiveProvider(providers, selection);
const scratch = await fs.realpath(
  await fs.mkdtemp(path.join(os.tmpdir(), "omcode-live-e2e-")),
);
const project = path.join(scratch, "live-agent-test");
await fs.mkdir(project);
await fs.writeFile(
  path.join(project, "README.md"),
  "# OMCODE Live E2E\nUse only this isolated test project.\n",
);
const runtime = await startServer({
  dataDirectory: path.join(scratch, "state"),
});
runtime.store.set("projects", [{ root: project, name: "live-agent-test" }]);
runtime.store.set("providers", [provider]);
const checked = await checkProvider(runtime.store, provider.id);
if (checked.status !== "connected") {
  await runtime.close();
  throw new Error(checked.error);
}
try {
  selectLiveProvider([checked], selection);
  assert.equal(
    checked.model,
    selection.model,
    "Catalog refresh changed the model; no generation sent.",
  );
} catch (error) {
  await runtime.close();
  throw error;
}
const browser = await webkit.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
try {
  await page.goto(`${runtime.origin}/#${runtime.token}`);
  await page.getByRole("button", { name: "README.md", exact: true }).click();
  await page.locator(".cm-content").waitFor();
  await page
    .getByRole("button", { name: "Đính kèm tệp đang mở", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Yêu cầu AI", exact: true })
    .fill(LIVE_PROMPT);
  await page
    .getByRole("button", { name: "Gửi yêu cầu AI", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Xác nhận đúng payload và đích", exact: true })
    .click();
  await page.waitForFunction(
    () =>
      !!document.querySelector(".proposal summary") ||
      !!document.querySelector(".agent-panel .inline-error, .error-banner"),
    undefined,
    { timeout: 180000 },
  );
  const failure = page.locator(".agent-panel .inline-error, .error-banner");
  if (await failure.count()) throw new Error(await failure.first().innerText());
  await page.locator(".proposal summary").first().waitFor();
  const pendingSession = runtime.store.session(runtime.store.sessions()[0].id);
  const pendingMessage = pendingSession.messages.at(-1);
  assertLiveProposal(pendingMessage);
  assert.equal(pendingMessage.model, selection.model);
  if (
    provider.kind === "iai-one" ||
    isAiagentHost(new URL(provider.baseUrl).hostname)
  )
    assertLiveBilling(pendingMessage.billing);
  await page.locator(".proposal summary").first().click();
  await page
    .getByRole("button", { name: "Áp dụng bản sửa", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Đã áp dụng", exact: true })
    .first()
    .waitFor();
  const written = await fs.readFile(path.join(project, LIVE_FILE), "utf8");
  assert.equal(written, LIVE_CONTENT);
  await page
    .getByRole("textbox", { name: "Lệnh terminal", exact: true })
    .fill(`'${bundledNode}' ${LIVE_FILE}`);
  await page.getByRole("button", { name: "Chạy lệnh", exact: true }).click();
  await page.waitForFunction(
    () =>
      document
        .querySelector(".terminal-output")
        ?.textContent.includes("OMCODE_LIVE_E2E_OK"),
    undefined,
    { timeout: 10000 },
  );
  const session = runtime.store.sessions()[0];
  const data = runtime.store.session(session.id);
  assert.equal(data.messages.at(-1).proposals[0].status, "applied");
  const toolReceipts = data.messages.at(-1).toolReceipts;
  assert.ok(
    data.messages[0].attachments.includes("README.md") &&
      !toolReceipts.some(
        (receipt) => receipt.name === "read_file" && receipt.ok,
      ),
  );
  assert.ok(
    toolReceipts.some(
      (receipt) => receipt.name === "propose_edit" && receipt.ok,
    ),
  );
  assert.deepEqual(errors, []);
  await page.screenshot({
    path: path.resolve("evidence/live-ai-webkit.png"),
    fullPage: true,
  });
  const receipt = {
    time: new Date().toISOString(),
    app: candidate.app,
    version: candidate.version,
    sourceDigest: candidate.sourceDigest,
    bundleManifestDigest: candidate.bundleManifestDigest,
    provider: provider.id,
    model: provider.model,
    engine: "webkit",
    project,
    session: session.id,
    toolReceipts,
    billing: pendingMessage.billing || null,
    generationRequestLimit: 1,
    destination: provider.baseUrl,
    checks: [
      "real-provider-generation",
      "explicit-attachment-and-payload-approval",
      "real-propose-edit-tool",
      "exact-inert-fixture-before-approval-and-execution",
      "user-approved-write",
      "terminal-execution-of-generated-file",
      "durable-session",
      "no-uncaught-browser-errors",
    ],
    ok: true,
  };
  await fs.writeFile(
    "evidence/live-e2e.json",
    JSON.stringify(receipt, null, 2),
  );
  assertReleaseReceipt(releaseReceipt, candidate);
  // Live evidence is a separate run. Never mutate a previously accepted release receipt.
  console.log(JSON.stringify(receipt));
} catch (error) {
  await page.screenshot({
    path: path.resolve("evidence/live-ai-failure.png"),
    fullPage: true,
  });
  throw error;
} finally {
  await browser.close();
  await runtime.close();
}
