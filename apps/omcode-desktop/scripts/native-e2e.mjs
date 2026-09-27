import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";

import { createStore } from "../server/store.mjs";
import { verifyCandidateBundle } from "./bundle-verifier.mjs";

const moduleRoot = path.resolve(import.meta.dirname, "..");
const app = path.resolve(
  process.env.OMCODE_E2E_APP || path.join(moduleRoot, "release/OMCODE.app"),
);
const binary = path.join(app, "Contents/MacOS/OMCODE");
const bundledNode = path.join(app, "Contents/Resources/runtime/node");
const candidate = await verifyCandidateBundle(app, moduleRoot);
const scratch = await fs.realpath(
  await fs.mkdtemp(path.join(os.tmpdir(), "omcode-native-e2e-")),
);
const project = path.join(scratch, "project");
const state = path.join(scratch, "state");
const receiptPath = path.join(scratch, "native-e2e.json");
await fs.mkdir(project);
await fs.writeFile(path.join(project, "README.md"), "# Native OMCODE E2E\n");

const fixture = http.createServer(async (request, response) => {
  let input = "";
  for await (const chunk of request) input += chunk;
  const body = JSON.parse(input || "{}");
  response.setHeader("Content-Type", "application/json");
  if (request.url === "/models")
    return response.end(JSON.stringify({ data: [{ id: "native-fixture" }] }));
  const toolResults = body.messages.filter(
    (message) => message.role === "tool",
  );
  let message;
  message = toolCall("edit", "propose_edit", {
    path: "hello-native.mjs",
    content: "console.log('OMCODE_NATIVE_E2E_OK');\n",
    reason: "Native WKWebView end-to-end verification.",
  });
  response.end(JSON.stringify({ choices: [{ message }] }));
});
await new Promise((resolve) => fixture.listen(0, "127.0.0.1", resolve));

const store = createStore(state);
store.set("projects", [{ root: project, name: "Native E2E" }]);
store.set("providers", [
  {
    id: "fixture",
    name: "Native fixture",
    baseUrl: `http://127.0.0.1:${fixture.address().port}`,
    model: "native-fixture",
    models: ["native-fixture"],
    status: "connected",
    generationStatus: "verified",
  },
]);
store.set("skills", []);
store.set("mcp", []);
store.close();

try {
  await fs.access(binary);
  await fs.access(bundledNode);
  const result = await runNative(binary, receiptPath, {
    ...process.env,
    OMCODE_DATA_DIR: state,
    OMCODE_NATIVE_E2E_COMMAND: `'${bundledNode}' hello-native.mjs`,
  });
  assert.equal(result.code, 0, result.stderr || result.stdout);
  const receipt = JSON.parse(await fs.readFile(receiptPath, "utf8"));
  assert.equal(receipt.ok, true, JSON.stringify(receipt));
  assert.equal(receipt.generatedFileExecuted, true);
  assert.equal(receipt.approvedWrite, true);
  assert.equal(receipt.navigationIdentityVerified, true);
  assert.deepEqual(receipt.errors, []);
  assert.match(
    await fs.readFile(path.join(project, "hello-native.mjs"), "utf8"),
    /OMCODE_NATIVE_E2E_OK/,
  );
  const evidence = {
    ...receipt,
    version: candidate.version,
    sourceDigest: candidate.sourceDigest,
    bundleManifestDigest: candidate.bundleManifestDigest,
    scratch,
  };
  await fs.mkdir(path.join(moduleRoot, "evidence"), { recursive: true });
  await fs.writeFile(
    path.join(moduleRoot, "evidence/native-e2e.json"),
    JSON.stringify(evidence, null, 2) + "\n",
  );
  console.log(JSON.stringify(evidence, null, 2));
} finally {
  await new Promise((resolve) => fixture.close(resolve));
}

function toolCall(id, name, args) {
  return {
    role: "assistant",
    content: null,
    tool_calls: [
      {
        id,
        type: "function",
        function: { name, arguments: JSON.stringify(args) },
      },
    ],
  };
}

function runNative(executable, output, env) {
  const timeout = Number(process.env.OMCODE_NATIVE_E2E_TIMEOUT_MS || 60000);
  return new Promise((resolve, reject) => {
    const child = spawn(executable, ["--native-e2e", output], {
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => (stdout += chunk));
    child.stderr.on("data", (chunk) => (stderr += chunk));
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error(`Native E2E timed out after ${timeout}ms.`));
    }, timeout);
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("exit", (code, signal) => {
      clearTimeout(timer);
      resolve({ code, signal, stdout, stderr });
    });
  });
}
