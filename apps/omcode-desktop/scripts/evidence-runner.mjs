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
const sourceStatus = spawnSync(
  "git",
  ["status", "--porcelain=v1", "--untracked-files=all", "--", "."],
  {
    cwd: root,
    encoding: "utf8",
    timeout: 5000,
  },
);
await fs.mkdir(path.dirname(archive), { recursive: true });
await fs.mkdir(path.dirname(receiptPath), { recursive: true });
const base = {
  schemaVersion: 2,
  runId,
  startedAt: new Date().toISOString(),
  sourceHead: spawnSync("git", ["rev-parse", "HEAD"], {
    cwd: root,
    encoding: "utf8",
    timeout: 5000,
  }).stdout.trim(),
  sourceBranch:
    spawnSync("git", ["symbolic-ref", "--quiet", "--short", "HEAD"], {
      cwd: root,
      encoding: "utf8",
      timeout: 5000,
    }).stdout?.trim() || null,
  sourceState:
    sourceStatus.status === 0
      ? sourceStatus.stdout.trim()
        ? "VERIFIED_WORKTREE_ONLY"
        : "VERIFIED_HEAD_ONLY"
      : "NOT_CHECKED",
  sourceChanges:
    sourceStatus.status === 0
      ? sourceStatus.stdout.split("\n").filter(Boolean)
      : null,
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
// A later failing release-critical E2E must revoke the current installation gate.
// Preserve the original per-run PASS as historical evidence; never silently let
// it remain the latest accepted receipt after contradictory test evidence.
if (!passed && ["e2e-results", "native-e2e", "install-e2e"].includes(name)) {
  const releasePath = path.resolve(
    process.env.OMCODE_RELEASE_RECEIPT ||
      path.join(root, "evidence/release-verification.json"),
  );
  let accepted;
  try {
    accepted = JSON.parse(await fs.readFile(releasePath, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  if (accepted?.ok === true && accepted.status === "PASS") {
    const invalidated = {
      ...accepted,
      ok: false,
      status: "FAIL",
      invalidatedAt: new Date().toISOString(),
      invalidatedBy: { name, runId, exitCode: result.code, receipt: archive },
      error:
        "A later release-critical E2E failed. Run all release gates again before installing.",
    };
    const content = JSON.stringify(invalidated, null, 2) + "\n";
    await fs.writeFile(
      path.join(path.dirname(archive), "release-invalidation.json"),
      content,
    );
    const temporary = releasePath + "." + runId + ".tmp";
    await fs.writeFile(temporary, content);
    await fs.rename(temporary, releasePath);
  }
}
process.exitCode = passed ? 0 : 1;
