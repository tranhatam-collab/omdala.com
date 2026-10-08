import assert from "node:assert/strict";
import { chmodSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { describe, it } from "node:test";

const candidateSha = "a".repeat(40);
const headSha = "b".repeat(40);
const providerVersion = "10000000-0000-4000-8000-000000000001";
const ledgerVersion = "20000000-0000-4000-8000-000000000002";
const consumerVersion = "30000000-0000-4000-8000-000000000003";

function receipt(version = "40000000-0000-4000-8000-000000000004") {
  return {
    ok: true,
    result: "OMDALA_STAGING_ALL_MODEL_RECONCILIATION_PASS",
    failure: null,
    provider_source_sha: headSha,
    ledger_release_sha: headSha,
    consumer_source_sha: candidateSha,
    consumer_version_id: version,
    consumer_deployment_id: version,
    provider_version_id: providerVersion,
    provider_deployment_id: providerVersion,
    provider_bundle_sha256: "c".repeat(64),
    ledger_version_id: ledgerVersion,
    ledger_deployment_id: ledgerVersion,
    ledger_bundle_sha256: "d".repeat(64),
    provider_contract_version: "1.0.0",
    ledger_contract_version: "1.0.0",
    tenant_id: "omdala-com",
    workspace_id: "omdala-com-staging",
    configured_acceptance_ceiling_usd: 0.25,
    secret_values_logged: false,
    production_mutated: false,
  };
}

function fixture({ mainSha = headSha } = {}) {
  const directory = mkdtempSync(join(tmpdir(), "omdala-team-ai-dispatch-"));
  const baselineRun = join(directory, "baseline-run.json");
  const baselineReceipt = join(directory, "baseline-receipt.json");
  const credential = join(directory, "credential.json");
  const output = join(directory, "output");
  const state = join(directory, "state");
  mkdirSync(state);
  writeFileSync(join(directory, "gh.log"), "");
  writeFileSync(baselineRun, `${JSON.stringify({
    id: 12,
    name: "OMDALA protected staging AI acceptance",
    path: ".github/workflows/omdala-staging-acceptance.yml",
    event: "workflow_dispatch",
    head_branch: "main",
    head_sha: headSha,
    status: "completed",
    conclusion: "success",
    repository: { full_name: "tranhatam-collab/AI.OMDALA.COM" },
  })}\n`);
  writeFileSync(baselineReceipt, `${JSON.stringify(receipt())}\n`);
  writeFileSync(credential, `${JSON.stringify({ GITHUB_TOKEN: `ghp_${"x".repeat(40)}` })}\n`, { mode: 0o600 });
  const gh = join(directory, "gh-mock.sh");
  writeFileSync(gh, `#!/usr/bin/env bash
set -euo pipefail
test "\${GH_TOKEN:-}" = "ghp_${"x".repeat(40)}"
printf '%s\n' "$*" >> "${directory}/gh.log"
if [[ "$1" == "api" && "$2" == "/repos/tranhatam-collab/AI.OMDALA.COM/git/ref/heads/main" ]]; then
  printf '{"object":{"sha":"${mainSha}"}}\n'
elif [[ "$1" == "api" && "$2" == *"/runs?"* ]]; then
  count_file="${state}/list-count"
  count=0; [[ ! -f "$count_file" ]] || count="$(cat "$count_file")"
  count=$((count + 1)); printf '%s\n' "$count" > "$count_file"
  if ((count == 1)); then
    printf '{"workflow_runs":[{"id":12}]}\n'
  else
    printf '%s\n' '{"workflow_runs":[{"id":99,"name":"OMDALA protected staging AI acceptance","path":".github/workflows/omdala-staging-acceptance.yml","event":"workflow_dispatch","head_branch":"main","head_sha":"${headSha}","status":"completed","conclusion":"success","repository":{"full_name":"tranhatam-collab/AI.OMDALA.COM"}},{"id":12}]}'
  fi
elif [[ "$1" == "api" && "$2" == "--method" && "$3" == "POST" ]]; then
  request=""
  while (($#)); do [[ "$1" != "--input" ]] || request="$2"; shift; done
  test -f "$request"
  jq -e --arg consumer "${consumerVersion}" '.ref == "main" and .inputs.consumer_version_id == $consumer and .inputs.acceptance_ceiling_usd == "0.25"' "$request" >/dev/null
elif [[ "$1" == "run" && "$2" == "download" ]]; then
  destination=""
  while (($#)); do [[ "$1" != "--dir" ]] || destination="$2"; shift; done
  test -n "$destination"
  printf '%s\n' '${JSON.stringify(receipt(consumerVersion))}' > "$destination/omdala-staging-ai-receipt.json"
else
  exit 88
fi
`);
  chmodSync(gh, 0o755);
  return { directory, baselineRun, baselineReceipt, credential, output, gh };
}

function execute(f) {
  return spawnSync(
    "bash",
    [resolve("scripts/dispatch-team-ai-staging-acceptance.sh"), f.baselineRun, f.baselineReceipt,
      candidateSha, consumerVersion, f.output, f.credential],
    {
      encoding: "utf8",
      env: {
        ...process.env,
        GH_BIN: f.gh,
        STAGING_TEAM_AI_POLL_SECONDS: "0",
        STAGING_TEAM_AI_POLL_ATTEMPTS: "2",
      },
    },
  );
}

describe("post-deploy Team AI acceptance dispatch", () => {
  it("dispatches exact protected inputs and downloads the one new exact-head run", () => {
    const f = fixture();
    try {
      const result = execute(f);
      assert.equal(result.status, 0, `${result.stderr}\n${result.stdout}`);
      const receipt = JSON.parse(readFileSync(join(f.output, "dispatch-receipt.json"), "utf8"));
      assert.equal(receipt.verdict, "TEAM_AI_POST_DEPLOY_ACCEPTANCE_DISPATCH_VERIFIED");
      assert.equal(receipt.run_id, 99);
      assert.equal(receipt.consumer_version_id, consumerVersion);
      const evidence = readFileSync(join(f.output, "dispatch-receipt.json"), "utf8");
      assert.doesNotMatch(evidence, /ghp_/);
      assert.match(readFileSync(join(f.directory, "gh.log"), "utf8"), /run download 99/);
    } finally {
      rmSync(f.directory, { recursive: true, force: true });
    }
  });

  it("refuses dispatch when protected main drifted from the baseline authority SHA", () => {
    const f = fixture({ mainSha: "e".repeat(40) });
    try {
      const result = execute(f);
      assert.notEqual(result.status, 0);
      assert.doesNotMatch(readFileSync(join(f.directory, "gh.log"), "utf8"), /--method POST/);
    } finally {
      rmSync(f.directory, { recursive: true, force: true });
    }
  });

  it("refuses a baseline receipt from another consumer candidate", () => {
    const f = fixture();
    try {
      const value = JSON.parse(readFileSync(f.baselineReceipt, "utf8"));
      value.consumer_source_sha = "f".repeat(40);
      writeFileSync(f.baselineReceipt, `${JSON.stringify(value)}\n`);
      const result = execute(f);
      assert.notEqual(result.status, 0);
      assert.equal(readFileSync(join(f.directory, "gh.log"), "utf8"), "");
    } finally {
      rmSync(f.directory, { recursive: true, force: true });
    }
  });
});
