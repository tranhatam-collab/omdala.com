import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";

const [script, name] = process.argv.slice(2);
if (
  !/^[a-z0-9-]+$/.test(name || "") ||
  !/^scripts\/[a-z0-9-]+\.mjs$/.test(script || "")
)
  throw new Error("Invalid evidence command");
const root = path.resolve(import.meta.dirname, "..");
const runId = process.env.OMCODE_VERIFY_RUN_ID || randomUUID();
const receiptPath =
  name === "release-verification" && process.env.OMCODE_RELEASE_RECEIPT
    ? path.resolve(process.env.OMCODE_RELEASE_RECEIPT)
    : path.join(root, "evidence", `${name}.json`);
const archive = path.join(root, "evidence/runs", runId, `${name}.json`);
await fs.mkdir(path.dirname(archive), { recursive: true });
await fs.mkdir(path.dirname(receiptPath), { recursive: true });
const base = {
  schemaVersion: 2,
  runId,
  startedAt: new Date().toISOString(),
  sourceHead: spawnSync("git", ["rev-parse", "HEAD"], {
    cwd: root,
    encoding: "utf8",
  }).stdout.trim(),
  command: [process.execPath, script],
};
async function write(receipt) {
  const text = JSON.stringify(receipt, null, 2) + "\n";
  await fs.writeFile(archive, text);
  const temporary = receiptPath + "." + runId + ".tmp";
  await fs.writeFile(temporary, text);
  await fs.rename(temporary, receiptPath);
}
await write({ ...base, status: "RUNNING", ok: false });
const child = spawn(process.execPath, [script], {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, OMCODE_VERIFY_RUN_ID: runId },
});
let launchError;
child.on("error", (error) => {
  launchError = error;
});
const result = await new Promise((resolve) =>
  child.on("close", (code, signal) => resolve({ code, signal })),
);
let output = {};
try {
  output = JSON.parse(await fs.readFile(receiptPath, "utf8"));
} catch {}
const passed = result.code === 0 && output.ok === true;
await write({
  ...output,
  ...base,
  finishedAt: new Date().toISOString(),
  exitCode: result.code,
  signal: result.signal,
  ok: passed,
  status: passed ? "PASS" : "FAIL",
  ...(passed
    ? {}
    : {
        error:
          launchError?.message ||
          `Verification failed (${result.code ?? result.signal}); see stage output.`,
      }),
});
process.exitCode = passed ? 0 : 1;
