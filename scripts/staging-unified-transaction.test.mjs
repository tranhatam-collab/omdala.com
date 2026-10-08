import { createHash } from "node:crypto";
import { chmodSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createCapsuleLedgerRecord,
  createTerminalLedgerRecord,
  validateTerminalLedgerRecord,
} from "./staging-transaction-ledger.mjs";

const candidateSha = "a".repeat(40);
const controlPlaneSha = "b".repeat(40);
const releaseId = `gh-42-1-${candidateSha.slice(0, 12)}`;
const names = ["api", "web", "app", "auth", "brand"];

function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function uuid(index, prefix = "5") {
  return `${prefix}${String(index).padStart(7, "0")}-0000-4000-8000-${String(index).padStart(12, "0")}`;
}

function fixture({ absentTargets = [] } = {}) {
  const directory = mkdtempSync(join(tmpdir(), "omdala-unified-staging-"));
  mkdirSync(join(directory, "services", "api"), { recursive: true });
  mkdirSync(join(directory, "infra", "staging", "surfaces"), { recursive: true });
  mkdirSync(join(directory, "evidence", "capsule"), { recursive: true });
  mkdirSync(join(directory, "state"));
  writeFileSync(join(directory, ".env"), "CLOUDFLARE_API_BASE_URL=https://attacker.invalid/client/v4\nWRANGLER_API_ENVIRONMENT=staging\nCLOUDFLARE_COMPLIANCE_REGION=fedramp_high\n");
  writeFileSync(join(directory, "hooks.log"), "");
  const targets = names.map((name, index) => {
    const configPath = name === "api"
      ? "services/api/wrangler.release.toml"
      : `infra/staging/surfaces/${name}.wrangler.jsonc`;
    const config = Buffer.from(`name=${name}\n`);
    writeFileSync(join(directory, configPath), config);
    const baselineVersionId = absentTargets.includes(name) ? null : uuid(index + 1, "5");
    writeFileSync(join(directory, "state", `${name}.state`), `${baselineVersionId ?? ""}\n`);
    return {
      kind: name === "api" ? "api" : "surface",
      name,
      workerName: name === "api" ? "omdala-api-staging" : `omdala-surface-${name}-staging`,
      configPath,
      configSha256: digest(config),
      deploymentSnapshotSha256: "c".repeat(64),
      baselineVersionId,
      useStagingEnvironment: name === "api",
    };
  });
  const capsule = {
    schema_version: 1,
    verdict: "STAGING_RECOVERY_CAPSULE_SEALED",
    transaction_id: "staging-42-1",
    release_id: releaseId,
    candidate_sha: candidateSha,
    control_plane_sha: controlPlaneSha,
    workflow_run_id: 42,
    workflow_run_attempt: 1,
    cloudflare_account_id: "d".repeat(32),
    repository: "tranhatam-collab/omdala.com",
    target_order: names,
    reverse_recovery_order: [...names].reverse(),
    database_recovery_policy: "additive_migrations_backup_and_manual_restore_only",
    runner_loss_recovery_authority: "MANUAL_REDISPATCH_REQUIRED",
    targets,
  };
  const capsulePath = join(directory, "evidence", "capsule", "recovery-capsule.json");
  writeFileSync(capsulePath, `${JSON.stringify(capsule, null, 2)}\n`);
  const journalPath = join(directory, "evidence", "capsule", "transaction-journal.json");
  writeFileSync(
    journalPath,
    `${JSON.stringify({
      schema_version: 1,
      transaction_id: capsule.transaction_id,
      candidate_sha: candidateSha,
      control_plane_sha: controlPlaneSha,
      recovery_capsule_sha256: digest(readFileSync(capsulePath)),
      status: "CAPSULE_SEALED_NO_MUTATION",
      migration: { state: "pending", database_schema_reverted: false },
      targets: targets.map((target) => ({
        name: target.name,
        state: "pending",
        baseline_version_id: target.baselineVersionId,
        deployed_version_id: null,
      })),
    }, null, 2)}\n`,
  );
  const credentialPath = join(directory, "provider.json");
  writeFileSync(credentialPath, `{\"CLOUDFLARE_API_TOKEN\":\"test-provider-token\",\"CLOUDFLARE_ACCOUNT_ID\":\"${"d".repeat(32)}\"}\n`, { mode: 0o600 });

  const curl = join(directory, "curl");
  writeFileSync(curl, `#!/usr/bin/env bash
set -euo pipefail
output=""
while ((\$#)); do
  case "\$1" in
    --output) output="\$2"; shift 2 ;;
    *) shift ;;
  esac
done
test -n "\$output"
mock_root="\$(cd "\$(dirname "\$0")" && pwd)"
result='[]'
for name in api web app auth brand; do
  worker="omdala-surface-\${name}-staging"
  [[ "\$name" != "api" ]] || worker="omdala-api-staging"
  if [[ -n "\$(tr -d '\\n' < "\$mock_root/state/\$name.state")" || -f "\$mock_root/inventory-force-\$name" ]]; then
    result="\$(jq -c --arg id "\$worker" '. + [{id:\$id}]' <<<"\$result")"
  fi
done
jq -n --argjson result "\$result" '{success:true,errors:[],messages:[],result:\$result,result_info:{page:1,per_page:1000,total_pages:1,total_count:(\$result|length)}}' > "\$output"
printf '200'
`);
  chmodSync(curl, 0o755);

  const wrangler = join(directory, "wrangler-mock.sh");
  writeFileSync(wrangler, `#!/usr/bin/env bash
set -euo pipefail
config=""
original=("\$@")
test "\${CLOUDFLARE_API_BASE_URL:-}" = "https://api.cloudflare.com/client/v4"
test "\${CLOUDFLARE_ACCOUNT_ID:-}" = "${"d".repeat(32)}"
test "\${WRANGLER_API_ENVIRONMENT:-}" = "production"
test "\${CLOUDFLARE_COMPLIANCE_REGION:-}" = "public"
test "\${CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV:-}" = "false"
case " \${original[*]} " in *" --env-file /dev/null "*) ;; *) exit 91 ;; esac
while ((\$#)); do
  case "\$1" in
    --config) config="\$2"; shift 2 ;;
    *) shift ;;
  esac
done
case "\$config" in
  */services/api/wrangler.release.toml|services/api/wrangler.release.toml) name="api" ;;
  *) name="\$(basename "\$config" .wrangler.jsonc)" ;;
esac
mock_root="\$(cd "\$(dirname "\$0")" && pwd)"
state="\$mock_root/state/\$name.state"
echo "\$name:\${original[*]}" >> "\$mock_root/provider.log"
if [[ "\${original[0]} \${original[1]}" == "deployments list" ]]; then
  if [[ -f "\$mock_root/fail-list-\$name-broad" ]]; then
    printf 'Error 10007: Worker does not exist; could not find script\n' >&2
    exit 77
  fi
  version="\$(cat "\$state")"
  if [[ -z "\$version" ]]; then printf '[]\n'; else
    printf '[{"created_on":"2026-10-08T00:00:00Z","versions":[{"version_id":"%s","percentage":100}]}]\n' "\$version"
  fi
elif [[ "\${original[0]} \${original[1]}" == "versions view" ]]; then
  version_id="\${original[2]}"
  annotation="gh-42-1-aaaaaaaaaaaa"
  if [[ -f "\$mock_root/mismatch-\$name" && "\$version_id" == 6* ]]; then annotation="foreign-release"; fi
  printf '{"id":"%s","annotations":{"workers/message":"%s"}}\n' "\$version_id" "\$annotation"
elif [[ "\${original[0]}" == "rollback" ]]; then
  if [[ -f "\$mock_root/fail-recovery-\$name" ]]; then exit 29; fi
  printf '%s\n' "\${original[1]}" > "\$state"
  printf '{}\n'
elif [[ "\${original[0]}" == "delete" ]]; then
  : > "\$state"
  printf '{}\n'
else
  exit 8
fi
`);
  chmodSync(wrangler, 0o755);

  const hook = join(directory, "hook.sh");
  writeFileSync(hook, `#!/usr/bin/env bash
set -euo pipefail
phase="\$1"
echo "\$*" >> "\$TEST_ROOT/hooks.log"
case "\$phase" in
  migrate|accept|cleanup) exit 0 ;;
  authority)
    authority_phase="\$2"; name="\$3"; version_id="\$5"
    mkdir -p "\$TEST_ROOT/evidence/provider" "\$TEST_ROOT/evidence/authority"
    printf '{"id":"%s"}\n' "\$version_id" > "\$TEST_ROOT/evidence/provider/\$name-\$authority_phase-version.json"
    printf '[]\n' > "\$TEST_ROOT/evidence/provider/\$name-\$authority_phase-secrets.json"
    printf '{"verdict":"SECRET_EXACT"}\n' > "\$TEST_ROOT/evidence/authority/\$name-\$authority_phase-secret-authority.json"
    printf '{"verdict":"BINDING_EXACT"}\n' > "\$TEST_ROOT/evidence/authority/\$name-\$authority_phase-binding-authority.json"
    ;;
  seal)
    printf '{"verdict":"STAGING_ACCEPTANCE_PREPARED_UNIFIED_TRANSACTION"}\n' > "\$TEST_ROOT/evidence/staging-acceptance.json"
    ;;
  mutate)
    name="\$2"; index=0
    case "\$name" in api) index=1;; web) index=2;; app) index=3;; auth) index=4;; brand) index=5;; esac
    printf '6%07d-0000-4000-8000-%012d\n' "\$index" "\$index" > "\$TEST_ROOT/state/\$name.state"
    if [[ "\$SIGNAL_MUTATION_TARGET" == "\$name" ]]; then kill -TERM "\$PPID"; exit 0; fi
    if [[ "\$FAIL_MUTATION_TARGET" == "\$name" ]]; then exit 19; fi
    ;;
  *) exit 7 ;;
esac
`);
  chmodSync(hook, 0o755);
  return { directory, capsulePath, journalPath, credentialPath, wrangler, hook, curl };
}

