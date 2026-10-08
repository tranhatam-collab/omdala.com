#!/usr/bin/env bash
set -euo pipefail

source_root="${1:?materialized D1 recovery input directory is required}"
candidate_root="${2:?neutral candidate workspace is required}"
evidence_dir="${3:?transaction evidence directory is required}"
api_config="${4:?API recovery config path is required}"

digest_file() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | awk '{print $1}'
  else
    shasum -a 256 "$1" | awk '{print $1}'
  fi
}

test -d "$source_root"
test -d "$candidate_root"
test ! -e "$candidate_root/.git"
test -z "$(find "$source_root" -type l -print -quit)"
for required in \
  recovery-capsule.json transaction-journal.json capsule-seal.json \
  capsule-ledger-record.json api.wrangler.release.toml \
  surfaces/web.wrangler.jsonc surfaces/app.wrangler.jsonc \
  surfaces/auth.wrangler.jsonc surfaces/brand.wrangler.jsonc; do
  test -f "$source_root/$required"
done

capsule="$source_root/recovery-capsule.json"
jq -e '
  .schema_version == 1 and .verdict == "STAGING_RECOVERY_CAPSULE_SEALED" and
  (.candidate_sha | test("^[a-f0-9]{40}$")) and
  (.transaction_id | test("^staging-[1-9][0-9]*-1$")) and
  (.targets | map(.name)) == ["api","web","app","auth","brand"]
' "$capsule" >/dev/null

mkdir -p \
  "$evidence_dir/capsule" "$evidence_dir/ledger" \
  "$(dirname "$api_config")" "$candidate_root/infra/staging/surfaces"
install -m 600 "$source_root/recovery-capsule.json" "$evidence_dir/capsule/recovery-capsule.json"
install -m 600 "$source_root/transaction-journal.json" "$evidence_dir/capsule/transaction-journal.json"
install -m 600 "$source_root/capsule-seal.json" "$evidence_dir/capsule/capsule-seal.json"
install -m 600 "$source_root/capsule-ledger-record.json" "$evidence_dir/ledger/capsule-record.json"
install -m 600 "$source_root/api.wrangler.release.toml" "$api_config"

expected="$(jq -er '.targets[] | select(.name == "api") | .configSha256' "$capsule")"
test "$(digest_file "$api_config")" = "$expected"
for surface in web app auth brand; do
  destination="$candidate_root/infra/staging/surfaces/$surface.wrangler.jsonc"
  install -m 600 "$source_root/surfaces/$surface.wrangler.jsonc" "$destination"
  expected="$(jq -er --arg surface "$surface" '.targets[] | select(.name == $surface) | .configSha256' "$capsule")"
  test "$(digest_file "$destination")" = "$expected"
done

test ! -e "$candidate_root/.git"
