#!/usr/bin/env bash
set -euo pipefail

baseline_run="${1:?baseline Team AI run JSON is required}"
baseline_receipt="${2:?baseline Team AI receipt JSON is required}"
candidate_sha="${3:?candidate SHA is required}"
consumer_version_id="${4:?consumer version ID is required}"
output_root="${5:?Team AI evidence output directory is required}"
credential_file="${6:?Team AI credential file is required}"

repository="tranhatam-collab/AI.OMDALA.COM"
workflow_path=".github/workflows/omdala-staging-acceptance.yml"
workflow_file="omdala-staging-acceptance.yml"
workflow_name="OMDALA protected staging AI acceptance"
gh_bin="${GH_BIN:-gh}"
poll_seconds="${STAGING_TEAM_AI_POLL_SECONDS:-10}"
poll_attempts="${STAGING_TEAM_AI_POLL_ATTEMPTS:-240}"

digest_file() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | awk '{print $1}'
  else
    shasum -a 256 "$1" | awk '{print $1}'
  fi
}

[[ "$candidate_sha" =~ ^[a-f0-9]{40}$ ]]
[[ "$consumer_version_id" =~ ^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$ ]]
[[ "$poll_seconds" =~ ^[0-9]+$ ]]
[[ "$poll_attempts" =~ ^[1-9][0-9]*$ ]]
test -f "$baseline_run"
test -f "$baseline_receipt"
test -f "$credential_file"
test ! -L "$baseline_run"
test ! -L "$baseline_receipt"
test ! -L "$credential_file"
token="$(jq -er '.GITHUB_TOKEN | select(type == "string" and length >= 40)' "$credential_file")"

baseline_head_sha="$(jq -er \
  --arg repository "$repository" \
  --arg workflow_name "$workflow_name" \
  --arg workflow_path "$workflow_path" '
    select(
      .name == $workflow_name and
      (.path == $workflow_path or .path == ($workflow_path + "@refs/heads/main")) and
      .event == "workflow_dispatch" and .head_branch == "main" and
      (.head_sha | test("^[a-f0-9]{40}$")) and
      .status == "completed" and .conclusion == "success" and
      .repository.full_name == $repository
    ) | .head_sha
  ' "$baseline_run")"

jq -e \
  --arg candidate_sha "$candidate_sha" \
  --arg head_sha "$baseline_head_sha" '
    .ok == true and .result == "OMDALA_STAGING_ALL_MODEL_RECONCILIATION_PASS" and
    .failure == null and
    .provider_source_sha == $head_sha and .ledger_release_sha == $head_sha and
    .consumer_source_sha == $candidate_sha and
    (.provider_version_id | test("^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$")) and
    .provider_deployment_id == .provider_version_id and
    (.ledger_version_id | test("^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$")) and
    .ledger_deployment_id == .ledger_version_id and
    (.provider_bundle_sha256 | test("^[a-f0-9]{64}$")) and
    (.ledger_bundle_sha256 | test("^[a-f0-9]{64}$")) and
    .provider_contract_version == "1.0.0" and
    .ledger_contract_version == "1.0.0" and
    .tenant_id == "omdala-com" and .workspace_id == "omdala-com-staging" and
    .configured_acceptance_ceiling_usd <= 0.25 and
    .secret_values_logged == false and .production_mutated == false
  ' "$baseline_receipt" >/dev/null

mkdir -p "$output_root"
test ! -L "$output_root"
dispatch_dir="$output_root/dispatch"
run_dir="$output_root/run"
receipt_dir="$output_root/receipt"
test ! -e "$dispatch_dir"
test ! -e "$run_dir"
test ! -e "$receipt_dir"
install -d -m 700 "$dispatch_dir" "$run_dir"

env GH_TOKEN="$token" "$gh_bin" api \
  "/repos/$repository/git/ref/heads/main" > "$dispatch_dir/current-main.json"