function preparedLedger(f) {
  const ledger = join(f.directory, "ledger-fixture");
  const surfaces = join(ledger, "surfaces");
  mkdirSync(surfaces, { recursive: true });
  for (const name of names.slice(1)) {
    writeFileSync(
      join(surfaces, `${name}.wrangler.jsonc`),
      readFileSync(join(f.directory, "infra", "staging", "surfaces", `${name}.wrangler.jsonc`)),
    );
  }
  const capsule = JSON.parse(readFileSync(f.capsulePath, "utf8"));
  const capsuleSha = digest(readFileSync(f.capsulePath));
  const sealPath = join(ledger, "capsule-seal.json");
  writeFileSync(sealPath, `${JSON.stringify({
    schema_version: 1,
    transaction_id: capsule.transaction_id,
    capsule_sha256: capsuleSha,
    verdict: "STAGING_RECOVERY_CAPSULE_SEALED",
    contains_secret_values: false,
  }, null, 2)}\n`);
  const record = createCapsuleLedgerRecord({
    capsulePath: f.capsulePath,
    journalPath: f.journalPath,
    sealPath,
    apiConfigPath: join(f.directory, "services", "api", "wrangler.release.toml"),
    surfaceDirectory: surfaces,
  });
  const bytes = Buffer.from(`${JSON.stringify(record, null, 2)}\n`);
  return { record, bytes };
}

