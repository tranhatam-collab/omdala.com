import fs from "node:fs/promises";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
const result = spawnSync("npm", ["audit", "--json"], {
  cwd: process.cwd(),
  encoding: "utf8",
  timeout: 60000,
  maxBuffer: 8 * 1024 * 1024,
});
let audit;
try {
  audit = JSON.parse(result.stdout);
} catch {
  audit = { error: "Audit did not return valid JSON" };
}
const receipt = {
  schemaVersion: 1,
  time: new Date().toISOString(),
  runId: process.env.OMCODE_VERIFY_RUN_ID,
  lockfileSha256: createHash("sha256")
    .update(await fs.readFile("package-lock.json"))
    .digest("hex"),
  exitCode: result.status,
  ok: result.status === 0 && !audit.error,
  metadata: audit.metadata,
  error: audit.error || result.error?.message || null,
};
await fs.mkdir("evidence", { recursive: true });
await fs.writeFile(
  "evidence/dependency-audit.json",
  JSON.stringify(receipt, null, 2) + "\n",
);
console.log(JSON.stringify(receipt, null, 2));
if (!receipt.ok) process.exitCode = 1;
