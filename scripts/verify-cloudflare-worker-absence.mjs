import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const ACCOUNT = /^[a-f0-9]{32}$/;
const WORKERS = new Set([
  "omdala-api-staging",
  "omdala-surface-web-staging",
  "omdala-surface-app-staging",
  "omdala-surface-auth-staging",
  "omdala-surface-brand-staging",
]);

function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

export function verifyWorkerAbsent(inventory, rawBytes, { workerName, accountId }) {
  invariant(WORKERS.has(workerName), "Worker name is outside the staging authority map");
  invariant(ACCOUNT.test(accountId ?? ""), "Cloudflare account ID is invalid");
  invariant(inventory?.success === true, "Cloudflare scripts inventory did not succeed");
  invariant(Array.isArray(inventory?.errors) && inventory.errors.length === 0, "Cloudflare scripts inventory contains errors");
  invariant(Array.isArray(inventory?.result), "Cloudflare scripts inventory result is invalid");
  const ids = inventory.result.map((entry) => entry?.id);
  invariant(ids.every((id) => typeof id === "string" && id.length > 0), "Cloudflare scripts inventory contains an invalid ID");
  invariant(new Set(ids).size === ids.length, "Cloudflare scripts inventory contains duplicate IDs");
  invariant(
    inventory?.result_info?.page === 1 && inventory.result_info.total_pages === 1 &&
    Number.isSafeInteger(inventory.result_info.per_page) && inventory.result_info.per_page >= ids.length &&
    inventory.result_info.total_count === ids.length,
    "Cloudflare scripts inventory is incomplete or paginated",
  );
  invariant(!ids.includes(workerName), "The requested staging Worker exists in the exact account inventory");
  return {
    schema_version: 1,
    verdict: "STAGING_WORKER_ABSENCE_EXACT",
    cloudflare_account_id: accountId,
    worker_name: workerName,
    inventory_sha256: digest(rawBytes),
    inventory_count: ids.length,
    provider_readback_verified: true,
    production_release_authorized: false,
  };
}

function option(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function main() {
  const inventoryPath = option("--inventory");
  const output = option("--output");
  if (!inventoryPath || !output) throw new Error("--inventory and --output are required");
  const rawBytes = readFileSync(inventoryPath);
  const inventory = JSON.parse(rawBytes.toString("utf8"));
  const receipt = verifyWorkerAbsent(inventory, rawBytes, {
    workerName: option("--worker-name"),
    accountId: option("--account-id"),
  });
  writeFileSync(output, `${JSON.stringify(receipt, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { main(); } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
