#!/usr/bin/env bash
set -euo pipefail

plan_path="${1:?recovery plan path is required}"
output_dir="${2:?recovery output directory is required}"
wrangler_bin="${WRANGLER_BIN:-services/api/node_modules/.bin/wrangler}"
poll_seconds="${STAGING_RECOVERY_POLL_SECONDS:-10}"
provider_credential_file="${STAGING_PROVIDER_CREDENTIAL_FILE:?STAGING_PROVIDER_CREDENTIAL_FILE is required}"
script_root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

provider_exec() {
  local token account_id
  token="$(jq -er '.CLOUDFLARE_API_TOKEN | select(type == "string" and length > 0)' "$provider_credential_file")"
  account_id="$(jq -er '.CLOUDFLARE_ACCOUNT_ID | select(type == "string" and test("^[a-f0-9]{32}$"))' "$provider_credential_file")"
  if [[ -n "${STAGING_PROVIDER_UID:-}" ]]; then
    sudo --non-interactive --user="#${STAGING_PROVIDER_UID}" -- env -i \
      HOME="${STAGING_PROVIDER_HOME:?STAGING_PROVIDER_HOME is required}" PATH="$PATH" \
      TMPDIR="${STAGING_PROVIDER_TMPDIR:?STAGING_PROVIDER_TMPDIR is required}" CI="${CI:-true}" \
      CLOUDFLARE_API_TOKEN="$token" CLOUDFLARE_ACCOUNT_ID="$account_id" \
      CLOUDFLARE_API_BASE_URL="https://api.cloudflare.com/client/v4" \
      WRANGLER_API_ENVIRONMENT="production" CLOUDFLARE_COMPLIANCE_REGION="public" \
      CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV="false" CLOUDFLARE_INCLUDE_PROCESS_ENV="false" \
      "$wrangler_bin" "$@" --env-file /dev/null
  else
    env -i HOME="$HOME" PATH="$PATH" CI="${CI:-true}" \
      CLOUDFLARE_API_TOKEN="$token" CLOUDFLARE_ACCOUNT_ID="$account_id" \
      CLOUDFLARE_API_BASE_URL="https://api.cloudflare.com/client/v4" \
      WRANGLER_API_ENVIRONMENT="production" CLOUDFLARE_COMPLIANCE_REGION="public" \
      CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV="false" CLOUDFLARE_INCLUDE_PROCESS_ENV="false" \
      "$wrangler_bin" "$@" --env-file /dev/null
  fi
}

worker_for_target() {
  case "$1" in
    api) printf 'omdala-api-staging\n' ;;
    web|app|auth|brand) printf 'omdala-surface-%s-staging\n' "$1" ;;
    *) return 1 ;;
  esac
}

verify_provider_absence() {
  local name="$1" phase="$2" token account_id worker raw receipt http_status authorization_header_file curl_status
  token="$(jq -er '.CLOUDFLARE_API_TOKEN | select(type == "string" and length > 0)' "$provider_credential_file")" || return 1
  [[ "$token" != *$'\n'* && "$token" != *$'\r'* ]] || return 1
  account_id="$(jq -er '.CLOUDFLARE_ACCOUNT_ID | select(type == "string" and test("^[a-f0-9]{32}$"))' "$provider_credential_file")" || return 1
  worker="$(worker_for_target "$name")" || return 1
  raw="$output_dir/provider/${name}-${phase}-scripts-inventory.json"
  receipt="$output_dir/provider/${name}-${phase}-absence-authority.json"
  authorization_header_file="$(mktemp "${raw}.authorization.XXXXXX")" || return 1
  chmod 600 "$authorization_header_file"
  printf 'Authorization: Bearer %s\nAccept: application/json\n' "$token" > "$authorization_header_file"
  curl_status=0
  http_status="$(curl --retry 3 --retry-all-errors --silent --show-error \
    --output "${raw}.tmp" --write-out '%{http_code}' \
    --header "@$authorization_header_file" \
    "https://api.cloudflare.com/client/v4/accounts/$account_id/workers/scripts?page=1&per_page=1000")" || curl_status=$?
  rm -f "$authorization_header_file"
  [[ "$curl_status" == "0" ]] || return "$curl_status"
  [[ "$http_status" == "200" ]] || return 1
  mv "${raw}.tmp" "$raw"
  node "$script_root/verify-cloudflare-worker-absence.mjs" --inventory "$raw" \
    --worker-name "$worker" --account-id "$account_id" --output "$receipt" || return 1
}

