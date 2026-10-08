#!/usr/bin/env bash
# shellcheck disable=SC2016,SC2329
set -uo pipefail

transaction_mode="${1:?transaction mode is required}"
capsule_path="${2:?recovery capsule path is required}"
journal_path="${3:?transaction journal path is required}"
evidence_dir="${4:?transaction evidence directory is required}"
hook_script="${STAGING_TRANSACTION_HOOK_SCRIPT:-}"
wrangler_bin="${WRANGLER_BIN:-services/api/node_modules/.bin/wrangler}"
recovery_script="${STAGING_RECOVERY_SCRIPT:-scripts/staging-transaction-recovery.sh}"
provider_credential_file="${STAGING_PROVIDER_CREDENTIAL_FILE:?STAGING_PROVIDER_CREDENTIAL_FILE is required}"
poll_seconds="${STAGING_RECOVERY_POLL_SECONDS:-10}"
script_root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
signal_name=""
finalizing=0

[[ "$transaction_mode" == "deploy" || "$transaction_mode" == "recovery-only" ]] || {
  echo "::error::Transaction mode must be deploy or recovery-only"
  exit 1
}
mkdir -p "$evidence_dir/provider" "$evidence_dir/authority"

digest_file() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | awk '{print $1}'
  else
    shasum -a 256 "$1" | awk '{print $1}'
  fi
}

provider_exec() {
  local token account_id
  token="$(jq -er '.CLOUDFLARE_API_TOKEN | select(type == "string" and length > 0)' "$provider_credential_file")" || return 1
  account_id="$(jq -er '.CLOUDFLARE_ACCOUNT_ID | select(type == "string" and test("^[a-f0-9]{32}$"))' "$provider_credential_file")" || return 1
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
  local name="$1" phase="$2" token account_id worker raw receipt http_status
  token="$(jq -er '.CLOUDFLARE_API_TOKEN | select(type == "string" and length > 0)' "$provider_credential_file")" || return 1
  account_id="$(jq -er '.CLOUDFLARE_ACCOUNT_ID | select(type == "string" and test("^[a-f0-9]{32}$"))' "$provider_credential_file")" || return 1
  worker="$(worker_for_target "$name")" || return 1
  raw="$evidence_dir/provider/${name}-${phase}-scripts-inventory.json"
  receipt="$evidence_dir/provider/${name}-${phase}-absence-authority.json"
  http_status="$(curl --retry 3 --retry-all-errors --silent --show-error \
    --output "${raw}.tmp" --write-out '%{http_code}' \
    --header "Authorization: Bearer $token" --header 'Accept: application/json' \
    "https://api.cloudflare.com/client/v4/accounts/$account_id/workers/scripts?page=1&per_page=1000")" || return 1
  [[ "$http_status" == "200" ]] || return 1
  mv "${raw}.tmp" "$raw"
  node "$script_root/verify-cloudflare-worker-absence.mjs" --inventory "$raw" \
    --worker-name "$worker" --account-id "$account_id" --output "$receipt" || return 1
}

atomic_journal() {
  local filter="$1"
  shift
  local temporary="${journal_path}.tmp"
  jq "$@" "$filter" "$journal_path" > "$temporary" || return 1
  chmod 600 "$temporary"
  mv "$temporary" "$journal_path"
}

