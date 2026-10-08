import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { describe, it } from "node:test";

function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "omdala-recovery-workspace-")));
  const source = join(root, "recovery-input");
  const candidate = join(root, "candidate");
  const evidence = join(candidate, "transaction-evidence");
  const apiConfig = join(candidate, "services/api/wrangler.release.toml");
  mkdirSync(join(root, "control-plane"));
  mkdirSync(join(source, "surfaces"), { recursive: true });
  mkdirSync(join(candidate, "services/api"), { recursive: true });
  mkdirSync(join(candidate, "infra/staging/surfaces"), { recursive: true });
  mkdirSync(evidence, { recursive: true });
  const files = Object.fromEntries(["api", "web", "app", "auth", "brand"].map((name) => [name, Buffer.from(`name = "${name}-staging"\n`)]));
  writeFileSync(join(source, "api.wrangler.release.toml"), files.api);
  for (const name of ["web", "app", "auth", "brand"]) writeFileSync(join(source, `surfaces/${name}.wrangler.jsonc`), files[name]);
  const capsule = {
    schema_version: 1,
    verdict: "STAGING_RECOVERY_CAPSULE_SEALED",
    transaction_id: "staging-41-1",
    candidate_sha: "a".repeat(40),
    targets: ["api", "web", "app", "auth", "brand"].map((name) => ({ name, configSha256: digest(files[name]) })),
  };
  writeFileSync(join(source, "recovery-capsule.json"), `${JSON.stringify(capsule)}\n`);
  for (const name of ["transaction-journal.json", "capsule-seal.json", "capsule-ledger-record.json"]) {
    writeFileSync(join(source, name), "{}\n");
  }
  return { root, source, candidate, evidence, apiConfig, files };
}

function restore(value) {
  return spawnSync("bash", [
    "scripts/staging-restore-recovery-workspace.sh",
    value.source,
    value.candidate,
    value.evidence,
    value.apiConfig,
  ], { cwd: process.cwd(), encoding: "utf8" });
}

describe("candidate-free durable recovery workspace", () => {
  it("restores all five configs without an old candidate Git object", () => {
    const value = fixture();
    try {
      const result = restore(value);
      assert.equal(result.status, 0, result.stderr);
      assert.deepEqual(readFileSync(value.apiConfig), value.files.api);
      for (const name of ["web", "app", "auth", "brand"]) {
        assert.deepEqual(readFileSync(join(value.candidate, `infra/staging/surfaces/${name}.wrangler.jsonc`)), value.files[name]);
      }
      assert.throws(() => readFileSync(join(value.candidate, ".git")), /ENOENT/);
      assert.deepEqual(readFileSync(join(value.evidence, "capsule/recovery-capsule.json")), readFileSync(join(value.source, "recovery-capsule.json")));
    } finally { rmSync(value.root, { recursive: true, force: true }); }
  });

  it("fails closed when a materialized config byte differs from the capsule", () => {
    const value = fixture();
    try {
      writeFileSync(join(value.source, "surfaces/auth.wrangler.jsonc"), "tampered\n");
      assert.notEqual(restore(value).status, 0);
    } finally { rmSync(value.root, { recursive: true, force: true }); }
  });
});