test "$(jq -er '.object.sha | select(test("^[a-f0-9]{40}$"))' "$dispatch_dir/current-main.json")" = "$baseline_head_sha"

runs_endpoint="/repos/$repository/actions/workflows/$workflow_file/runs?branch=main&event=workflow_dispatch&per_page=100"
env GH_TOKEN="$token" "$gh_bin" api "$runs_endpoint" > "$dispatch_dir/runs-before.json"
jq -e '.workflow_runs | type == "array"' "$dispatch_dir/runs-before.json" >/dev/null
jq '[.workflow_runs[].id]' "$dispatch_dir/runs-before.json" > "$dispatch_dir/run-ids-before.json"

provider_version_id="$(jq -er '.provider_version_id' "$baseline_receipt")"
provider_bundle_sha256="$(jq -er '.provider_bundle_sha256' "$baseline_receipt")"
ledger_version_id="$(jq -er '.ledger_version_id' "$baseline_receipt")"
ledger_bundle_sha256="$(jq -er '.ledger_bundle_sha256' "$baseline_receipt")"
jq -n \
  --arg ref "main" \
  --arg consumer_sha "$candidate_sha" \
  --arg consumer_version_id "$consumer_version_id" \
  --arg provider_version_id "$provider_version_id" \
  --arg provider_bundle_sha256 "$provider_bundle_sha256" \
  --arg ledger_version_id "$ledger_version_id" \
  --arg ledger_bundle_sha256 "$ledger_bundle_sha256" \
  '{ref:$ref,inputs:{consumer_sha:$consumer_sha,consumer_version_path:"/health/version",
    acceptance_ceiling_usd:"0.25",provider_version_id:$provider_version_id,
    provider_bundle_sha256:$provider_bundle_sha256,ledger_version_id:$ledger_version_id,
    ledger_bundle_sha256:$ledger_bundle_sha256,consumer_version_id:$consumer_version_id}}' \
  > "$dispatch_dir/request.json"

env GH_TOKEN="$token" "$gh_bin" api --method POST \
  "/repos/$repository/actions/workflows/$workflow_file/dispatches" \
  --input "$dispatch_dir/request.json" > "$dispatch_dir/post-response.txt"

selected_run=""
for ((attempt = 1; attempt <= poll_attempts; attempt += 1)); do
  env GH_TOKEN="$token" "$gh_bin" api "$runs_endpoint" > "$dispatch_dir/runs-after.json"
  jq -c \
    --arg head_sha "$baseline_head_sha" \
    --arg repository "$repository" \
    --arg workflow_name "$workflow_name" \
    --arg workflow_path "$workflow_path" \
    --slurpfile before "$dispatch_dir/run-ids-before.json" '
      [.workflow_runs[] |
        select((.id as $id | ($before[0] | index($id)) == null)) |
        select(
          .name == $workflow_name and
          (.path == $workflow_path or .path == ($workflow_path + "@refs/heads/main")) and
          .event == "workflow_dispatch" and .head_branch == "main" and
          .head_sha == $head_sha and .repository.full_name == $repository
        )
      ]
    ' "$dispatch_dir/runs-after.json" > "$dispatch_dir/candidates.json"
  candidate_count="$(jq -er 'length' "$dispatch_dir/candidates.json")"
  if ((candidate_count > 1)); then
    echo "::error::More than one new exact-head Team AI run appeared after dispatch"
    exit 1
  fi
  if ((candidate_count == 1)); then
    jq '.[0]' "$dispatch_dir/candidates.json" > "$run_dir/workflow-run.json"
    status="$(jq -er '.status' "$run_dir/workflow-run.json")"
    if [[ "$status" == "completed" ]]; then
      test "$(jq -er '.conclusion' "$run_dir/workflow-run.json")" = "success"
      selected_run="$(jq -er '.id | select(type == "number" and . > 0)' "$run_dir/workflow-run.json")"
      break
    fi
    [[ "$status" == "queued" || "$status" == "in_progress" || "$status" == "waiting" || "$status" == "pending" || "$status" == "requested" ]]
  fi
  ((attempt < poll_attempts)) && sleep "$poll_seconds"