jq -e \
  --arg repository "${GITHUB_REPOSITORY:?GITHUB_REPOSITORY is required}" \
  --arg workflow_ref "${GITHUB_WORKFLOW_REF:?GITHUB_WORKFLOW_REF is required}" \
  --argjson run_id "${GITHUB_RUN_ID:?GITHUB_RUN_ID is required}" \
  --argjson run_attempt "${GITHUB_RUN_ATTEMPT:?GITHUB_RUN_ATTEMPT is required}" \
  --arg control_plane_sha "${GITHUB_SHA:?GITHUB_SHA is required}" '
  .schema_version == 2 and .verdict == "STAGING_RECOVERY_PLAN_ACCEPTED" and
  .recovery_execution == {repository:$repository,workflow_path:".github/workflows/staging-transaction.yml",
    workflow_ref:$workflow_ref,run_id:$run_id,run_attempt:$run_attempt,control_plane_sha:$control_plane_sha} and
  $repository == "tranhatam-collab/omdala.com" and
  $workflow_ref == "tranhatam-collab/omdala.com/.github/workflows/staging-transaction.yml@refs/heads/main" and
  $run_attempt == 1 and ($control_plane_sha | test("^[a-f0-9]{40}$")) and
  (.targets | map(.name)) == ["brand", "auth", "app", "web", "api"] and
  (.targets | map(.name) | unique | length) == 5 and
  ([.targets[] | {name,workerName,configPath,useStagingEnvironment}]) == [
    {name:"brand",workerName:"omdala-surface-brand-staging",configPath:"infra/staging/surfaces/brand.wrangler.jsonc",useStagingEnvironment:false},
    {name:"auth",workerName:"omdala-surface-auth-staging",configPath:"infra/staging/surfaces/auth.wrangler.jsonc",useStagingEnvironment:false},
    {name:"app",workerName:"omdala-surface-app-staging",configPath:"infra/staging/surfaces/app.wrangler.jsonc",useStagingEnvironment:false},
    {name:"web",workerName:"omdala-surface-web-staging",configPath:"infra/staging/surfaces/web.wrangler.jsonc",useStagingEnvironment:false},
    {name:"api",workerName:"omdala-api-staging",configPath:"services/api/wrangler.release.toml",useStagingEnvironment:true}
  ] and
  (.targets | all(
    (.journalState == "pending" or .journalState == "attempted" or .journalState == "deployed") and
    (.disposition == "pending_unchanged" or .disposition == "already_at_baseline" or
     .disposition == "already_absent" or .disposition == "rollback_required" or
     .disposition == "delete_required" or .disposition == "manual_reconciliation_required") and
    (.useStagingEnvironment | type) == "boolean"
  )) and
  .mutation_targets == ([.targets[] | select(
    .disposition == "rollback_required" or .disposition == "delete_required"
  ) | .name])
' \
  "$plan_path" >/dev/null
mkdir -p "$output_dir/provider"
printf '[]\n' > "$output_dir/results.json"

snapshot_provider() {
  local name="$1"
  local config="$2"
  local staging_env="$3"
  local phase="$4"
  local output="$output_dir/provider/${name}-${phase}.json"
  local error="$output_dir/provider/${name}-${phase}.stderr"
  local -a wrangler_args=(deployments list --config "$config")
  if [[ "$staging_env" == "true" ]]; then
    wrangler_args+=(--env staging)
  fi
  wrangler_args+=(--json)
  if provider_exec "${wrangler_args[@]}" \
    < /dev/null > "${output}.tmp" 2> "$error"; then
    mv "${output}.tmp" "$output"
    jq -e '
      type == "array" and
      (length == 0 or
        ((sort_by(.created_on) | last | .versions | length) == 1 and
         (sort_by(.created_on) | last | .versions[0].percentage) == 100 and
         (sort_by(.created_on) | last | .versions[0].version_id |
           test("^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$"; "i"))))
    ' "$output" >/dev/null
    if jq -e 'length == 0' "$output" >/dev/null; then
      verify_provider_absence "$name" "$phase"
    fi
  elif verify_provider_absence "$name" "$phase"; then
    printf '[]\n' > "$output"
    rm -f "${output}.tmp"
  else
    cat "$error" >&2
    return 1
  fi
  printf '%s\n' "$output"
}

current_version() {
  jq -r 'if length == 0 then "" else (sort_by(.created_on) | last | .versions[0].version_id) end' "$1"
}

digest_file() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | awk '{print $1}'
  else
    shasum -a 256 "$1" | awk '{print $1}'
  fi
}