function closeRecoveredLedger(f, prepared) {
  const files = {
    transaction_executor_receipt: join(f.directory, "evidence", "transaction-executor-receipt.json"),
    staging_recovery_receipt: join(f.directory, "evidence", "recovery", "staging-recovery-receipt.json"),
    recovery_plan: join(f.directory, "evidence", "recovery-plan.json"),
    transaction_journal: f.journalPath,
  };
  const terminal = createTerminalLedgerRecord({
    type: "recovery",
    capsuleRecordBytes: prepared.bytes,
    files,
  });
  validateTerminalLedgerRecord(terminal, prepared.record, digest(prepared.bytes));
  return terminal;
}

function execute(f, mode = "deploy", environment = {}) {
  if (environment.FAIL_RECOVERY_TARGET) {
    writeFileSync(join(f.directory, `fail-recovery-${environment.FAIL_RECOVERY_TARGET}`), "");
  }
  if (environment.MISMATCH_OWNERSHIP_TARGET) {
    writeFileSync(join(f.directory, `mismatch-${environment.MISMATCH_OWNERSHIP_TARGET}`), "");
  }
  return spawnSync(
    "bash",
    [
      resolve("scripts/staging-unified-transaction.sh"),
      mode,
      f.capsulePath,
      f.journalPath,
      join(f.directory, "evidence"),
    ],
    {
      cwd: f.directory,
      env: {
        ...process.env,
        TEST_ROOT: f.directory,
        FAIL_MUTATION_TARGET: "",
        SIGNAL_MUTATION_TARGET: "",
        STAGING_TRANSACTION_HOOK_SCRIPT: f.hook,
        STAGING_RECOVERY_SCRIPT: resolve("scripts/staging-transaction-recovery.sh"),
        STAGING_RECOVERY_POLL_SECONDS: "0",
        STAGING_PROVIDER_CREDENTIAL_FILE: f.credentialPath,
        WRANGLER_BIN: f.wrangler,
        TEST_SECRET_THAT_MUST_NOT_PERSIST: "never-write-this-secret",
        PATH: `${f.directory}:${process.env.PATH}`,
        GITHUB_REPOSITORY: "tranhatam-collab/omdala.com",
        GITHUB_WORKFLOW_REF: "tranhatam-collab/omdala.com/.github/workflows/staging-transaction.yml@refs/heads/main",
        GITHUB_RUN_ID: mode === "recovery-only" ? "84" : "42",
        GITHUB_RUN_ATTEMPT: "1",
        GITHUB_SHA: mode === "recovery-only" ? "c".repeat(40) : controlPlaneSha,
        ...environment,
      },
      encoding: "utf8",
    },
  );
}