snapshot_provider() {
  local name="$1" config="$2" use_staging_environment="$3" phase="$4"
  local output="$evidence_dir/provider/${name}-${phase}-deployments.json"
  local error="$evidence_dir/provider/${name}-${phase}-deployments.stderr"
  local -a args=(deployments list --config "$config")
  [[ "$use_staging_environment" == "true" ]] && args+=(--env staging)
  args+=(--json)
  if provider_exec "${args[@]}" < /dev/null > "${output}.tmp" 2> "$error"; then
    mv "${output}.tmp" "$output"
    if jq -e 'length == 0' "$output" >/dev/null; then
      verify_provider_absence "$name" "$phase" || return 1
    fi
  elif verify_provider_absence "$name" "$phase"; then
    printf '[]\n' > "$output"
    rm -f "${output}.tmp"
  else
    cat "$error" >&2
    return 1
  fi
  jq -e '
    type == "array" and
    (length == 0 or
      ((sort_by(.created_on) | last | .versions | length) == 1 and
       (sort_by(.created_on) | last | .versions[0].percentage) == 100 and
       (sort_by(.created_on) | last | .versions[0].version_id |
         test("^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$"; "i"))))
  ' "$output" >/dev/null || return 1
  printf '%s\n' "$output"
}

current_version() {
  jq -r 'if length == 0 then "" else (sort_by(.created_on) | last | .versions[0].version_id) end' "$1"
}

require_inputs() {
  test -x "$recovery_script" || return 1
  test -f "$provider_credential_file" || return 1
  local provider_account_id trusted_repository
  provider_account_id="$(jq -er '.CLOUDFLARE_ACCOUNT_ID | select(test("^[a-f0-9]{32}$"))' "$provider_credential_file")" || return 1
  trusted_repository="${GITHUB_REPOSITORY:?GITHUB_REPOSITORY is required}"
  [[ "$trusted_repository" == "tranhatam-collab/omdala.com" ]] || return 1
  [[ "${GITHUB_RUN_ID:-}" =~ ^[1-9][0-9]*$ ]] || return 1
  [[ "${GITHUB_RUN_ATTEMPT:-}" == "1" ]] || return 1
  [[ "${GITHUB_SHA:-}" =~ ^[a-f0-9]{40}$ ]] || return 1
  [[ "${GITHUB_WORKFLOW_REF:-}" == "$trusted_repository/.github/workflows/staging-transaction.yml@refs/heads/main" ]] || return 1
  [[ "$transaction_mode" != "deploy" ]] || test -x "$hook_script" || return 1
  local capsule_sha256
  capsule_sha256="$(digest_file "$capsule_path")" || return 1
  jq -e --arg account "$provider_account_id" --arg digest "$capsule_sha256" --arg repository "$trusted_repository" --slurpfile journal "$journal_path" '
    . as $capsule |
    .schema_version == 1 and
    .verdict == "STAGING_RECOVERY_CAPSULE_SEALED" and
    (.candidate_sha | test("^[a-f0-9]{40}$")) and
    (.control_plane_sha | test("^[a-f0-9]{40}$")) and
    (.workflow_run_id | type) == "number" and .workflow_run_id > 0 and
    .workflow_run_attempt == 1 and
    .transaction_id == ("staging-" + (.workflow_run_id | tostring) + "-1") and
    .release_id == ("gh-" + (.workflow_run_id | tostring) + "-1-" + .candidate_sha[0:12]) and
    .cloudflare_account_id == $account and
    .repository == $repository and $repository == "tranhatam-collab/omdala.com" and
    .runner_loss_recovery_authority == "MANUAL_REDISPATCH_REQUIRED" and
    .database_recovery_policy == "additive_migrations_backup_and_manual_restore_only" and
    .target_order == ["api", "web", "app", "auth", "brand"] and
    .reverse_recovery_order == ["brand", "auth", "app", "web", "api"] and
    (.targets | map(keys | sort) | all(. == (["baselineVersionId", "configPath", "configSha256", "deploymentSnapshotSha256", "kind", "name", "useStagingEnvironment", "workerName"] | sort))) and
    (.targets | map({kind,name,workerName,configPath,useStagingEnvironment})) == [
      {kind:"api",name:"api",workerName:"omdala-api-staging",configPath:"services/api/wrangler.release.toml",useStagingEnvironment:true},
      {kind:"surface",name:"web",workerName:"omdala-surface-web-staging",configPath:"infra/staging/surfaces/web.wrangler.jsonc",useStagingEnvironment:false},
      {kind:"surface",name:"app",workerName:"omdala-surface-app-staging",configPath:"infra/staging/surfaces/app.wrangler.jsonc",useStagingEnvironment:false},
      {kind:"surface",name:"auth",workerName:"omdala-surface-auth-staging",configPath:"infra/staging/surfaces/auth.wrangler.jsonc",useStagingEnvironment:false},
      {kind:"surface",name:"brand",workerName:"omdala-surface-brand-staging",configPath:"infra/staging/surfaces/brand.wrangler.jsonc",useStagingEnvironment:false}
    ] and
    (all(.targets[]; (.configSha256 | test("^[a-f0-9]{64}$")) and (.deploymentSnapshotSha256 | test("^[a-f0-9]{64}$")) and
      (.baselineVersionId == null or (.baselineVersionId | test("^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$"; "i"))))) and
    ($journal | length) == 1 and
    ($journal[0].schema_version == 1) and
    ($journal[0].transaction_id == .transaction_id) and
    ($journal[0].candidate_sha == .candidate_sha) and
    ($journal[0].control_plane_sha == .control_plane_sha) and
    ($journal[0].recovery_capsule_sha256 == $digest) and
    ($journal[0].status == "CAPSULE_SEALED_NO_MUTATION" or $journal[0].status == "RECOVERY_ONLY_DISCOVERY" or
      $journal[0].status == "MUTATION_IN_PROGRESS" or $journal[0].status == "STAGING_TRANSACTION_PREPARED_FOR_COMMIT" or
      $journal[0].status == "STAGING_TRANSACTION_FAILED_RECOVERY_VERIFIED" or
      $journal[0].status == "STAGING_RECOVERY_ONLY_VERIFIED") and
    ($journal[0].targets | map(.name)) == ["api", "web", "app", "auth", "brand"] and
    ($journal[0].targets | map(.baseline_version_id)) == ($capsule.targets | map(.baselineVersionId))
  ' "$capsule_path" >/dev/null || return 1
  while IFS= read -r target; do
    local config expected_config_sha256
    config="$(jq -er '.configPath' <<<"$target")" || return 1
    expected_config_sha256="$(jq -er '.configSha256' <<<"$target")" || return 1
    test -f "$config" || return 1
    test "$(digest_file "$config")" = "$expected_config_sha256" || {
      echo "::error::Recovery config changed after capsule seal: ${config}"
      return 1
    }
  done < <(jq -c '.targets[]' "$capsule_path")
}

