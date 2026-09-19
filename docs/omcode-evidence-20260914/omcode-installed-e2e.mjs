import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { DatabaseSync } from "node:sqlite";
import assert from "node:assert/strict";

const home = process.env.HOME;
const app = path.join(home, "Applications/OMCODE.app");
const resources = path.join(app, "Contents/Resources");
const installation = JSON.parse(await fs.readFile(path.join(home, "Developer/OMCODE/installation-receipt.json"), "utf8"));
const source = path.join(installation.source, "apps/omcode-desktop");
const sha = (data) => createHash("sha256").update(data).digest("hex");
for (const entry of installation.sourceFiles)
  assert.equal(sha(await fs.readFile(path.join(source, entry.path))), entry.sha256, "Installed source hash: " + entry.path);
for (const name of await fs.readdir(path.join(source, "server")))
  assert.equal(sha(await fs.readFile(path.join(source, "server", name))), sha(await fs.readFile(path.join(resources, "app/server", name))), "Bundled backend hash: " + name);
assert.equal(sha(await fs.readFile(path.join(resources, "runtime/OMCODEKeychain"))), installation.keychainHelperSha256);
process.env.OMCODE_KEYCHAIN_PATH = path.join(resources, "runtime/OMCODEKeychain");
const { startServer } = await import(pathToFileURL(path.join(resources, "app/server/index.mjs")));
const db = new DatabaseSync(path.join(installation.data, "omcode.sqlite"), { readOnly: true });
const provider = JSON.parse(db.prepare("SELECT value FROM settings WHERE key=?").get("providers").value).find((p) => p.id === "google");
if (process.env.OMCODE_E2E_MODEL) {
  assert.ok(provider.models.includes(process.env.OMCODE_E2E_MODEL));
  provider.model = process.env.OMCODE_E2E_MODEL;
}
const mcp = JSON.parse(db.prepare("SELECT value FROM settings WHERE key=?").get("mcp").value);
const skills = JSON.parse(db.prepare("SELECT value FROM settings WHERE key=?").get("skills").value);
db.close();
const scratch = await fs.mkdtemp("/private/tmp/omcode-installed-e2e-");
const project = path.join(scratch, "project");
await fs.mkdir(project);
await fs.writeFile(path.join(project, "README.md"), "# Isolated installed OMCODE E2E\n");
const runtime = await startServer({ dataDirectory: path.join(scratch, "state") });
runtime.store.set("providers", [provider]);
runtime.store.set("mcp", mcp);
runtime.store.set("skills", skills);
runtime.store.set("projects", [{ root: project, name: "OMCODE E2E" }]);
const require = createRequire(import.meta.url);
const { webkit } = require(path.join(home, ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright"));
const browser = await webkit.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
try {
  await page.goto(runtime.origin + "/#" + runtime.token);
  await page.getByRole("textbox", { name: "Yêu cầu AI", exact: true }).fill("Dùng read_file đọc README.md, rồi propose_edit tạo duy nhất hello.mjs với nội dung console.log('OMCODE_INSTALLED_E2E_OK'); và dòng xuống dòng. Không chạy lệnh. Chờ tôi duyệt.");
  await page.getByRole("button", { name: "Gửi yêu cầu AI", exact: true }).click();
  await page.waitForFunction(() => !!document.querySelector(".proposal summary") || !!document.querySelector(".agent-panel .inline-error, .error-banner"), undefined, { timeout: 180000 });
  const failures = page.locator(".agent-panel .inline-error, .error-banner");
  if (await failures.count()) throw new Error(await failures.first().innerText());
  await page.locator(".proposal summary").first().click();
  await page.getByRole("button", { name: "Áp dụng bản sửa", exact: true }).first().click();
  await page.getByRole("button", { name: "Đã áp dụng", exact: true }).first().waitFor();
  assert.match(await fs.readFile(path.join(project, "hello.mjs"), "utf8"), /OMCODE_INSTALLED_E2E_OK/);
  await page.getByRole("textbox", { name: "Lệnh terminal", exact: true }).fill("'" + path.join(resources, "runtime/node") + "' hello.mjs");
  await page.getByRole("button", { name: "Chạy lệnh", exact: true }).click();
  await page.waitForFunction(() => document.querySelector(".terminal-output")?.textContent.includes("OMCODE_INSTALLED_E2E_OK"));
  const session = runtime.store.session(runtime.store.sessions()[0].id);
  const toolReceipts = session.messages.at(-1).toolReceipts;
  assert.ok(toolReceipts.some((r) => r.name === "read_file" && r.ok));
  assert.ok(toolReceipts.some((r) => r.name === "propose_edit" && r.ok));
  assert.deepEqual(errors, []);
  await page.screenshot({ path: "/private/tmp/omcode-installed-e2e.png", fullPage: true });
  const receipt = { time: new Date().toISOString(), ok: true, app, sourceDigest: installation.sourceDigest, nativeBinarySha256: installation.nativeBinarySha256, keychainHelperSha256: installation.keychainHelperSha256, engine: "webkit", provider: provider.id, model: provider.model, actualBundledBackend: true, actualBundledFrontend: true, actualBundledNode: process.execPath === path.join(resources, "runtime/node"), configuredMcp: mcp.length, importedSkills: skills.length, toolReceipts, approvedWrite: true, generatedFileExecuted: true, errors, scratch };
  await fs.writeFile("/private/tmp/omcode-installed-e2e.json", JSON.stringify(receipt, null, 2));
  console.log(JSON.stringify(receipt));
} catch (error) {
  await fs.writeFile("/private/tmp/omcode-installed-e2e-failure.json", JSON.stringify({ time: new Date().toISOString(), ok: false, error: error.message, configuredMcp: mcp.length, scratch }, null, 2));
  throw error;
} finally {
  await browser.close();
  await runtime.close();
}