describe("unified staging transaction fault injection", () => {
  it("refuses an empty deployment list when the exact account inventory still contains the Worker", () => {
    const f = fixture({ absentTargets: ["api"] });
    try {
      writeFileSync(join(f.directory, "inventory-force-api"), "");
      const result = execute(f);
      assert.notEqual(result.status, 0);
      assert.doesNotMatch(readFileSync(join(f.directory, "hooks.log"), "utf8"), /mutate /);
    } finally {
      rmSync(f.directory, { recursive: true, force: true });
    }
  });

  it("never treats broad Wrangler not-found text as absence when account inventory shows the Worker", () => {
    const f = fixture();
    try {
      writeFileSync(join(f.directory, "fail-list-api-broad"), "");
      const result = execute(f);
      assert.notEqual(result.status, 0);
      assert.doesNotMatch(readFileSync(join(f.directory, "hooks.log"), "utf8"), /mutate /);
    } finally {
      rmSync(f.directory, { recursive: true, force: true });
    }
  });

  it("deploys API then four surfaces and stops at prepared-for-commit", () => {
    const f = fixture();
    try {
      const result = execute(f);
      assert.equal(result.status, 0, `${result.stderr}\n${result.stdout}`);
      const hooks = readFileSync(join(f.directory, "hooks.log"), "utf8");
      assert.match(hooks, /migrate\nauthority pre api[\s\S]*mutate api[\s\S]*authority post brand[\s\S]*accept\nseal\ncleanup/);
      const journal = JSON.parse(readFileSync(f.journalPath, "utf8"));
      assert.equal(journal.status, "STAGING_TRANSACTION_PREPARED_FOR_COMMIT");
      assert.equal(journal.targets.every((target) => target.state === "deployed"), true);
      const receipt = JSON.parse(readFileSync(join(f.directory, "evidence", "transaction-executor-receipt.json"), "utf8"));
      assert.equal(receipt.verdict, "STAGING_TRANSACTION_PREPARED_FOR_COMMIT");
      assert.equal(receipt.recovery_execution.control_plane_sha, controlPlaneSha);
      const manifest = JSON.parse(readFileSync(join(f.directory, "evidence", "provider-evidence-manifest.json"), "utf8"));
      assert.deepEqual(manifest.targets.map((target) => target.name), names);
      assert.equal(manifest.targets.every((target) => target.pre && target.post), true);
    } finally {
      rmSync(f.directory, { recursive: true, force: true });
    }
  });

  it("recovers a mutation that failed before its deployed-version receipt", () => {
    const f = fixture();
    try {
      const result = execute(f, "deploy", { FAIL_MUTATION_TARGET: "auth" });
      assert.notEqual(result.status, 0);
      const provider = readFileSync(join(f.directory, "provider.log"), "utf8");
      const rollback = provider.split("\n").filter((line) => line.includes(":rollback "));
      assert.deepEqual(rollback.map((line) => line.split(":", 1)[0]), ["auth", "app", "web", "api"]);
      const receipt = JSON.parse(readFileSync(join(f.directory, "evidence", "transaction-executor-receipt.json"), "utf8"));
      assert.equal(receipt.verdict, "STAGING_TRANSACTION_FAILED_RECOVERY_VERIFIED");
    } finally {
      rmSync(f.directory, { recursive: true, force: true });
    }
  });

  it("fails closed instead of rolling back a foreign current version", () => {
    const f = fixture();
    try {
      const result = execute(f, "deploy", { FAIL_MUTATION_TARGET: "auth", MISMATCH_OWNERSHIP_TARGET: "auth" });
      assert.notEqual(result.status, 0);
      const provider = readFileSync(join(f.directory, "provider.log"), "utf8");
      assert.doesNotMatch(provider, /auth:rollback /);
      for (const name of ["app", "web", "api"]) {
        assert.match(provider, new RegExp(`${name}:rollback `));
      }
      const recovery = JSON.parse(readFileSync(join(f.directory, "evidence", "recovery", "staging-recovery-receipt.json"), "utf8"));
      assert.equal(recovery.targets.length, 5);
      assert.equal(recovery.targets.find((target) => target.name === "auth").disposition, "manual_reconciliation_required");
      assert.equal(recovery.targets.find((target) => target.name === "auth").provider_readback_verified, false);
      assert.equal(recovery.targets.filter((target) => target.name !== "auth").every((target) => target.provider_readback_verified), true);
      const receipt = JSON.parse(readFileSync(join(f.directory, "evidence", "transaction-executor-receipt.json"), "utf8"));
      assert.equal(receipt.verdict, "STAGING_TRANSACTION_FAILED_RECOVERY_INCOMPLETE");
    } finally {
      rmSync(f.directory, { recursive: true, force: true });
    }
  });

  it("continues reverse recovery after one target fails and always receipts", () => {
    const f = fixture();
    try {
      const result = execute(f, "deploy", { FAIL_MUTATION_TARGET: "auth", FAIL_RECOVERY_TARGET: "app" });
      assert.notEqual(result.status, 0);
      const provider = readFileSync(join(f.directory, "provider.log"), "utf8");
      for (const name of ["auth", "app", "web", "api"]) assert.match(provider, new RegExp(`${name}:rollback `));
      const recovery = JSON.parse(readFileSync(join(f.directory, "evidence", "recovery", "staging-recovery-receipt.json"), "utf8"));
      assert.equal(recovery.verdict, "STAGING_COMPENSATING_RECOVERY_FAILED");
      const receipt = JSON.parse(readFileSync(join(f.directory, "evidence", "transaction-executor-receipt.json"), "utf8"));
      assert.equal(receipt.verdict, "STAGING_TRANSACTION_FAILED_RECOVERY_INCOMPLETE");
    } finally {
      rmSync(f.directory, { recursive: true, force: true });
    }
  });

  it("traps a normal termination signal and compensates in the same executor", () => {
    const f = fixture();
    try {
      const result = execute(f, "deploy", { SIGNAL_MUTATION_TARGET: "auth" });
      assert.notEqual(result.status, 0);
      const provider = readFileSync(join(f.directory, "provider.log"), "utf8");
      for (const name of ["auth", "app", "web", "api"]) assert.match(provider, new RegExp(`${name}:rollback `));
      const receipt = JSON.parse(readFileSync(join(f.directory, "evidence", "transaction-executor-receipt.json"), "utf8"));
      assert.equal(receipt.verdict, "STAGING_TRANSACTION_FAILED_RECOVERY_VERIFIED");
      assert.equal(receipt.signal, "TERM");
    } finally {
      rmSync(f.directory, { recursive: true, force: true });
    }
  });

  it("recovery-only restores a transaction-owned mutation from a stale all-pending PREPARED journal", () => {
    const f = fixture();
    try {
      writeFileSync(join(f.directory, "state", "web.state"), `${uuid(2, "6")}\n`);
      const result = execute(f, "recovery-only");
      assert.equal(result.status, 0, `${result.stderr}\n${result.stdout}`);
      assert.equal(readFileSync(join(f.directory, "state", "web.state"), "utf8").trim(), uuid(2, "5"));
      assert.equal(readFileSync(join(f.directory, "hooks.log"), "utf8").trim(), "");
      const receipt = JSON.parse(readFileSync(join(f.directory, "evidence", "transaction-executor-receipt.json"), "utf8"));
      assert.equal(receipt.verdict, "STAGING_RECOVERY_ONLY_VERIFIED");
      assert.equal(receipt.mode, "recovery-only");
      const plan = JSON.parse(readFileSync(join(f.directory, "evidence", "recovery-plan.json"), "utf8"));
      assert.equal(plan.targets.find((target) => target.name === "web").journalState, "attempted");
      assert.equal(plan.targets.find((target) => target.name === "web").disposition, "rollback_required");
      assert.equal(plan.recovery_execution.run_id, 84);
      assert.equal(plan.recovery_execution.control_plane_sha, "c".repeat(40));
      assert.equal(receipt.recovery_execution.run_id, 84);
    } finally {
      rmSync(f.directory, { recursive: true, force: true });
    }
  });

  it("recovery-only inventories all five baseline targets with no provider mutation", () => {
    const f = fixture();
    try {
      const result = execute(f, "recovery-only");
      assert.equal(result.status, 0, `${result.stderr}\n${result.stdout}`);
      const plan = JSON.parse(readFileSync(join(f.directory, "evidence", "recovery-plan.json"), "utf8"));
      assert.deepEqual(plan.targets.map((target) => target.name), [...names].reverse());
      assert.deepEqual(plan.targets.map((target) => target.disposition), Array(5).fill("pending_unchanged"));
      assert.deepEqual(plan.mutation_targets, []);
      const recovery = JSON.parse(readFileSync(join(f.directory, "evidence", "recovery", "staging-recovery-receipt.json"), "utf8"));
      assert.deepEqual(recovery.targets.map((target) => target.name), [...names].reverse());
      assert.equal(recovery.targets.every((target) => target.provider_readback_verified), true);
      assert.deepEqual(recovery.mutation_targets, []);
      const provider = readFileSync(join(f.directory, "provider.log"), "utf8");
      assert.doesNotMatch(provider, /:rollback |:delete /);
    } finally {
      rmSync(f.directory, { recursive: true, force: true });
    }
  });

  it("compensates all five targets from a prepared-for-commit journal", () => {
    const f = fixture();
    try {
      const deployed = execute(f, "deploy");
      assert.equal(deployed.status, 0, `${deployed.stderr}\n${deployed.stdout}`);
      assert.equal(JSON.parse(readFileSync(f.journalPath, "utf8")).status, "STAGING_TRANSACTION_PREPARED_FOR_COMMIT");
      const recovered = execute(f, "recovery-only");
      assert.equal(recovered.status, 0, `${recovered.stderr}\n${recovered.stdout}`);
      const provider = readFileSync(join(f.directory, "provider.log"), "utf8");
      assert.deepEqual(
        provider.split("\n").filter((line) => line.includes(":rollback ")).map((line) => line.split(":", 1)[0]),
        ["brand", "auth", "app", "web", "api"],
      );
      const receipt = JSON.parse(readFileSync(join(f.directory, "evidence", "transaction-executor-receipt.json"), "utf8"));
      assert.equal(receipt.verdict, "STAGING_RECOVERY_ONLY_VERIFIED");
    } finally {
      rmSync(f.directory, { recursive: true, force: true });
    }
  });

  it("never persists an injected secret in capsule, journal, or receipts", () => {
    const f = fixture();
    try {
      execute(f, "deploy", { FAIL_MUTATION_TARGET: "web" });
      for (const path of [
        f.capsulePath,
        f.journalPath,
        join(f.directory, "evidence", "transaction-executor-receipt.json"),
        join(f.directory, "evidence", "recovery", "staging-recovery-receipt.json"),
      ]) assert.doesNotMatch(readFileSync(path, "utf8"), /never-write-this-secret/);
    } finally {
      rmSync(f.directory, { recursive: true, force: true });
    }
  });

  for (const scenario of [
    { name: "failure-before-first-target", fixture: {}, mode: "deploy", environment: { FAIL_MUTATION_TARGET: "api" } },
    { name: "partial-failure", fixture: {}, mode: "deploy", environment: { FAIL_MUTATION_TARGET: "auth" } },
    { name: "new-resource-delete", fixture: { absentTargets: ["api"] }, mode: "deploy", environment: { FAIL_MUTATION_TARGET: "api" } },
    { name: "all-baseline-no-op", fixture: {}, mode: "recovery-only", environment: {} },
  ]) {
    it(`pipes real executor recovery evidence into durable closure: ${scenario.name}`, () => {
      const f = fixture(scenario.fixture);
      try {
        const prepared = preparedLedger(f);
        const result = execute(f, scenario.mode, scenario.environment);
        if (scenario.mode === "deploy") assert.notEqual(result.status, 0, scenario.name);
        else assert.equal(result.status, 0, `${scenario.name}: ${result.stderr}`);
        let terminal;
        try {
          terminal = closeRecoveredLedger(f, prepared);
        } catch (error) {
          const diagnostic = Object.fromEntries([
            ["plan", join(f.directory, "evidence", "recovery-plan.json")],
            ["recovery", join(f.directory, "evidence", "recovery", "staging-recovery-receipt.json")],
            ["executor", join(f.directory, "evidence", "transaction-executor-receipt.json")],
            ["journal", f.journalPath],
          ].map(([name, path]) => [name, JSON.parse(readFileSync(path, "utf8"))]));
          throw new Error(`${scenario.name}: ${error instanceof Error ? error.message : String(error)} stderr=${result.stderr} ${JSON.stringify(diagnostic)}`);
        }
        assert.equal(terminal.record_type, "recovery", scenario.name);
        const recovery = JSON.parse(readFileSync(join(f.directory, "evidence", "recovery", "staging-recovery-receipt.json"), "utf8"));
        assert.deepEqual(recovery.targets.map((target) => target.name), [...names].reverse(), scenario.name);
        assert.equal(recovery.targets.every((target) => target.provider_readback_verified), true, scenario.name);
        if (scenario.name === "new-resource-delete") {
          assert.deepEqual(recovery.mutation_targets, ["api"]);
          assert.equal(recovery.targets.find((target) => target.name === "api").action, "delete_new_staging_resource");
        }
      } finally {
        rmSync(f.directory, { recursive: true, force: true });
      }
    });
  }

  it("closes durably after same-job compensation and an idempotent recovery-only redispatch", () => {
    const f = fixture();
    try {
      const prepared = preparedLedger(f);
      const failed = execute(f, "deploy", { FAIL_MUTATION_TARGET: "auth" });
      assert.notEqual(failed.status, 0);
      closeRecoveredLedger(f, prepared);
      const repeated = execute(f, "recovery-only");
      assert.equal(repeated.status, 0, repeated.stderr);
      const terminal = closeRecoveredLedger(f, prepared);
      assert.equal(terminal.record_type, "recovery");
      const plan = JSON.parse(readFileSync(join(f.directory, "evidence", "recovery-plan.json"), "utf8"));
      assert.deepEqual(plan.mutation_targets, []);
      assert.equal(plan.targets.every((target) => ["pending_unchanged", "already_at_baseline"].includes(target.disposition)), true);
    } finally {
      rmSync(f.directory, { recursive: true, force: true });
    }
  });
});
