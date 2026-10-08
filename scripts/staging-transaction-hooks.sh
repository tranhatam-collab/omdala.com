#!/usr/bin/env bash
set -euo pipefail

phase="${1:?transaction hook phase is required}"
candidate_root="${CANDIDATE_ROOT:?CANDIDATE_ROOT is required}"
control_plane_root="${CONTROL_PLANE_ROOT:?CONTROL_PLANE_ROOT is required}"
evidence_dir="${STAGING_TRANSACTION_EVIDENCE_DIR:?STAGING_TRANSACTION_EVIDENCE_DIR is required}"
api_config="${API_WRANGLER_CONFIG:?API_WRANGLER_CONFIG is required}"
release_id="${RELEASE_ID:?RELEASE_ID is required}"
provider_credential_file="${STAGING_PROVIDER_CREDENTIAL_FILE:?STAGING_PROVIDER_CREDENTIAL_FILE is required}"
team_ai_credential_file="${STAGING_TEAM_AI_CREDENTIAL_FILE:-}"
ai_reconciliation_credential_file="${STAGING_AI_RECONCILIATION_CREDENTIAL_FILE:-}"
database_credential_file="${STAGING_DATABASE_CREDENTIAL_FILE:?STAGING_DATABASE_CREDENTIAL_FILE is required}"
e2e_credential_file="${STAGING_E2E_CREDENTIAL_FILE:?STAGING_E2E_CREDENTIAL_FILE is required}"
secret_bundle="${STAGING_API_SECRET_BUNDLE:?STAGING_API_SECRET_BUNDLE is required}"
wrangler_bin="${WRANGLER_BIN:?WRANGLER_BIN is required}"

digest_file() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | awk '{print $1}'
  else
    shasum -a 256 "$1" | awk '{print $1}'
  fi
}

provider_value() {
  jq -er --arg key "$1" '.[$key] | select(type == "string" and length > 0)' \
    "$provider_credential_file"
}

provider_exec() {
  local token account_id
  token="$(provider_value CLOUDFLARE_API_TOKEN)"
  account_id="$(provider_value CLOUDFLARE_ACCOUNT_ID)"
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

surface_config() {
  case "$1" in
    web|app|auth|brand)
      printf '%s/infra/staging/surfaces/%s.wrangler.jsonc\n' "$candidate_root" "$1"
      ;;
    *)
      echo "::error::Unknown staging surface target: $1"
      return 1
      ;;
  esac
}

config_for() {
  if [[ "$1" == "api" ]]; then
    printf '%s\n' "$api_config"
  else
    surface_config "$1"
  fi
}

