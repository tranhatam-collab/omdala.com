#!/usr/bin/env bash

set -euo pipefail

if [[ "$#" -ne 4 ]]; then
  echo "usage: production-cross-workflow-rollback.sh <gate.json> <api-receipt.json> <surface-receipt.json> <wrangler-config>" >&2
  exit 64
fi

gate_path="$1"
api_receipt_path="$2"
surface_receipt_path="$3"
wrangler_config="$4"
evidence_dir="${PRODUCTION_ROLLBACK_EVIDENCE_DIR:-production-rollback-evidence}"
wrangler_bin="${WRANGLER_BIN:-services/api/node_modules/.bin/wrangler}"

for name in CLOUDFLARE_ACCOUNT_ID CLOUDFLARE_API_TOKEN EXPECTED_MAIN_SHA; do
  [[ -n "${!name:-}" ]] || {
    echo "::error::$name is required" >&2
    exit 1
  }
done

[[ "$EXPECTED_MAIN_SHA" =~ ^[0-9a-f]{40}$ ]] || {
  echo "::error::EXPECTED_MAIN_SHA must be a full lowercase Git SHA" >&2
  exit 1
}

for path in "$gate_path" "$api_receipt_path" "$surface_receipt_path" "$wrangler_config"; do
  [[ -f "$path" ]] || {
    echo "::error::required rollback input is missing: $path" >&2
    exit 1
  }
done
[[ -x "$wrangler_bin" ]] || {
  echo "::error::Wrangler is unavailable at the locked path" >&2
  exit 1
}

digest_file() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | awk '{print $1}'
  else
    shasum -a 256 "$1" | awk '{print $1}'
  fi
}

expected_api_hash="$(jq -er '.receipt_hashes.api' "$gate_path")"
expected_surface_hash="$(jq -er '.receipt_hashes.surfaces' "$gate_path")"
actual_api_hash="$(digest_file "$api_receipt_path")"
actual_surface_hash="$(digest_file "$surface_receipt_path")"

jq -e \
  --arg main_sha "$EXPECTED_MAIN_SHA" \
  --arg account_id "$CLOUDFLARE_ACCOUNT_ID" \
  '.schema_version == 1 and
   .verdict == "PRODUCTION_RELEASE_CHAIN_VERIFIED" and
   .merged_main_sha == $main_sha and
   .cloudflare_account_id == $account_id and
   .tree_equivalence_verified == true and
   (.receipt_hashes.api | test("^[0-9a-f]{64}$")) and
   (.receipt_hashes.surfaces | test("^[0-9a-f]{64}$"))' \
  "$gate_path" >/dev/null

[[ "$actual_api_hash" == "$expected_api_hash" ]] || {
  echo "::error::API release receipt hash does not match the verified rollback gate" >&2
  exit 1
}
[[ "$actual_surface_hash" == "$expected_surface_hash" ]] || {
  echo "::error::surface release receipt hash does not match the verified rollback gate" >&2
  exit 1
}

jq -e \
  --arg main_sha "$EXPECTED_MAIN_SHA" \
  --arg account_id "$CLOUDFLARE_ACCOUNT_ID" \
  '.schema_version == 2 and
   .verdict == "API_RELEASE_ACCEPTED" and
   .environment == "production" and
   .candidate_sha == $main_sha and
   .cloudflare_account_id == $account_id and
   (.version_id | test("^[0-9a-f-]{36}$")) and
   (.previous_version_id | test("^[0-9a-f-]{36}$")) and
   .version_id != .previous_version_id and
   .migration_compatibility_verified == true and
   (.migration_compatibility_receipt_sha256 | test("^[0-9a-f]{64}$")) and
   (.migration_manifest_sha256 | test("^[0-9a-f]{64}$")) and
   (.migration_ledger_receipt_sha256 | test("^[0-9a-f]{64}$")) and
   .rollback_scope == "code_and_worker_only_database_schema_is_not_reverted" and
   .database_schema_reverted_by_code_rollback == false and
   .pre_migration_remote_preflight_verified == true and
   (.api_remote_preflight_receipt_sha256 | test("^[0-9a-f]{64}$")) and
   (.hyperdrive_remote_preflight_receipt_sha256 | test("^[0-9a-f]{64}$"))' \
  "$api_receipt_path" >/dev/null

jq -e \
  --arg main_sha "$EXPECTED_MAIN_SHA" \
  --arg account_id "$CLOUDFLARE_ACCOUNT_ID" \
  '.schema_version == 4 and
   .verdict == "SURFACE_RELEASE_ACCEPTED" and
   .environment == "production" and
   .candidate_sha == $main_sha and
   .cloudflare_account_id == $account_id and
   (.pages_deployments | keys | sort) == ["app", "auth", "brand", "web"] and
   ([.pages_deployments[] |
      (.platform == "cloudflare-pages") and
      (.environment == "production") and
      (.source_sha == $main_sha) and
      (.project_name | type == "string" and length > 0) and
      (.deployment_id | test("^[0-9a-f-]{36}$")) and
      (.previous_deployment_id | test("^[0-9a-f-]{36}$")) and
      (.deployment_id != .previous_deployment_id)] | all)' \
  "$surface_receipt_path" >/dev/null

mkdir -p "$evidence_dir/pages"

