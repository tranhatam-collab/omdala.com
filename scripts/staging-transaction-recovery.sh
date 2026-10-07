#!/usr/bin/env bash
set -euo pipefail

plan_path="${1:?recovery plan path is required}"
output_dir="${2:?recovery output directory is required}"
wrangler_bin="${WRANGLER_BIN:-services/api/node_modules/.bin/wrangler}"
poll_seconds="${STAGING_RECOVERY_POLL_SECONDS:-10}"

jq -e '.schema_version == 1 and .verdict == "STAGING_RECOVERY_PLAN_ACCEPTED"' \
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
  if "$wrangler_bin" "${wrangler_args[@]}" \
    < /dev/null > "${output}.tmp" 2> "$error"; then
    mv "${output}.tmp" "$output"
    jq -e '
      type == "array" and
      (length == 0 or
        ((sort_by(.created_on) | last | .versions | length) == 1 and
         (sort_by(.created_on) | last | .versions[0].percentage) == 100 and
         (sort_by(.created_on) | last | .versions[0].version_id | type) == "string"))
    ' "$output" >/dev/null
  elif grep -Eqi "does not exist|could not find|10007" "$error"; then
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
  deployed="$(jq -er '.deployedVersionId' <<<"$target")"
  baseline="$(jq -r '.baselineVersionId // ""' <<<"$target")"
  staging_env="$(jq -r '.useStagingEnvironment' <<<"$target")"
  if ! (
  set -euo pipefail
  test -f "$config" || {
    echo "::error::Recovery config is missing for ${name}: ${config}"
    exit 1
  }

  before_json="$(snapshot_provider "$name" "$config" "$staging_env" before)"
  before="$(current_version "$before_json")"
  action=""
  if [[ -n "$baseline" ]] && [[ "$before" == "$baseline" ]]; then
    action="already_at_baseline"
  elif [[ -z "$baseline" ]] && [[ -z "$before" ]]; then
    action="already_absent"
  else
    test "$before" = "$deployed" || {
      echo "::error::${name} provider state diverged; refusing to overwrite an unrelated version"
      exit 1
    }
    if [[ -n "$baseline" ]]; then
      rollback_args=(rollback "$baseline" --config "$config")
      if [[ "$staging_env" == "true" ]]; then
        rollback_args+=(--env staging)
      fi
      rollback_args+=(
        --message "compensating rollback for $(jq -r '.transaction_id' "$plan_path")"
        --yes
      )
      "$wrangler_bin" "${rollback_args[@]}" \
        < /dev/null > "$output_dir/provider/${name}-rollback.json"
      action="rollback"
    else
      delete_args=(delete "$worker" --config "$config")
      if [[ "$staging_env" == "true" ]]; then
        delete_args+=(--env staging)
      fi
      delete_args+=(--force)
      "$wrangler_bin" "${delete_args[@]}" \
        < /dev/null > "$output_dir/provider/${name}-delete.json"
      action="delete_new_staging_resource"
    fi
  fi

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
    --arg action "$action" \
    --arg before "$before" \
    --arg after "$(current_version "$after_json")" \
    '. + [{
      name: $name,
      worker_name: $worker,
      deployed_version_id: $deployed,
      baseline_version_id: (if $baseline == "" then null else $baseline end),
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
      '. + [{
        name: $name,
        worker_name: $worker,
        deployed_version_id: $deployed,
        baseline_version_id: (if $baseline == "" then null else $baseline end),
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
  --arg plan_sha256 "$plan_sha256" \
  --arg completed_at "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --argjson recovery_verified "$recovery_verified" \
  --slurpfile results "$output_dir/results.json" \
  '{
    schema_version: 1,
    verdict: (if $recovery_verified then "STAGING_COMPENSATING_RECOVERY_VERIFIED" else "STAGING_COMPENSATING_RECOVERY_FAILED" end),
    transaction_id: $transaction_id,
    candidate_sha: $candidate_sha,
    control_plane_sha: $control_plane_sha,
    recovery_plan_sha256: $plan_sha256,
    targets: $results[0],
    provider_readback_verified: $recovery_verified,
    database_schema_reverted: false,
    completed_at: $completed_at
  }' > "$output_dir/staging-recovery-receipt.json"

exit "$recovery_failed"