capture_authority() {
  local authority_phase="${1:?authority phase is required}"
  local name="${2:?authority target is required}"
  local deployments_path="${3:?deployment evidence path is required}"
  local version_id="${4:-}"
  local config raw_version raw_secrets secret_receipt binding_receipt secret_phase
  local -a environment_args=()
  [[ "$authority_phase" == "pre" || "$authority_phase" == "post" ]] || return 1
  config="$(config_for "$name")"
  [[ "$name" != "api" ]] || environment_args+=(--env staging)
  raw_version="$evidence_dir/provider/${name}-${authority_phase}-version.json"
  raw_secrets="$evidence_dir/provider/${name}-${authority_phase}-secrets.json"
  secret_receipt="$evidence_dir/authority/${name}-${authority_phase}-secret-authority.json"
  binding_receipt="$evidence_dir/authority/${name}-${authority_phase}-binding-authority.json"
  mkdir -p "$evidence_dir/provider" "$evidence_dir/authority"
  test -f "$deployments_path"

  if [[ -n "$version_id" ]]; then
    provider_exec versions view "$version_id" --config "$config" \
      "${environment_args[@]}" --json < /dev/null > "${raw_version}.tmp"
    mv "${raw_version}.tmp" "$raw_version"
    jq -e --arg version_id "$version_id" '.id == $version_id' "$raw_version" >/dev/null
  else
    printf 'null\n' > "$raw_version"
  fi

  local -a secret_args=(secret list --config "$config")
  secret_args+=("${environment_args[@]}")
  if [[ "$name" == "api" ]]; then
    secret_args+=(--json)
  else
    secret_args+=(--format json)
  fi
  if [[ "$authority_phase" == "pre" && -z "$version_id" ]]; then
    local absence_receipt="${deployments_path%-deployments.json}-absence-authority.json"
    test -f "$absence_receipt"
    jq -e --arg worker "$(jq -er --arg name "$name" '.targets[] | select(.name == $name) | .workerName' "$STAGING_TRANSACTION_EVIDENCE_DIR/capsule/recovery-capsule.json")" \
      '.verdict == "STAGING_WORKER_ABSENCE_EXACT" and .worker_name == $worker and .provider_readback_verified == true' \
      "$absence_receipt" >/dev/null
    printf '[]\n' > "$raw_secrets"
  elif provider_exec "${secret_args[@]}" < /dev/null > "${raw_secrets}.tmp" 2> "${raw_secrets}.stderr"; then
    mv "${raw_secrets}.tmp" "$raw_secrets"
  else
    cat "${raw_secrets}.stderr" >&2
    return 1
  fi

  if [[ "$name" == "api" ]]; then
    local -a secret_verify=(
      node "$control_plane_root/scripts/verify-api-worker-authority.mjs"
      --secret-json "$raw_secrets"
      --environment staging
      --receipt "$secret_receipt"
    )
    if [[ "$authority_phase" == "pre" && -z "$version_id" ]]; then
      secret_verify+=(--allow-missing)
    fi
    "${secret_verify[@]}" >/dev/null
    if [[ "$authority_phase" == "pre" ]]; then
      local -a remote_verify=(
        node "$control_plane_root/scripts/verify-api-worker-authority.mjs"
        --deployments-json "$deployments_path"
        --secret-json "$raw_secrets"
        --version-json "$raw_version"
        --environment staging
        --google-client-id "$(provider_value OMDALA_GOOGLE_CLIENT_ID)"
        --hyperdrive-id "$(provider_value OMDALA_HYPERDRIVE_ID)"
        --receipt "$binding_receipt"
      )
      [[ -n "$version_id" ]] || remote_verify+=(--allow-missing-resource)
      "${remote_verify[@]}" >/dev/null
    else
      node "$control_plane_root/scripts/verify-api-worker-authority.mjs" \
        --version-json "$raw_version" \
        --version-id "$version_id" \
        --release-id "$release_id" \
        --environment staging \
        --release-sha "$CANDIDATE_SHA" \
        --google-client-id "$(provider_value OMDALA_GOOGLE_CLIENT_ID)" \
        --hyperdrive-id "$(provider_value OMDALA_HYPERDRIVE_ID)" \
        --receipt "$binding_receipt" >/dev/null
    fi
  else
    secret_phase="postdeploy"
    [[ "$authority_phase" != "pre" ]] || secret_phase="preflight"
    local -a surface_secret=(
      node "$control_plane_root/scripts/verify-surface-worker-authority.mjs"
      --surface "$name"
      --secret-json "$raw_secrets"
      --phase "$secret_phase"
      --receipt "$secret_receipt"
    )
    if [[ "$authority_phase" == "pre" && -z "$version_id" ]]; then
      surface_secret+=(--provider-worker-missing)
    fi
    "${surface_secret[@]}" >/dev/null
    if [[ -n "$version_id" ]]; then
      local authority_release_id="$release_id"
      if [[ "$authority_phase" == "pre" ]]; then
        authority_release_id="$(jq -er '.annotations["workers/message"] | select(type == "string" and length >= 8)' "$raw_version")"
      fi
      node "$control_plane_root/scripts/verify-surface-worker-authority.mjs" \
        --surface "$name" \
        --version-json "$raw_version" \
        --version-id "$version_id" \
        --release-id "$authority_release_id" \
        --receipt "$binding_receipt" >/dev/null
    else
      jq -n \
        --arg surface "$name" \
        --arg deployments_sha256 "$(digest_file "$deployments_path")" \
        --arg version_sha256 "$(digest_file "$raw_version")" \
        '{schema_version: 1, verdict: "SURFACE_REMOTE_PREFLIGHT_MISSING_STAGING_RESOURCE_ALLOWED",
          surface: $surface, resource_exists: false, binding_inventory_verified: false,
          deployments_evidence_sha256: $deployments_sha256,
          version_evidence_sha256: $version_sha256}' > "$binding_receipt"
    fi
  fi
}

