#!/usr/bin/env bash
set -euo pipefail

command_name="${1:?ledger command is required}"
credential_file="${STAGING_LEDGER_CREDENTIAL_FILE:?STAGING_LEDGER_CREDENTIAL_FILE is required}"
control_plane_root="${CONTROL_PLANE_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
ledger_config="$control_plane_root/infra/staging/ledger-d1.json"
token="$(jq -er '.CLOUDFLARE_D1_TOKEN | select(type == "string" and length >= 32)' "$credential_file")"
account_id="$(jq -er '.CLOUDFLARE_ACCOUNT_ID | select(test("^[a-f0-9]{32}$"))' "$credential_file")"
database_id="$(jq -er '.D1_DATABASE_ID | select(test("^[a-f0-9-]{36}$"))' "$credential_file")"
expected_database_id="$(jq -er '.database_id | select(test("^[a-f0-9-]{36}$"))' "$ledger_config")"
test "$database_id" = "$expected_database_id"
endpoint="https://api.cloudflare.com/client/v4/accounts/$account_id/d1/database/$database_id/query"

post_read_query() {
  local request="$1" output="$2"
  env -i HOME="$HOME" PATH="$PATH" \
    curl --fail-with-body --silent --show-error \
      --connect-timeout 10 --max-time 30 \
      --retry 3 --retry-all-errors --retry-delay 1 \
      --request POST \
      --header "Authorization: Bearer $token" \
      --header "Content-Type: application/json" \
      --data-binary "@$request" \
      "$endpoint" > "$output"
}

post_mutation_once() {
  local request="$1" output="$2" http_status_output="$3" http_status="" curl_status=0
  # A mutating POST is attempted exactly once. Retrying invisibly could turn a
  # committed-but-lost response into a later rejection and unsafe compensation.
  http_status="$(env -i HOME="$HOME" PATH="$PATH" \
    curl --silent --show-error \
      --connect-timeout 10 --max-time 30 \
      --request POST \
      --header "Authorization: Bearer $token" \
      --header "Content-Type: application/json" \
      --data-binary "@$request" \
      --output "$output" \
      --write-out '%{http_code}' \
      "$endpoint")" || curl_status=$?
  [[ "$http_status" =~ ^[0-9]{3}$ ]] || http_status="000"
  printf '%s\n' "$http_status" > "$http_status_output"
  return "$curl_status"
}

verify_query_response() {
  jq -e '.success == true and (.errors | type == "array" and length == 0) and (.result | type == "array" and length == 1) and .result[0].success == true and (.result[0].results | type == "array")' "$1" >/dev/null
}

strict_query() {
  post_read_query "$1" "$2"
  verify_query_response "$2"
}

write_request() {
  local path="$1" sql="$2"
  jq -n --arg sql "$sql" '{sql:$sql,params:[]}' > "$path"
}