recovery_failed=0
while IFS= read -r target; do
  name="$(jq -er '.name' <<<"$target")"
  worker="$(jq -er '.workerName' <<<"$target")"
  config="$(jq -er '.configPath' <<<"$target")"
  deployed="$(jq -r '.deployedVersionId // ""' <<<"$target")"
  baseline="$(jq -r '.baselineVersionId // ""' <<<"$target")"
  staging_env="$(jq -r '.useStagingEnvironment' <<<"$target")"
  disposition="$(jq -er '.disposition' <<<"$target")"
  if ! (
  set -euo pipefail
  test -f "$config" || {
    echo "::error::Recovery config is missing for ${name}: ${config}"
    exit 1
  }

  before_json="$(snapshot_provider "$name" "$config" "$staging_env" before)"
  before="$(current_version "$before_json")"
  action="$disposition"
  case "$disposition" in
    pending_unchanged|already_at_baseline|already_absent)
      test "$before" = "$baseline" || {
        echo "::error::${name} provider state diverged from its no-mutation recovery disposition"
        exit 1
      }
      ;;
    rollback_required)
      test -n "$baseline"
      test -n "$deployed"
      test "$before" = "$deployed" || {
        echo "::error::${name} provider state diverged; refusing to overwrite an unrelated version"
        exit 1
      }
      rollback_args=(rollback "$baseline" --config "$config")
      if [[ "$staging_env" == "true" ]]; then
        rollback_args+=(--env staging)
      fi
      rollback_args+=(
        --message "compensating rollback for $(jq -r '.transaction_id' "$plan_path")"
        --yes
      )
      provider_exec "${rollback_args[@]}" \
        < /dev/null > "$output_dir/provider/${name}-rollback.json"
      action="rollback"
      ;;
    delete_required)
      test -z "$baseline"
      test -n "$deployed"
      test "$before" = "$deployed" || {
        echo "::error::${name} provider state diverged; refusing to delete an unrelated version"
        exit 1
      }
      delete_args=(delete "$worker" --config "$config")
      if [[ "$staging_env" == "true" ]]; then
        delete_args+=(--env staging)
      fi
      delete_args+=(--force)
      provider_exec "${delete_args[@]}" \
        < /dev/null > "$output_dir/provider/${name}-delete.json"
      action="delete_new_staging_resource"
      ;;
    manual_reconciliation_required)
      echo "::error::${name} requires manual provider reconciliation; continuing other targets"
      exit 1
      ;;
    *) exit 1 ;;
  esac

  verified=false
  after_json=""
  for _ in {1..12}; do
    after_json="$(snapshot_provider "$name" "$config" "$staging_env" readback)"
    after="$(current_version "$after_json")"
    if { [[ -n "$baseline" ]] && [[ "$after" == "$baseline" ]]; } || \
       { [[ -z "$baseline" ]] && [[ -z "$after" ]]; }; then
      verified=true
      break
    fi
    sleep "$poll_seconds"
  done
  test "$verified" = "true" || {
    echo "::error::${name} provider readback did not reach the exact baseline"
    exit 1
  }
  jq \
    --arg name "$name" \
    --arg worker "$worker" \
    --arg deployed "$deployed" \
    --arg baseline "$baseline" \
    --arg disposition "$disposition" \
    --arg action "$action" \
    --arg before "$before" \
    --arg after "$(current_version "$after_json")" \
    '. + [{
      name: $name,
      worker_name: $worker,
      deployed_version_id: (if $deployed == "" then null else $deployed end),
      baseline_version_id: (if $baseline == "" then null else $baseline end),
      disposition: $disposition,
      action: $action,
      provider_version_before: (if $before == "" then null else $before end),
      provider_version_after: (if $after == "" then null else $after end),
      provider_readback_verified: true
    }]' "$output_dir/results.json" > "$output_dir/results.next.json"
  mv "$output_dir/results.next.json" "$output_dir/results.json"
  ); then
    recovery_failed=1
    jq \
      --arg name "$name" \
      --arg worker "$worker" \
      --arg deployed "$deployed" \
      --arg baseline "$baseline" \
      --arg disposition "$disposition" \
      '. + [{
        name: $name,
        worker_name: $worker,
        deployed_version_id: (if $deployed == "" then null else $deployed end),
        baseline_version_id: (if $baseline == "" then null else $baseline end),
        disposition: $disposition,
        action: "recovery_failed",
        provider_version_before: null,
        provider_version_after: null,
        provider_readback_verified: false
      }]' "$output_dir/results.json" > "$output_dir/results.next.json"
    mv "$output_dir/results.next.json" "$output_dir/results.json"
  fi
done < <(jq -c '.targets[]' "$plan_path")

plan_sha256="$(digest_file "$plan_path")"
if [[ "$recovery_failed" == "0" ]]; then
  recovery_verified=true
else
  recovery_verified=false
fi
jq -n \
  --arg transaction_id "$(jq -er '.transaction_id' "$plan_path")" \
  --arg candidate_sha "$(jq -er '.candidate_sha' "$plan_path")" \
  --arg control_plane_sha "$(jq -er '.control_plane_sha' "$plan_path")" \
  --argjson recovery_execution "$(jq -cer '.recovery_execution' "$plan_path")" \
  --arg plan_sha256 "$plan_sha256" \
  --arg completed_at "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --argjson recovery_verified "$recovery_verified" \
  --argjson mutation_targets "$(jq -c '.mutation_targets' "$plan_path")" \
  --slurpfile results "$output_dir/results.json" \
  '{
    schema_version: 2,
    verdict: (if $recovery_verified then "STAGING_COMPENSATING_RECOVERY_VERIFIED" else "STAGING_COMPENSATING_RECOVERY_FAILED" end),
    transaction_id: $transaction_id,
    candidate_sha: $candidate_sha,
    control_plane_sha: $control_plane_sha,
    recovery_execution: $recovery_execution,
    recovery_plan_sha256: $plan_sha256,
    targets: $results[0],
    mutation_targets: $mutation_targets,
    provider_readback_verified: $recovery_verified,
    database_schema_reverted: false,
    completed_at: $completed_at
  }' > "$output_dir/staging-recovery-receipt.json"

exit "$recovery_failed"
