#!/usr/bin/env bash
set -u

snapshot_root="/Users/tranhatam/Documents/Devnewproject/omdala.com"
snapshot_out="/private/tmp/omdala-g0.2-snapshot-2026-07-19"

mkdir -p "$snapshot_out"
: > "$snapshot_out/source-checksums.sha256"
: > "$snapshot_out/source-metadata.tsv"
: > "$snapshot_out/secret-exclusions.paths"
: > "$snapshot_out/generated-exclusions.paths"
: > "$snapshot_out/read-failures.log"

is_secret_path() {
  local relative_path="$1"
  local base_name="${relative_path##*/}"
  case "$base_name" in
    .env.example|.env.sample|.env.template|*.env.example|*.env.sample|*.env.template)
      return 1
      ;;
    .env|.env.*|*.pem|*.key|*.p12|*.pfx|credentials.json|credentials.*.json|secrets.json|secrets.*.json)
      return 0
      ;;
  esac
  case "$relative_path" in
    */.wrangler/state/*|*/.dev.vars|*/.dev.vars.*)
      return 0
      ;;
  esac
  return 1
}

find "$snapshot_root" \
  \( -type d \( \
    -name .git -o -name 'node_modules*' -o -name .next -o -name out -o \
    -name dist -o -name build -o -name coverage -o -name .pnpm-store -o \
    -name test-results -o -name playwright-report -o -name lighthouse-reports -o -name .turbo -o \
    -path '*/.claude/worktrees' -o \
    -path '*/docs/audit/2026-07-19/g0.2-snapshot' \
  \) -prune \) -o -type f -print0 2>> "$snapshot_out/read-failures.log" |
while IFS= read -r -d '' absolute_path; do
  relative_path="${absolute_path#"$snapshot_root"/}"
  if is_secret_path "$relative_path"; then
    printf '%s\n' "$relative_path" >> "$snapshot_out/secret-exclusions.paths"
    continue
  fi

  file_flags=$(stat -f '%Sf' "$absolute_path" 2>> "$snapshot_out/read-failures.log") || {
    printf 'STAT_FLAGS_FAIL\t%s\n' "$relative_path" >> "$snapshot_out/read-failures.log"
    continue
  }
  case ",$file_flags," in
    *,dataless,*)
      printf 'DATALESS_NOT_HASHED\t%s\n' "$relative_path" >> "$snapshot_out/read-failures.log"
      continue
      ;;
  esac

  size_bytes=$(stat -f '%z' "$absolute_path" 2>> "$snapshot_out/read-failures.log") || {
    printf 'STAT_FAIL\t%s\n' "$relative_path" >> "$snapshot_out/read-failures.log"
    continue
  }
  modified_epoch=$(stat -f '%m' "$absolute_path" 2>> "$snapshot_out/read-failures.log") || modified_epoch="UNKNOWN"
  hash_output=$(perl -e 'alarm shift; exec @ARGV' 2 shasum -a 256 "$absolute_path" 2>> "$snapshot_out/read-failures.log")
  hash_status=$?
  digest=$(printf '%s\n' "$hash_output" | awk '{print $1}')
  if [ "$hash_status" -ne 0 ] || [ -z "$digest" ]; then
    printf 'HASH_FAIL_OR_TIMEOUT\tstatus=%s\t%s\n' "$hash_status" "$relative_path" >> "$snapshot_out/read-failures.log"
    continue
  fi

  printf '%s  %s\n' "$digest" "$relative_path" >> "$snapshot_out/source-checksums.sha256"
  printf '%s\t%s\t%s\t%s\n' "$relative_path" "$size_bytes" "$modified_epoch" "$digest" >> "$snapshot_out/source-metadata.tsv"
done

find "$snapshot_root" -type d \( \
  -name .git -o -name 'node_modules*' -o -name .next -o -name out -o \
  -name dist -o -name build -o -name coverage -o -name .pnpm-store -o \
  -name test-results -o -name playwright-report -o -name lighthouse-reports -o -name .turbo -o \
  -path '*/.claude/worktrees' \
\) -print -prune 2>> "$snapshot_out/read-failures.log" |
sed "s#^$snapshot_root/##" > "$snapshot_out/generated-exclusions.paths"

LC_ALL=C sort -o "$snapshot_out/source-checksums.sha256" "$snapshot_out/source-checksums.sha256"
LC_ALL=C sort -o "$snapshot_out/source-metadata.tsv" "$snapshot_out/source-metadata.tsv"
LC_ALL=C sort -u -o "$snapshot_out/secret-exclusions.paths" "$snapshot_out/secret-exclusions.paths"
LC_ALL=C sort -u -o "$snapshot_out/generated-exclusions.paths" "$snapshot_out/generated-exclusions.paths"

(
  cd "$snapshot_out" || exit 1
  shasum -a 256 source-checksums.sha256 source-metadata.tsv secret-exclusions.paths generated-exclusions.paths read-failures.log > manifest-files.sha256
)

printf '%s\n' "$snapshot_out"