case "$command_name" in
  verify-and-list)
    output="${2:?event output path is required}"
    evidence_dir="${3:?ledger evidence directory is required}"
    page_size="$(jq -er '.scan_page_size | select(type == "number" and . >= 1 and . <= 100)' "$ledger_config")"
    mkdir -p "$evidence_dir/pages"

    write_request "$evidence_dir/schema-marker-request.json" \
      "SELECT schema_version, database_name FROM staging_transaction_ledger_schema WHERE singleton = 1"
    write_request "$evidence_dir/schema-activation-request.json" \
      "SELECT singleton, activation_epoch, reconciliation_receipt_sha256, reconciliation_payload_json, activated_at FROM staging_transaction_ledger_activation WHERE singleton = 1"
    write_request "$evidence_dir/schema-objects-request.json" \
      "SELECT type,name,tbl_name,sql FROM sqlite_master WHERE name IN ('staging_transaction_ledger_schema','staging_transaction_ledger_activation','staging_transaction_events') OR tbl_name IN ('staging_transaction_ledger_schema','staging_transaction_ledger_activation','staging_transaction_events') ORDER BY type,name"
    write_request "$evidence_dir/schema-columns-request.json" \
      "SELECT 'staging_transaction_ledger_schema' AS table_name,* FROM pragma_table_info('staging_transaction_ledger_schema') UNION ALL SELECT 'staging_transaction_ledger_activation' AS table_name,* FROM pragma_table_info('staging_transaction_ledger_activation') UNION ALL SELECT 'staging_transaction_events' AS table_name,* FROM pragma_table_info('staging_transaction_events') ORDER BY table_name,cid"
    write_request "$evidence_dir/schema-indexes-request.json" \
      "SELECT 'staging_transaction_ledger_schema' AS table_name,* FROM pragma_index_list('staging_transaction_ledger_schema') UNION ALL SELECT 'staging_transaction_ledger_activation' AS table_name,* FROM pragma_index_list('staging_transaction_ledger_activation') UNION ALL SELECT 'staging_transaction_events' AS table_name,* FROM pragma_index_list('staging_transaction_events') ORDER BY table_name,seq"
    write_request "$evidence_dir/schema-index-columns-request.json" \
      "SELECT 'staging_transaction_ledger_schema' AS table_name,l.name AS index_name,i.seqno,i.cid,i.name FROM pragma_index_list('staging_transaction_ledger_schema') l JOIN pragma_index_info(l.name) i UNION ALL SELECT 'staging_transaction_ledger_activation' AS table_name,l.name AS index_name,i.seqno,i.cid,i.name FROM pragma_index_list('staging_transaction_ledger_activation') l JOIN pragma_index_info(l.name) i UNION ALL SELECT 'staging_transaction_events' AS table_name,l.name AS index_name,i.seqno,i.cid,i.name FROM pragma_index_list('staging_transaction_events') l JOIN pragma_index_info(l.name) i ORDER BY table_name,index_name,seqno"
    for name in marker activation objects columns indexes index-columns; do
      strict_query "$evidence_dir/schema-$name-request.json" "$evidence_dir/schema-$name-response.json"
    done
    node "$control_plane_root/scripts/staging-durable-ledger-evidence.mjs" verify-schema \
      --evidence-dir "$evidence_dir" \
      --config "$ledger_config" \
      --receipt "$evidence_dir/schema-verification-receipt.json"

    write_request "$evidence_dir/count-before-request.json" \
      "SELECT count(*) AS event_count, COALESCE(max(rowid), 0) AS high_water_rowid FROM staging_transaction_events"
    strict_query "$evidence_dir/count-before-request.json" "$evidence_dir/count-before-response.json"
    event_count="$(jq -er '.result[0].results | select(length == 1) | .[0].event_count | select(type == "number" and . >= 0)' "$evidence_dir/count-before-response.json")"
    high_water_rowid="$(jq -er '.result[0].results[0].high_water_rowid | select(type == "number" and . >= 0)' "$evidence_dir/count-before-response.json")"
    page_count=$(( (event_count + page_size - 1) / page_size ))
    after_rowid=0
    for (( page_index=0; page_index<page_count; page_index+=1 )); do
      page_name="page-$(printf '%06d' "$page_index")"
      sql="SELECT rowid AS ledger_rowid, event_id, transaction_id, event_type, event_sequence, workflow_run_id, candidate_sha, prepared_sha256, payload_sha256, payload_json, created_at FROM staging_transaction_events WHERE rowid > ? AND rowid <= ? ORDER BY rowid LIMIT ?"
      jq -n --arg sql "$sql" --argjson after "$after_rowid" --argjson high_water "$high_water_rowid" --argjson limit "$page_size" '{sql:$sql,params:[$after,$high_water,$limit]}' > "$evidence_dir/pages/$page_name-request.json"
      strict_query "$evidence_dir/pages/$page_name-request.json" "$evidence_dir/pages/$page_name-response.json"
      after_rowid="$(jq -er '.result[0].results | select(length > 0) | .[-1].ledger_rowid | select(type == "number")' "$evidence_dir/pages/$page_name-response.json")"
    done
    write_request "$evidence_dir/count-after-request.json" \
      "SELECT count(*) AS event_count, COALESCE(max(rowid), 0) AS high_water_rowid FROM staging_transaction_events"
    strict_query "$evidence_dir/count-after-request.json" "$evidence_dir/count-after-response.json"
    node "$control_plane_root/scripts/staging-durable-ledger-evidence.mjs" assemble-pages \
      --count-before "$evidence_dir/count-before-response.json" \
      --count-after "$evidence_dir/count-after-response.json" \
      --pages-dir "$evidence_dir/pages" \
      --page-size "$page_size" \
      --output "$output"
    ;;
  append)
    event_type="${2:?ledger event type is required}"
    record_file="${3:?ledger record file is required}"
    receipt_file="${4:?ledger append receipt is required}"
    [[ "$event_type" == "PREPARED" || "$event_type" == "COMMITTED" || "$event_type" == "RECOVERED" ]]
    test -f "$record_file"
    test "$(wc -c < "$record_file" | tr -d '[:space:]')" -le 1048576
    transaction_id="$(jq -er '.transaction_id | select(test("^staging-[1-9][0-9]*-1$"))' "$record_file")"
    workflow_run_id="$(jq -er '.workflow_run_id | select(type == "number" and . > 0)' "$record_file")"
    candidate_sha="$(jq -er '.candidate_sha | select(test("^[a-f0-9]{40}$"))' "$record_file")"
    payload_sha256="$(sha256sum "$record_file" | awk '{print $1}')"
    prepared_sha256="$payload_sha256"
    event_sequence=0
    record_type="capsule"
    if [[ "$event_type" != "PREPARED" ]]; then
      prepared_sha256="$(jq -er '.prepared_record_sha256 | select(test("^[a-f0-9]{64}$"))' "$record_file")"
      event_sequence=1
      [[ "$event_type" == "COMMITTED" ]] && record_type="commit" || record_type="recovery"
    fi
    test "$(jq -er '.record_type' "$record_file")" = "$record_type"
    event_id="$transaction_id:$event_type"
    created_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    request_dir="$(mktemp -d)"
    trap 'rm -rf "$request_dir"' EXIT
    if [[ "$event_type" == "PREPARED" ]]; then
      sql="INSERT INTO staging_transaction_events (event_id,transaction_id,event_type,event_sequence,workflow_run_id,candidate_sha,prepared_sha256,payload_sha256,payload_json,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)"
      jq -n --arg sql "$sql" --arg event_id "$event_id" --arg transaction "$transaction_id" --argjson sequence "$event_sequence" --argjson run "$workflow_run_id" --arg candidate "$candidate_sha" --arg prepared "$prepared_sha256" --arg payload_sha "$payload_sha256" --rawfile payload "$record_file" --arg created "$created_at" '{sql:$sql,params:[$event_id,$transaction,"PREPARED",$sequence,$run,$candidate,$prepared,$payload_sha,$payload,$created]}' > "$request_dir/append.json"
    else
      sql="INSERT INTO staging_transaction_events (event_id,transaction_id,event_type,event_sequence,workflow_run_id,candidate_sha,prepared_sha256,payload_sha256,payload_json,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)"
      jq -n --arg sql "$sql" --arg event_id "$event_id" --arg transaction "$transaction_id" --arg event "$event_type" --argjson sequence "$event_sequence" --argjson run "$workflow_run_id" --arg candidate "$candidate_sha" --arg prepared "$prepared_sha256" --arg payload_sha "$payload_sha256" --rawfile payload "$record_file" --arg created "$created_at" '{sql:$sql,params:[$event_id,$transaction,$event,$sequence,$run,$candidate,$prepared,$payload_sha,$payload,$created]}' > "$request_dir/append.json"
    fi

    : > "$request_dir/append-response.json"
    printf '000\n' > "$request_dir/append-http-status.txt"
    append_transport_status=0
    post_mutation_once "$request_dir/append.json" "$request_dir/append-response.json" "$request_dir/append-http-status.txt" || append_transport_status=$?
    append_http_status="$(tr -d '[:space:]' < "$request_dir/append-http-status.txt")"

    readback_sql="SELECT event_id, transaction_id, event_type, event_sequence, workflow_run_id, candidate_sha, prepared_sha256, payload_sha256, payload_json, created_at FROM staging_transaction_events WHERE transaction_id = ? AND event_sequence = ?"
    jq -n --arg sql "$readback_sql" --arg transaction "$transaction_id" --argjson sequence "$event_sequence" '{sql:$sql,params:[$transaction,$sequence]}' > "$request_dir/readback.json"
    : > "$request_dir/readback-response.json"
    for readback_attempt in 1 2 3 4; do
      if post_read_query "$request_dir/readback.json" "$request_dir/readback-attempt-$readback_attempt.json" && verify_query_response "$request_dir/readback-attempt-$readback_attempt.json"; then
        cp "$request_dir/readback-attempt-$readback_attempt.json" "$request_dir/readback-response.json"
        if jq -e '.result[0].results | length > 0' "$request_dir/readback-response.json" >/dev/null; then
          break
        fi
      fi
    done

    mkdir -p "$(dirname "$receipt_file")"
    classification_status=0
    node "$control_plane_root/scripts/staging-transaction-ledger.mjs" classify-append \
      --event "$event_type" \
      --record "$record_file" \
      --append-response "$request_dir/append-response.json" \
      --append-transport-status "$append_transport_status" \
      --append-http-status "$append_http_status" \
      --readback-response "$request_dir/readback-response.json" \
      --database-id "$database_id" \
      --output "$receipt_file" || classification_status=$?
    schema_receipt="${STAGING_LEDGER_SCHEMA_RECEIPT:?STAGING_LEDGER_SCHEMA_RECEIPT is required for append}"
    jq -e --arg database_id "$database_id" --arg schema_manifest_sha256 "$(jq -er '.schema_manifest_sha256' "$ledger_config")" --arg activation_epoch "$(jq -er '.activation_epoch' "$ledger_config")" '
      .schema_version == 1 and .verdict == "STAGING_DURABLE_LEDGER_SCHEMA_EXACT" and
      .database_id == $database_id and .schema_manifest_sha256 == $schema_manifest_sha256 and
      .activation_epoch == $activation_epoch and .append_only_schema_verified == true and
      .production_release_authorized == false
    ' "$schema_receipt" >/dev/null
    jq --argjson append_transport_status "$append_transport_status" --arg append_http_status "$append_http_status" --arg schema_receipt_sha256 "$(sha256sum "$schema_receipt" | awk '{print $1}')" '. + {append_transport_status:$append_transport_status,append_http_status:$append_http_status,schema_verification_receipt_sha256:$schema_receipt_sha256,append_only_schema_verified:true}' "$receipt_file" > "$receipt_file.tmp"
    mv "$receipt_file.tmp" "$receipt_file"
    exit "$classification_status"
    ;;
  *)
    echo "Unknown durable ledger command: $command_name" >&2
    exit 1
    ;;
esac
