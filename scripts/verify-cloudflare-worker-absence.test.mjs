import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { verifyWorkerAbsent } from "./verify-cloudflare-worker-absence.mjs";

const accountId = "a".repeat(32);
const workerName = "omdala-api-staging";

function inventory(ids = ["unrelated-worker"]) {
  return {
    success: true,
    errors: [],
    messages: [],
    result: ids.map((id) => ({ id })),
    result_info: { page: 1, per_page: 1000, total_pages: 1, total_count: ids.length },
  };
}

function verify(value, overrides = {}) {
  const bytes = Buffer.from(`${JSON.stringify(value)}\n`);
  return verifyWorkerAbsent(value, bytes, { workerName, accountId, ...overrides });
}

describe("exact Cloudflare staging Worker absence", () => {
  it("accepts a complete exact-account inventory that omits the requested Worker", () => {
    const receipt = verify(inventory());
    assert.equal(receipt.verdict, "STAGING_WORKER_ABSENCE_EXACT");
    assert.equal(receipt.worker_name, workerName);
  });

  it("rejects an existing Worker and incomplete or failed inventories", () => {
    assert.throws(() => verify(inventory([workerName])), /exists/);
    const paginated = inventory();
    paginated.result_info.total_pages = 2;
    assert.throws(() => verify(paginated), /incomplete or paginated/);
    const failed = inventory();
    failed.success = false;
    failed.errors = [{ code: 10007, message: "unrelated object not found" }];
    assert.throws(() => verify(failed), /did not succeed/);
  });

  it("rejects a forged account, target, duplicate row, or wrong total", () => {
    assert.throws(() => verify(inventory(), { accountId: "b" }), /account ID/);
    assert.throws(() => verify(inventory(), { workerName: "production-worker" }), /authority map/);
    assert.throws(() => verify(inventory(["dup", "dup"])), /duplicate/);
    const omitted = inventory();
    omitted.result_info.total_count = 2;
    assert.throws(() => verify(omitted), /incomplete or paginated/);
  });
});
