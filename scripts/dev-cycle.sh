#!/usr/bin/env bash
# Mechanical safety checks for the scheduled dev cycle.
# Protocol: docs/06-strategy/OMDALA_CONTINUOUS_DEV_PLAN_2026.md section 6.
#   bash scripts/dev-cycle.sh preflight     run first; non-zero exit means stop
#   bash scripts/dev-cycle.sh scan-staged   run after `git add`, before `git commit`
set -euo pipefail

BRANCH="claude/omdala-brand-system-L4Gzx"
LEDGER="docs/06-strategy/DEV_LEDGER.md"

die() {
  echo "dev-cycle: $1" >&2
  exit "$2"
}

preflight() {
  [ "$(git rev-parse --abbrev-ref HEAD)" = "$BRANCH" ] || die "not on $BRANCH" 3
  git fetch -q origin "$BRANCH" || die "fetch failed" 4
  [ -z "$(git status --porcelain)" ] || die "working tree is not clean" 4

  local behind ahead
  read -r behind ahead < <(git rev-list --left-right --count "origin/$BRANCH...HEAD")
  if [ "$behind" -gt 0 ] && [ "$ahead" -gt 0 ]; then
    die "diverged from origin (ahead $ahead, behind $behind)" 5
  fi
  if [ "$behind" -gt 0 ]; then
    git merge -q --ff-only "origin/$BRANCH"
    echo "fast-forwarded $behind commit(s) pushed by someone else"
  fi

  grep -qE '^AUTOMATION: ACTIVE$' "$LEDGER" || die "ledger is not ACTIVE" 6
  echo "preflight ok: $(git rev-parse --short HEAD)"
}

scan_staged() {
  local hits
  hits=$(git diff --cached -U0 --no-color | grep -E '^\+' | grep -vE '^\+\+\+' \
    | grep -nE 'AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|sk-[A-Za-z0-9]{20,}|xox[baprs]-[A-Za-z0-9-]{10,}|(API_TOKEN|SECRET|PASSWORD|PRIVATE_KEY)[A-Z_]*=[^[:space:]$<"]{8,}' \
    || true)
  if [ -n "$hits" ]; then
    echo "$hits" | sed -E 's/(=).{4,}/\1<redacted>/' >&2
    die "possible secret in staged diff" 7
  fi
  echo "scan-staged ok"
}

case "${1:-}" in
  preflight) preflight ;;
  scan-staged) scan_staged ;;
  *) die "usage: dev-cycle.sh preflight|scan-staged" 2 ;;
esac