api_candidate="$(jq -er '.version_id' "$api_receipt_path")"
api_previous="$(jq -er '.previous_version_id' "$api_receipt_path")"
"$wrangler_bin" deployments list --config "$wrangler_config" --json > "$evidence_dir/api-before.json"
api_current="$(jq -er 'sort_by(.created_on) | last | select(.versions | length == 1) | select(.versions[0].percentage == 100) | .versions[0].version_id' "$evidence_dir/api-before.json")"
[[ "$api_current" == "$api_candidate" || "$api_current" == "$api_previous" ]] || {
  echo "::error::API provider state no longer matches the accepted candidate or its rollback baseline" >&2
  exit 1
}

for surface in web app auth brand; do
  project="$(jq -er --arg surface "$surface" '.pages_deployments[$surface].project_name' "$surface_receipt_path")"
  candidate="$(jq -er --arg surface "$surface" '.pages_deployments[$surface].deployment_id' "$surface_receipt_path")"
  previous="$(jq -er --arg surface "$surface" '.pages_deployments[$surface].previous_deployment_id' "$surface_receipt_path")"
  curl --fail --silent --show-error \
    --header "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    --header "Content-Type: application/json" \
    "https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/pages/projects/${project}" \
    > "$evidence_dir/pages/${surface}-before.json"
  current="$(jq -er '.result.canonical_deployment.id' "$evidence_dir/pages/${surface}-before.json")"
  [[ "$current" == "$candidate" || "$current" == "$previous" ]] || {
    echo "::error::$surface provider state no longer matches the accepted candidate or its rollback baseline" >&2
    exit 1
  }
done

rollback_failed=0
if [[ "$api_current" == "$api_candidate" ]]; then
  "$wrangler_bin" rollback "$api_previous" \
    --config "$wrangler_config" \
    --message "automatic rollback after rejected production acceptance" \
    --yes || rollback_failed=1
fi

for surface in web app auth brand; do
  project="$(jq -er --arg surface "$surface" '.pages_deployments[$surface].project_name' "$surface_receipt_path")"
  candidate="$(jq -er --arg surface "$surface" '.pages_deployments[$surface].deployment_id' "$surface_receipt_path")"
  previous="$(jq -er --arg surface "$surface" '.pages_deployments[$surface].previous_deployment_id' "$surface_receipt_path")"
  current="$(jq -er '.result.canonical_deployment.id' "$evidence_dir/pages/${surface}-before.json")"
  if [[ "$current" == "$candidate" ]]; then
    if ! curl --fail --silent --show-error \
      --request POST \
      --header "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
      --header "Content-Type: application/json" \
      --data '{}' \
      "https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/pages/projects/${project}/deployments/${previous}/rollback" \
      > "$evidence_dir/pages/${surface}-rollback.json"; then
      rollback_failed=1
    elif ! jq -e '.success == true' "$evidence_dir/pages/${surface}-rollback.json" >/dev/null; then
      rollback_failed=1
    fi
  fi
done

api_restored=false
for _ in {1..12}; do
  if "$wrangler_bin" deployments list --config "$wrangler_config" --json > "$evidence_dir/api-after.json"; then
    restored="$(jq -r 'sort_by(.created_on) | last | if ((.versions | length) == 1 and .versions[0].percentage == 100) then .versions[0].version_id else "" end' "$evidence_dir/api-after.json")"
    if [[ "$restored" == "$api_previous" ]]; then
      api_restored=true
      break
    fi
  fi
  sleep 10
done
[[ "$api_restored" == "true" ]] || rollback_failed=1

for surface in web app auth brand; do
  project="$(jq -er --arg surface "$surface" '.pages_deployments[$surface].project_name' "$surface_receipt_path")"
  previous="$(jq -er --arg surface "$surface" '.pages_deployments[$surface].previous_deployment_id' "$surface_receipt_path")"
  restored=false
  for _ in {1..12}; do
    if curl --fail --silent --show-error \
      --header "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
      --header "Content-Type: application/json" \
      "https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/pages/projects/${project}" \
      > "$evidence_dir/pages/${surface}-after.json"; then
      current="$(jq -r '.result.canonical_deployment.id // ""' "$evidence_dir/pages/${surface}-after.json")"
      if [[ "$current" == "$previous" ]]; then
        restored=true
        break
      fi
    fi
    sleep 10
  done
  [[ "$restored" == "true" ]] || rollback_failed=1
done

jq -n \
  --arg verdict "$([[ "$rollback_failed" -eq 0 ]] && printf ROLLBACK_VERIFIED || printf ROLLBACK_FAILED)" \
  --arg merged_main_sha "$EXPECTED_MAIN_SHA" \
  --arg cloudflare_account_id "$CLOUDFLARE_ACCOUNT_ID" \
  --arg api_rejected_version_id "$api_candidate" \
  --arg api_restored_version_id "$api_previous" \
  --arg api_receipt_sha256 "$actual_api_hash" \
  --arg surface_receipt_sha256 "$actual_surface_hash" \
  --arg completed_at "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  '{
    schema_version: 1,
    verdict: $verdict,
    merged_main_sha: $merged_main_sha,
    cloudflare_account_id: $cloudflare_account_id,
    api_rejected_version_id: $api_rejected_version_id,
    api_restored_version_id: $api_restored_version_id,
    api_receipt_sha256: $api_receipt_sha256,
    surface_receipt_sha256: $surface_receipt_sha256,
    rollback_scope: "code_and_surfaces_only_database_schema_is_not_reverted",
    database_schema_reverted: false,
    completed_at: $completed_at
  }' > "$evidence_dir/rollback-receipt.json"

exit "$rollback_failed"