mark_phase() {
  local status="$1"
  atomic_journal '.status = $status | .updated_at = $updated_at' \
    --arg status "$status" --arg updated_at "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}

mark_migration() {
  local state="$1"
  atomic_journal '.migration.state = $state | .status = "MUTATION_IN_PROGRESS" | .updated_at = $updated_at' \
    --arg state "$state" --arg updated_at "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}

mark_target() {
  local name="$1" state="$2" deployed_version_id="${3:-}"
  atomic_journal '
    .status = "MUTATION_IN_PROGRESS" |
    .updated_at = $updated_at |
    .targets |= map(if .name == $name then
      .state = $state |
      .deployed_version_id = (if $deployed == "" then .deployed_version_id else $deployed end)
    else . end)
  ' --arg name "$name" --arg state "$state" --arg deployed "$deployed_version_id" \
    --arg updated_at "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}

bind_discovered_transaction_version() {
  local name="$1" state="$2" deployed_version_id="$3"
  atomic_journal '
    .updated_at = $updated_at |
    .targets |= map(if .name == $name then
      .state = $state |
      .deployed_version_id = $deployed
    else . end)
  ' --arg name "$name" --arg state "$state" --arg deployed "$deployed_version_id" \
    --arg updated_at "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}

write_provider_manifest() {
  local manifest="$evidence_dir/provider-evidence-manifest.json"
  printf '[]\n' > "${manifest}.targets"
  for name in api web app auth brand; do
    local pre_deployments pre_version pre_secrets pre_secret_receipt pre_binding_receipt
    local pre_absence post_deployments post_version post_secrets post_secret_receipt post_binding_receipt post_absence temporary
    pre_deployments="$evidence_dir/provider/${name}-pre-deployments.json"
    pre_version="$evidence_dir/provider/${name}-pre-version.json"
    pre_secrets="$evidence_dir/provider/${name}-pre-secrets.json"
    pre_secret_receipt="$evidence_dir/authority/${name}-pre-secret-authority.json"
    pre_binding_receipt="$evidence_dir/authority/${name}-pre-binding-authority.json"
    pre_absence="$evidence_dir/provider/${name}-pre-absence-authority.json"
    post_deployments="$evidence_dir/provider/${name}-post-deployments.json"
    post_version="$evidence_dir/provider/${name}-post-version.json"
    post_secrets="$evidence_dir/provider/${name}-post-secrets.json"
    post_secret_receipt="$evidence_dir/authority/${name}-post-secret-authority.json"
    post_binding_receipt="$evidence_dir/authority/${name}-post-binding-authority.json"
    post_absence="$evidence_dir/provider/${name}-post-absence-authority.json"
    for required in "$pre_deployments" "$pre_version" "$pre_secrets" \
      "$pre_secret_receipt" "$pre_binding_receipt" "$post_deployments" "$post_version" \
      "$post_secrets" "$post_secret_receipt" "$post_binding_receipt"; do
      test -f "$required" || return 1
    done
    temporary="${manifest}.targets.tmp"
    jq \
      --arg name "$name" \
      --arg pre_deployments_sha256 "$(digest_file "$pre_deployments")" \
      --arg pre_version_sha256 "$(digest_file "$pre_version")" \
      --arg pre_secrets_sha256 "$(digest_file "$pre_secrets")" \
      --arg pre_secret_authority_sha256 "$(digest_file "$pre_secret_receipt")" \
      --arg pre_binding_authority_sha256 "$(digest_file "$pre_binding_receipt")" \
      --arg pre_absence_authority_sha256 "$([[ ! -f "$pre_absence" ]] || digest_file "$pre_absence")" \
      --arg post_deployments_sha256 "$(digest_file "$post_deployments")" \
      --arg post_version_sha256 "$(digest_file "$post_version")" \
      --arg post_secrets_sha256 "$(digest_file "$post_secrets")" \
      --arg post_secret_authority_sha256 "$(digest_file "$post_secret_receipt")" \
      --arg post_binding_authority_sha256 "$(digest_file "$post_binding_receipt")" \
      --arg post_absence_authority_sha256 "$([[ ! -f "$post_absence" ]] || digest_file "$post_absence")" \
      '. + [{name: $name,
        pre: {deployments_sha256: $pre_deployments_sha256, version_sha256: $pre_version_sha256,
          secret_inventory_sha256: $pre_secrets_sha256,
          secret_authority_sha256: $pre_secret_authority_sha256,
          binding_authority_sha256: $pre_binding_authority_sha256,
          absence_authority_sha256: (if $pre_absence_authority_sha256 == "" then null else $pre_absence_authority_sha256 end)},
        post: {deployments_sha256: $post_deployments_sha256, version_sha256: $post_version_sha256,
          secret_inventory_sha256: $post_secrets_sha256,
          secret_authority_sha256: $post_secret_authority_sha256,
          binding_authority_sha256: $post_binding_authority_sha256,
          absence_authority_sha256: (if $post_absence_authority_sha256 == "" then null else $post_absence_authority_sha256 end)}}]' \
      "${manifest}.targets" > "$temporary" || return 1
    mv "$temporary" "${manifest}.targets"
  done
  jq -n \
    --arg transaction_id "$(jq -er '.transaction_id' "$capsule_path")" \
    --arg release_id "$(jq -er '.release_id' "$capsule_path")" \
    --arg candidate_sha "$(jq -er '.candidate_sha' "$capsule_path")" \
    --argjson targets "$(cat "${manifest}.targets")" \
    '{schema_version: 1, verdict: "STAGING_PROVIDER_EVIDENCE_EXACT",
      transaction_id: $transaction_id, release_id: $release_id,
      candidate_sha: $candidate_sha, targets: $targets}' > "${manifest}.tmp" || return 1
  mv "${manifest}.tmp" "$manifest"
  rm -f "${manifest}.targets"
}

run_deploy_transaction() {
  require_inputs || return 1
  mark_phase "PREFLIGHT_ACCEPTED" || return 1
  mark_migration "attempted" || return 1
  "$hook_script" migrate < /dev/null || return 1
  mark_migration "applied_additive" || return 1

  while IFS= read -r target; do
    local name config use_staging baseline before_path before after_path after
    name="$(jq -er '.name' <<<"$target")" || return 1
    config="$(jq -er '.configPath' <<<"$target")" || return 1
    use_staging="$(jq -r '.useStagingEnvironment' <<<"$target")" || return 1
    baseline="$(jq -r '.baselineVersionId // ""' <<<"$target")" || return 1
    before_path="$(snapshot_provider "$name" "$config" "$use_staging" pre)" || return 1
    before="$(current_version "$before_path")" || return 1
    [[ "$before" == "$baseline" ]] || {
      echo "::error::${name} provider baseline changed after capsule seal"
      return 1
    }
    "$hook_script" authority pre "$name" "$before_path" "$before" < /dev/null || return 1
    mark_target "$name" "attempted" || return 1
    "$hook_script" mutate "$name" < /dev/null || return 1
    after_path="$(snapshot_provider "$name" "$config" "$use_staging" post)" || return 1
    after="$(current_version "$after_path")" || return 1
    [[ -n "$after" && "$after" != "$baseline" ]] || return 1
    "$hook_script" authority post "$name" "$after_path" "$after" < /dev/null || return 1
    mark_target "$name" "deployed" "$after" || return 1
  done < <(jq -c '.targets[]' "$capsule_path")

  write_provider_manifest || return 1
  mark_phase "ALL_TARGETS_DEPLOYED" || return 1
  "$hook_script" accept < /dev/null || return 1
  mark_phase "ACCEPTANCE_VERIFIED" || return 1
  "$hook_script" seal < /dev/null || return 1
  test -f "$evidence_dir/staging-acceptance.json" || return 1
  mark_phase "STAGING_TRANSACTION_PREPARED_FOR_COMMIT" || return 1
}

verify_transaction_ownership() {
  local name="$1" config="$2" use_staging="$3" version_id="$4"
  local version_path="$evidence_dir/provider/${name}-recovery-ownership-version.json"
  local -a args=(versions view "$version_id" --config "$config")
  [[ "$use_staging" == "true" ]] && args+=(--env staging)
  args+=(--json)
  provider_exec "${args[@]}" < /dev/null > "${version_path}.tmp" || return 1
  mv "${version_path}.tmp" "$version_path"
  jq -e \
    --arg version_id "$version_id" \
    --arg release_id "$(jq -er '.release_id' "$capsule_path")" \
    '.id == $version_id and .annotations["workers/message"] == $release_id' \
    "$version_path" >/dev/null || {
      echo "::error::${name} current version is not owned by the exact staging transaction; refusing rollback"
      return 1
    }
}

build_recovery_plan() {
  local plan_path="$1" targets_path="$evidence_dir/recovery-targets.json"
  local mutation_targets_path="$evidence_dir/recovery-mutation-targets.json"
  printf '[]\n' > "$targets_path"
  printf '[]\n' > "$mutation_targets_path"
  while IFS= read -r target; do
    local name state baseline deployed config use_staging worker current_path current disposition temporary
    name="$(jq -er '.name' <<<"$target")" || return 1
    state="$(jq -er '.state' <<<"$target")" || return 1
    [[ "$state" == "pending" || "$state" == "attempted" || "$state" == "deployed" ]] || return 1
    baseline="$(jq -r '.baseline_version_id // ""' <<<"$target")" || return 1
    deployed="$(jq -r '.deployed_version_id // ""' <<<"$target")" || return 1
    config="$(jq -er --arg name "$name" '.targets[] | select(.name == $name) | .configPath' "$capsule_path")" || return 1
    use_staging="$(jq -r --arg name "$name" '.targets[] | select(.name == $name) | .useStagingEnvironment' "$capsule_path")" || return 1
    worker="$(jq -er --arg name "$name" '.targets[] | select(.name == $name) | .workerName' "$capsule_path")" || return 1
    current=""
    disposition="manual_reconciliation_required"
    if current_path="$(snapshot_provider "$name" "$config" "$use_staging" recovery-discovery)" &&
       current="$(current_version "$current_path")"; then
      if [[ "$state" == "pending" ]]; then
        if [[ "$current" == "$baseline" ]]; then
          disposition="pending_unchanged"
        elif [[ -n "$current" ]] && verify_transaction_ownership "$name" "$config" "$use_staging" "$current"; then
          deployed="$current"
          state="attempted"
          bind_discovered_transaction_version "$name" "$state" "$deployed" || return 1
          [[ -z "$baseline" ]] && disposition="delete_required" || disposition="rollback_required"
        else
          echo "::error::${name} changed while its durable journal was stale and the current version is not owned by the exact transaction"
        fi
      elif [[ "$current" == "$baseline" ]]; then
        if [[ -n "$baseline" ]]; then
          disposition="already_at_baseline"
        else
          disposition="already_absent"
        fi
      elif [[ -z "$current" ]]; then
        echo "::error::${name} disappeared after capsule seal; refusing speculative recovery"
      elif [[ -z "$deployed" ]]; then
        if verify_transaction_ownership "$name" "$config" "$use_staging" "$current"; then
          deployed="$current"
          bind_discovered_transaction_version "$name" "$state" "$deployed" || return 1
          [[ -z "$baseline" ]] && disposition="delete_required" || disposition="rollback_required"
        fi
      elif [[ "$current" != "$deployed" ]]; then
        echo "::error::${name} provider state diverged from the journaled transaction version"
      elif verify_transaction_ownership "$name" "$config" "$use_staging" "$current"; then
        [[ -z "$baseline" ]] && disposition="delete_required" || disposition="rollback_required"
      fi
    fi
    if [[ "$disposition" == "rollback_required" || "$disposition" == "delete_required" ]]; then
      jq --arg name "$name" '. + [$name]' "$mutation_targets_path" > "${mutation_targets_path}.tmp" || return 1
      mv "${mutation_targets_path}.tmp" "$mutation_targets_path"
    fi
    temporary="${targets_path}.tmp"
    jq --arg name "$name" --arg worker "$worker" --arg config "$config" \
      --arg state "$state" --arg disposition "$disposition" --arg current "$current" \
      --arg deployed "$deployed" --arg baseline "$baseline" --argjson staging "$use_staging" \
      '. + [{name: $name, workerName: $worker, configPath: $config,
        journalState: $state, disposition: $disposition,
        discoveredVersionId: (if $current == "" then null else $current end),
        deployedVersionId: (if $deployed == "" then null else $deployed end),
        baselineVersionId: (if $baseline == "" then null else $baseline end),
        useStagingEnvironment: $staging}]' "$targets_path" > "$temporary" || return 1
    mv "$temporary" "$targets_path"
  done < <(jq -c '.targets | reverse[]' "$journal_path")
  jq -n --arg transaction_id "$(jq -er '.transaction_id' "$capsule_path")" \
    --arg candidate_sha "$(jq -er '.candidate_sha' "$capsule_path")" \
    --arg control_plane_sha "$(jq -er '.control_plane_sha' "$capsule_path")" \
    --arg repository "$GITHUB_REPOSITORY" \
    --arg workflow_path ".github/workflows/staging-transaction.yml" \
    --arg workflow_ref "$GITHUB_WORKFLOW_REF" \
    --argjson run_id "$GITHUB_RUN_ID" \
    --argjson run_attempt "$GITHUB_RUN_ATTEMPT" \
    --arg execution_control_plane_sha "$GITHUB_SHA" \
    --argjson targets "$(cat "$targets_path")" \
    --argjson mutation_targets "$(cat "$mutation_targets_path")" \
    '{schema_version: 2, verdict: "STAGING_RECOVERY_PLAN_ACCEPTED",
      transaction_id: $transaction_id, candidate_sha: $candidate_sha,
      control_plane_sha: $control_plane_sha,
      recovery_execution: {repository: $repository, workflow_path: $workflow_path,
        workflow_ref: $workflow_ref, run_id: $run_id, run_attempt: $run_attempt,
        control_plane_sha: $execution_control_plane_sha},
      targets: $targets,
      mutation_targets: $mutation_targets}' > "${plan_path}.tmp" || return 1
  mv "${plan_path}.tmp" "$plan_path"
}