case "$phase" in
  authority)
    capture_authority "${2:?authority phase is required}" "${3:?authority target is required}" \
      "${4:?deployment evidence path is required}" "${5:-}"
    ;;
  migrate)
    database_url="$(jq -er '.OMDALA_DATABASE_URL | select(type == "string" and length > 0)' "$database_credential_file")"
    rm -f "$database_credential_file"
    test ! -e "$database_credential_file"
    compatibility="$evidence_dir/pre-migration-backup/migration-compatibility-before.json"
    test -f "$compatibility"
    while IFS= read -r migration_file; do
      [[ "$migration_file" =~ ^[0-9]{4}_[a-z0-9_]+\.sql$ ]] || {
        echo "::error::Compatibility receipt contains an invalid migration filename"
        exit 1
      }
      migration="$candidate_root/infra/postgres/migrations/$migration_file"
      test -f "$migration"
      env -i HOME="$HOME" PATH="$PATH" DATABASE_URL="$database_url" \
        psql "$database_url" --set ON_ERROR_STOP=1 --file "$migration"
    done < <(jq -r '.pendingMigrations[].file' "$compatibility")
    ;;
  mutate)
    target="${2:?mutation target is required}"
    provider_tmpdir="${STAGING_PROVIDER_TMPDIR:?STAGING_PROVIDER_TMPDIR is required}"
    provider_outdir="$provider_tmpdir/wrangler-deploy-$target"
    test ! -L "$provider_tmpdir"
    sudo --non-interactive --user="#${STAGING_PROVIDER_UID:?STAGING_PROVIDER_UID is required}" -- \
      install -d -m 700 "$provider_outdir"
    case "$target" in
      api)
        test -f "$secret_bundle"
        test ! -L "$secret_bundle"
        provider_secret_bundle="$provider_tmpdir/api-secrets.json"
        trap 'sudo rm -f "$provider_secret_bundle"; rm -f "$secret_bundle"' EXIT
        sudo install -o "$STAGING_PROVIDER_UID" -g "$STAGING_PROVIDER_UID" -m 600 \
          "$secret_bundle" "$provider_secret_bundle"
        provider_exec deploy --config "$api_config" --env staging --strict \
          --message "$release_id" --secrets-file "$provider_secret_bundle" \
          --outdir "$provider_outdir" < /dev/null
        sudo rm -f "$provider_secret_bundle"
        rm -f "$secret_bundle"
        trap - EXIT
        ;;
      web|app|auth|brand)
        provider_exec deploy --config "$(surface_config "$target")" --strict \
          --message "$release_id" --outdir "$provider_outdir" < /dev/null
        ;;
      *)
        echo "::error::Unknown staging mutation target: $target"
        exit 1
        ;;
    esac
    ;;
  accept)
    e2e_value() {
      jq -er --arg key "$1" '.[$key] | select(type == "string" and length > 0)' "$e2e_credential_file"
    }
    e2e_api_deployment_id="$(jq -er '.targets[] | select(.name == "api") | .deployed_version_id' "$STAGING_TRANSACTION_JOURNAL")"
    e2e_app_url="$(e2e_value E2E_STAGING_APP_URL)"
    e2e_auth_url="$(e2e_value E2E_STAGING_AUTH_URL)"
    e2e_api_url="$(e2e_value E2E_STAGING_API_URL)"
    e2e_brand_url="$(e2e_value E2E_STAGING_BRAND_URL)"
    e2e_web_url="$(e2e_value E2E_STAGING_WEB_URL)"
    e2e_test_secret="$(e2e_value E2E_TEST_SECRET)"
    e2e_mail_sink="$(e2e_value E2E_STAGING_MAIL_SINK_ADDRESS)"
    rm -f "$e2e_credential_file"
    test ! -e "$database_credential_file"
    test ! -e "$secret_bundle"
    test ! -e "$e2e_credential_file"
    e2e_uid="${STAGING_E2E_UID:?STAGING_E2E_UID is required}"
    e2e_home="${STAGING_E2E_HOME:?STAGING_E2E_HOME is required}"
    e2e_tmpdir="${STAGING_E2E_TMPDIR:?STAGING_E2E_TMPDIR is required}"
    e2e_output_dir="${STAGING_E2E_OUTPUT_DIR:?STAGING_E2E_OUTPUT_DIR is required}"
    [[ "$e2e_uid" =~ ^[1-9][0-9]*$ ]]
    test "$e2e_uid" != "$(id -u)"
    test "$(stat -c '%u' "$e2e_home")" = "$e2e_uid"
    test "$(stat -c '%u' "$e2e_tmpdir")" = "$e2e_uid"
    test "$(stat -c '%u' "$e2e_output_dir")" = "$e2e_uid"
    if sudo --non-interactive --user="#$e2e_uid" -- test -r "$provider_credential_file"; then
      echo "::error::Candidate E2E identity can read the provider recovery credential"
      exit 1
    fi
    test -r "$provider_credential_file"
    terminate_acceptance_uid() {
      sudo pkill -TERM -U "$e2e_uid" 2>/dev/null || true
      for _ in 1 2 3 4 5; do
        if ! sudo pgrep -U "$e2e_uid" >/dev/null 2>&1; then
          return 0
        fi
        sleep 1
      done
      sudo pkill -KILL -U "$e2e_uid" 2>/dev/null || true
      ! sudo pgrep -U "$e2e_uid" >/dev/null 2>&1
    }
    trap 'terminate_acceptance_uid || true' EXIT
    (
      cd "$control_plane_root"
      sudo --non-interactive --user="#$e2e_uid" -- env -i \
        HOME="$e2e_home" PATH="$PATH" CI=true \
        TMPDIR="$e2e_tmpdir" PLAYWRIGHT_BROWSERS_PATH="$PLAYWRIGHT_BROWSERS_PATH" \
        E2E_STAGING_APP_URL="$e2e_app_url" \
        E2E_STAGING_AUTH_URL="$e2e_auth_url" \
        E2E_STAGING_API_URL="$e2e_api_url" \
        E2E_STAGING_BRAND_URL="$e2e_brand_url" \
        E2E_STAGING_WEB_URL="$e2e_web_url" \
        E2E_TEST_SECRET="$e2e_test_secret" \
        E2E_RELEASE_SHA="$CANDIDATE_SHA" \
        E2E_API_DEPLOYMENT_ID="$e2e_api_deployment_id" \
        E2E_SURFACE_RELEASE_ID="$RELEASE_ID" \
        E2E_STAGING_OUTPUT_DIR="$e2e_output_dir/playwright" \
        E2E_STAGING_JSON_REPORT="$e2e_output_dir/staging-e2e-results.json" \
        E2E_STAGING_AI_CALL_EVIDENCE="$e2e_output_dir/staging-ai-call-evidence.json" \
        E2E_STAGING_MAIL_SINK_ADDRESS="$e2e_mail_sink" \
        E2E_STAGING_MAIL_SINK_EVIDENCE="$e2e_output_dir/staging-mail-sink-evidence.json" \
        "$control_plane_root/apps/app/node_modules/.bin/playwright" test \
          --config "$control_plane_root/apps/app/playwright.staging.config.ts"
    )
    terminate_acceptance_uid
    trap - EXIT
    e2e_files=()
    for e2e_file in staging-e2e-results.json staging-ai-call-evidence.json staging-mail-sink-evidence.json; do
      e2e_file="$e2e_output_dir/$e2e_file"
      sudo test ! -L "$e2e_file"
      test "$(sudo stat -c '%F' -- "$e2e_file")" = "regular file"
      test "$(sudo stat -c '%u' -- "$e2e_file")" = "$e2e_uid"
      e2e_files+=("$e2e_file")
    done
    sudo rm -rf -- "$e2e_output_dir/playwright"
    sudo chown "$(id -u):$(id -g)" -- "$e2e_output_dir" "${e2e_files[@]}"
    sudo chmod 700 "$e2e_output_dir"
    sudo chmod 600 "${e2e_files[@]}"
    node "$control_plane_root/scripts/playwright-staging-receipt.mjs" \
      --report "$e2e_output_dir/staging-e2e-results.json" \
      --receipt "$evidence_dir/staging-e2e-receipt.json" \
      --expected 4 --sha "$CANDIDATE_SHA"
    test -n "$team_ai_credential_file"
    test -f "$team_ai_credential_file"
    test ! -L "$team_ai_credential_file"
    trap 'rm -f "$team_ai_credential_file" "$ai_reconciliation_credential_file"' EXIT
    bash "$control_plane_root/scripts/dispatch-team-ai-staging-acceptance.sh" \
      "$evidence_dir/team-ai/baseline/run/workflow-run.json" \
      "$evidence_dir/team-ai/baseline/receipt/omdala-staging-ai-receipt.json" \
      "$CANDIDATE_SHA" \
      "$e2e_api_deployment_id" \
      "$evidence_dir/team-ai" \
      "$team_ai_credential_file"
    team_ai_run_id="$(jq -er '.run_id | select(type == "number" and . > 0)' "$evidence_dir/team-ai/dispatch-receipt.json")"
    rm -f "$team_ai_credential_file"
    test -n "$ai_reconciliation_credential_file"
    test -f "$ai_reconciliation_credential_file"
    test ! -L "$ai_reconciliation_credential_file"
    node "$control_plane_root/scripts/verify-omdala-ai-call-reconciliation.mjs" \
      --evidence "$e2e_output_dir/staging-ai-call-evidence.json" \
      --team-ai-receipt "$evidence_dir/team-ai/receipt/omdala-staging-ai-receipt.json" \
      --credential "$ai_reconciliation_credential_file" \
      --candidate-sha "$CANDIDATE_SHA" \
      --consumer-version-id "$e2e_api_deployment_id" \
      --output "$evidence_dir/staging-ai-call-reconciliation.json"
    rm -f "$ai_reconciliation_credential_file"
    trap - EXIT
    node "$control_plane_root/scripts/verify-team-ai-staging-receipt.mjs" \
      --run "$evidence_dir/team-ai/run/workflow-run.json" \
      --receipt "$evidence_dir/team-ai/receipt/omdala-staging-ai-receipt.json" \
      --ai-call-evidence "$e2e_output_dir/staging-ai-call-evidence.json" \
      --ai-reconciliation "$evidence_dir/staging-ai-call-reconciliation.json" \
      --candidate-sha "$CANDIDATE_SHA" \
      --consumer-version-id "$e2e_api_deployment_id" \
      --run-id "$team_ai_run_id" \
      --output "$evidence_dir/staging-ai-chain.json"
    node "$control_plane_root/scripts/sanitize-staging-mail-evidence.mjs" \
      --input "$e2e_output_dir/staging-mail-sink-evidence.json" \
      --output "$evidence_dir/staging-mail-sink-evidence.json" \
      --candidate-sha "$CANDIDATE_SHA" \
      --consumer-version-id "$e2e_api_deployment_id" \
      --sink-address "$e2e_mail_sink" \
      --test-secret "$e2e_test_secret"
    rm -rf "$e2e_output_dir"
    jq -e --arg cap "$STAGING_AI_COST_CEILING_USD" '
      .verdict == "STAGING_AI_CHAIN_ACCEPTED" and
      .matrix.configured_acceptance_ceiling_usd <= ($cap | tonumber) and
      .matrix.reconciled_cost_usd <= ($cap | tonumber) and
      .authenticated_omdala_ai_call.provider_run_readback_verified == true and
      .authenticated_omdala_ai_call.provider_signed_receipt_verified == true and
      .authenticated_omdala_ai_call.ledger_reconciliation_verified == true and
      .authenticated_omdala_ai_call.authenticated_consumer_path_verified == true and
      .authenticated_omdala_ai_call.candidate_runtime_values_omitted == true
    ' "$evidence_dir/staging-ai-chain.json" >/dev/null
    jq -e --arg sha "$CANDIDATE_SHA" '
      .schema_version == 1 and .verdict == "STAGING_MAIL_SINK_ACCEPTED" and
      .candidate_sha == $sha and .workspace_id == "omdala.com-staging" and
      .delivery_mode == "sink" and .sink_enforced == true and .sink_address_persisted == false and
      .sink_match_verified == true and
      .provider_message_count == 5 and .original_recipient_count == 5 and
      .delivered_recipient_count == 5 and .contains_secret_values == false and
      (keys | sort) == (["api_origin","candidate_evidence_contract_verified","candidate_sha","consumer_version_id",
        "contains_secret_values","delivered_recipient_count","delivery_mode","original_recipient_count",
        "provider_message_count","schema_version","sink_address_persisted","sink_match_verified",
        "sink_enforced","verdict","verified_at","workspace_id"] | sort)
    ' "$evidence_dir/staging-mail-sink-evidence.json" >/dev/null
    ;;
  seal)
    e2e_receipt="$evidence_dir/staging-e2e-receipt.json"
    ai_chain="$evidence_dir/staging-ai-chain.json"
    mail_receipt="$evidence_dir/staging-mail-sink-evidence.json"
    provider_manifest="$evidence_dir/provider-evidence-manifest.json"
    isolation_receipt="$evidence_dir/preflight/candidate-e2e-isolation.json"
    prepared_ledger_receipt="$evidence_dir/ledger/prepared-append-receipt.json"
    jq -e '.schemaVersion == 1 and .executedAndPassedCount == 4 and .verdict == "STAGING_E2E_ACCEPTED"' "$e2e_receipt" >/dev/null
    jq -e '.verdict == "STAGING_PROVIDER_EVIDENCE_EXACT" and (.targets | map(.name)) == ["api","web","app","auth","brand"] and (.targets | length) == 5' "$provider_manifest" >/dev/null
    jq -e '.verdict == "STAGING_CANDIDATE_E2E_OS_IDENTITY_ISOLATED" and .acceptance_identity_fresh_and_distinct == true and .trusted_browser_runner_owned_read_only == true and .candidate_build_state_reused_for_acceptance == false and .provider_identity_distinct == true and .provider_credential_readable_by_candidate == false and .provider_credential_file_readable_by_provider_identity == false and .database_credential_readable_by_candidate == false and .api_secret_bundle_readable_by_candidate == false and .ai_reconciliation_credential_readable_by_candidate == false and .durable_ledger_credential_readable_by_candidate == false and .team_ai_credential_readable_by_candidate == false and .provider_scratch_readable_by_candidate == false' "$isolation_receipt" >/dev/null
    jq -e --arg transaction "$STAGING_TRANSACTION_ID" '.verdict == "STAGING_DURABLE_LEDGER_APPEND_READBACK_VERIFIED" and .event_type == "PREPARED" and .transaction_id == $transaction and .append_only_schema_verified == true and .production_release_authorized == false' "$prepared_ledger_receipt" >/dev/null
    jq -n \
      --arg candidate_sha "$CANDIDATE_SHA" \
      --arg control_plane_sha "$CONTROL_PLANE_SHA" \
      --arg transaction_id "$STAGING_TRANSACTION_ID" \
      --arg workflow_run_id "$GITHUB_RUN_ID" \
      --arg workflow_run_attempt "$GITHUB_RUN_ATTEMPT" \
      --arg repository "$GITHUB_REPOSITORY" \
      --arg e2e_receipt_sha256 "$(digest_file "$e2e_receipt")" \
      --arg ai_chain_sha256 "$(digest_file "$ai_chain")" \
      --arg mail_receipt_sha256 "$(digest_file "$mail_receipt")" \
      --arg journal_sha256 "$(digest_file "$STAGING_TRANSACTION_JOURNAL")" \
      --arg provider_evidence_manifest_sha256 "$(digest_file "$provider_manifest")" \
      --arg candidate_e2e_isolation_sha256 "$(digest_file "$isolation_receipt")" \
      --arg durable_ledger_prepared_receipt_sha256 "$(digest_file "$prepared_ledger_receipt")" \
      --arg prepared_at "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
      --argjson ai_cost_ceiling_usd "$STAGING_AI_COST_CEILING_USD" \
      --slurpfile provider_evidence "$provider_manifest" \
      '{schema_version: 4, verdict: "STAGING_ACCEPTANCE_PREPARED_UNIFIED_TRANSACTION",
        candidate_sha: $candidate_sha, control_plane_sha: $control_plane_sha,
        staging_transaction_id: $transaction_id, workflow_run_id: ($workflow_run_id | tonumber),
        workflow_run_attempt: ($workflow_run_attempt | tonumber),
        workflow_path: ".github/workflows/staging-transaction.yml", repository: $repository,
        e2e_receipt_sha256: $e2e_receipt_sha256, ai_chain_sha256: $ai_chain_sha256,
        mail_receipt_sha256: $mail_receipt_sha256, transaction_journal_sha256: $journal_sha256,
        provider_evidence_manifest_sha256: $provider_evidence_manifest_sha256,
        candidate_e2e_isolation_sha256: $candidate_e2e_isolation_sha256,
        durable_ledger_prepared_receipt_sha256: $durable_ledger_prepared_receipt_sha256,
        provider_evidence: $provider_evidence[0], ai_cost_ceiling_usd: $ai_cost_ceiling_usd,
        immutable_artifact_published: false, production_release_authorized: false,
        production_release_status: "HOLD_NO_GO", prepared_at: $prepared_at}' \
      > "$evidence_dir/staging-acceptance.json"
    ;;
  cleanup)
    rm -f "$secret_bundle" "$database_credential_file" "$e2e_credential_file"
    [[ -z "${STAGING_PROVIDER_TMPDIR:-}" ]] || sudo rm -f "$STAGING_PROVIDER_TMPDIR/api-secrets.json"
    [[ -z "$ai_reconciliation_credential_file" ]] || rm -f "$ai_reconciliation_credential_file"
    [[ -z "$team_ai_credential_file" ]] || rm -f "$team_ai_credential_file"
    ;;
  *)
    echo "::error::Unknown staging transaction hook phase: $phase"
    exit 1
    ;;
esac