done
test -n "$selected_run"

artifact_name="omdala-staging-ai-receipt-$baseline_head_sha"
install -d -m 700 "$receipt_dir"
env GH_TOKEN="$token" "$gh_bin" run download "$selected_run" \
  --repo "$repository" --name "$artifact_name" --dir "$receipt_dir"
test -z "$(find "$receipt_dir" -type l -print -quit)"
test "$(find "$receipt_dir" -mindepth 1 -maxdepth 1 -type f | wc -l | tr -d ' ')" = "1"
test -f "$receipt_dir/omdala-staging-ai-receipt.json"

jq -e \
  --arg candidate_sha "$candidate_sha" \
  --arg consumer_version_id "$consumer_version_id" \
  --arg head_sha "$baseline_head_sha" \
  --arg provider_version_id "$provider_version_id" \
  --arg provider_bundle_sha256 "$provider_bundle_sha256" \
  --arg ledger_version_id "$ledger_version_id" \
  --arg ledger_bundle_sha256 "$ledger_bundle_sha256" '
    .ok == true and .result == "OMDALA_STAGING_ALL_MODEL_RECONCILIATION_PASS" and .failure == null and
    .provider_source_sha == $head_sha and .ledger_release_sha == $head_sha and
    .consumer_source_sha == $candidate_sha and
    .consumer_version_id == $consumer_version_id and .consumer_deployment_id == $consumer_version_id and
    .provider_version_id == $provider_version_id and .provider_deployment_id == $provider_version_id and
    .provider_bundle_sha256 == $provider_bundle_sha256 and
    .ledger_version_id == $ledger_version_id and .ledger_deployment_id == $ledger_version_id and
    .ledger_bundle_sha256 == $ledger_bundle_sha256 and
    .configured_acceptance_ceiling_usd <= 0.25 and
    .secret_values_logged == false and .production_mutated == false
  ' "$receipt_dir/omdala-staging-ai-receipt.json" >/dev/null

jq -n \
  --argjson run_id "$selected_run" \
  --arg source_repository "$repository" \
  --arg workflow_path "$workflow_path" \
  --arg workflow_head_sha "$baseline_head_sha" \
  --arg candidate_sha "$candidate_sha" \
  --arg consumer_version_id "$consumer_version_id" \
  --arg provider_version_id "$provider_version_id" \
  --arg provider_bundle_sha256 "$provider_bundle_sha256" \
  --arg ledger_version_id "$ledger_version_id" \
  --arg ledger_bundle_sha256 "$ledger_bundle_sha256" \
  --arg request_sha256 "$(digest_file "$dispatch_dir/request.json")" \
  --arg run_sha256 "$(digest_file "$run_dir/workflow-run.json")" \
  --arg receipt_sha256 "$(digest_file "$receipt_dir/omdala-staging-ai-receipt.json")" \
  --arg verified_at "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  '{schema_version:1,verdict:"TEAM_AI_POST_DEPLOY_ACCEPTANCE_DISPATCH_VERIFIED",
    run_id:$run_id,source_repository:$source_repository,workflow_path:$workflow_path,
    workflow_head_sha:$workflow_head_sha,candidate_sha:$candidate_sha,
    consumer_version_id:$consumer_version_id,provider_version_id:$provider_version_id,
    provider_bundle_sha256:$provider_bundle_sha256,ledger_version_id:$ledger_version_id,
    ledger_bundle_sha256:$ledger_bundle_sha256,acceptance_ceiling_usd:0.25,
    dispatch_request_sha256:$request_sha256,run_metadata_sha256:$run_sha256,
    acceptance_receipt_sha256:$receipt_sha256,protected_environment_required:true,
    contains_secret_values:false,production_mutated:false,verified_at:$verified_at}' \
  > "$output_root/dispatch-receipt.json"