recover_transaction() {
  local plan_path="$evidence_dir/recovery-plan.json" recovery_dir="$evidence_dir/recovery"
  mkdir -p "$recovery_dir"
  build_recovery_plan "$plan_path" || return 1
  WRANGLER_BIN="$wrangler_bin" STAGING_RECOVERY_POLL_SECONDS="$poll_seconds" \
    STAGING_PROVIDER_CREDENTIAL_FILE="$provider_credential_file" \
    bash "$recovery_script" "$plan_path" "$recovery_dir"
}

prepare_recovery_only_journal() {
  atomic_journal '
    .status = "RECOVERY_ONLY_DISCOVERY" |
    .updated_at = $updated_at
  ' --arg updated_at "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}

write_executor_receipt() {
  local original_status="$1" recovery_status="$2" verdict="$3"
  local recovery_hash="" acceptance_hash="" provider_hash="" recovery_execution
  [[ ! -f "$evidence_dir/recovery/staging-recovery-receipt.json" ]] || recovery_hash="$(digest_file "$evidence_dir/recovery/staging-recovery-receipt.json")"
  [[ ! -f "$evidence_dir/staging-acceptance.json" ]] || acceptance_hash="$(digest_file "$evidence_dir/staging-acceptance.json")"
  [[ ! -f "$evidence_dir/provider-evidence-manifest.json" ]] || provider_hash="$(digest_file "$evidence_dir/provider-evidence-manifest.json")"
  if [[ -f "$evidence_dir/recovery-plan.json" ]]; then
    recovery_execution="$(jq -cer '.recovery_execution' "$evidence_dir/recovery-plan.json")" || return 1
  else
    recovery_execution="$(jq -nc \
      --arg repository "$GITHUB_REPOSITORY" \
      --arg workflow_path ".github/workflows/staging-transaction.yml" \
      --arg workflow_ref "$GITHUB_WORKFLOW_REF" \
      --argjson run_id "$GITHUB_RUN_ID" \
      --argjson run_attempt "$GITHUB_RUN_ATTEMPT" \
      --arg control_plane_sha "$GITHUB_SHA" \
      '{repository:$repository,workflow_path:$workflow_path,workflow_ref:$workflow_ref,
        run_id:$run_id,run_attempt:$run_attempt,control_plane_sha:$control_plane_sha}')" || return 1
  fi
  jq -n --arg verdict "$verdict" --arg mode "$transaction_mode" \
    --arg transaction_id "$(jq -er '.transaction_id' "$capsule_path")" \
    --arg candidate_sha "$(jq -er '.candidate_sha' "$capsule_path")" \
    --arg control_plane_sha "$(jq -er '.control_plane_sha' "$capsule_path")" \
    --argjson recovery_execution "$recovery_execution" \
    --arg release_id "$(jq -er '.release_id' "$capsule_path")" \
    --arg capsule_sha256 "$(digest_file "$capsule_path")" \
    --arg journal_sha256 "$(digest_file "$journal_path")" \
    --arg recovery_receipt_sha256 "$recovery_hash" \
    --arg acceptance_receipt_sha256 "$acceptance_hash" \
    --arg provider_evidence_manifest_sha256 "$provider_hash" \
    --arg signal "$signal_name" --arg completed_at "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    --argjson original_status "$original_status" --argjson recovery_status "$recovery_status" \
    '{schema_version: 2, verdict: $verdict, mode: $mode,
      transaction_id: $transaction_id, release_id: $release_id,
      candidate_sha: $candidate_sha, control_plane_sha: $control_plane_sha,
      recovery_execution: $recovery_execution,
      recovery_capsule_sha256: $capsule_sha256,
      transaction_journal_sha256: $journal_sha256,
      recovery_receipt_sha256: (if $recovery_receipt_sha256 == "" then null else $recovery_receipt_sha256 end),
      acceptance_receipt_sha256: (if $acceptance_receipt_sha256 == "" then null else $acceptance_receipt_sha256 end),
      provider_evidence_manifest_sha256: (if $provider_evidence_manifest_sha256 == "" then null else $provider_evidence_manifest_sha256 end),
      original_exit_status: $original_status, recovery_exit_status: $recovery_status,
      signal: (if $signal == "" then null else $signal end),
      database_schema_reverted: false, contains_secret_values: false,
      completed_at: $completed_at}' > "$evidence_dir/transaction-executor-receipt.json"
}

finalize_deploy() {
  local original_status="$1" recovery_status=0 verdict="STAGING_TRANSACTION_PREPARED_FOR_COMMIT"
  [[ "$finalizing" == "0" ]] || return
  finalizing=1
  trap '' INT TERM
  if [[ "$original_status" != "0" ]]; then
    verdict="STAGING_TRANSACTION_FAILED_RECOVERY_VERIFIED"
    recover_transaction || recovery_status=$?
    if [[ "$recovery_status" != "0" ]]; then
      verdict="STAGING_TRANSACTION_FAILED_RECOVERY_INCOMPLETE"
    fi
    mark_phase "$verdict" || true
  fi
  "$hook_script" cleanup < /dev/null >/dev/null 2>&1 || true
  write_executor_receipt "$original_status" "$recovery_status" "$verdict" || true
  [[ "$original_status" == "0" && "$recovery_status" == "0" ]]
}

run_recovery_only() {
  require_inputs || return 1
  prepare_recovery_only_journal || return 1
  local recovery_status=0 verdict="STAGING_RECOVERY_ONLY_VERIFIED"
  recover_transaction || recovery_status=$?
  if [[ "$recovery_status" != "0" ]]; then
    verdict="STAGING_RECOVERY_ONLY_INCOMPLETE"
  fi
  mark_phase "$verdict" || true
  write_executor_receipt "$recovery_status" "$recovery_status" "$verdict" || true
  [[ "$recovery_status" == "0" ]]
}

on_signal() {
  signal_name="$1"
  if [[ "$transaction_mode" == "deploy" ]]; then
    local signal_status=0
    finalize_deploy "$2" || signal_status=$?
    exit "$signal_status"
  fi
  exit "$2"
}
trap 'on_signal INT 130' INT
trap 'on_signal TERM 143' TERM

if [[ "$transaction_mode" == "recovery-only" ]]; then
  run_recovery_only
  exit $?
fi

transaction_status=0
run_deploy_transaction || transaction_status=$?
final_status=0
finalize_deploy "$transaction_status" || final_status=$?
exit "$final_status"
