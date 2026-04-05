#!/usr/bin/env bash
set -euo pipefail

PROJECT_NAME="${PROJECT_NAME:-ai-omdala-home}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-main}"
ARTIFACTS_DIR="${ARTIFACTS_DIR:-.deploy-artifacts}"
BACKUP_DIR="${BACKUP_DIR:-}"

if [[ -z "${CLOUDFLARE_ACCOUNT_ID:-}" ]]; then
  echo "[rollback-home-prod] missing CLOUDFLARE_ACCOUNT_ID"
  exit 1
fi

if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  echo "[rollback-home-prod] missing CLOUDFLARE_API_TOKEN"
  exit 1
fi

if [[ -z "$BACKUP_DIR" ]]; then
  if [[ ! -d "$ARTIFACTS_DIR" ]]; then
    echo "[rollback-home-prod] no artifacts directory found: $ARTIFACTS_DIR"
    echo "Run a deploy first or pass BACKUP_DIR=<artifact-path>"
    exit 1
  fi

  CANDIDATES=()
  while IFS= read -r line; do
    CANDIDATES+=("$line")
  done < <(ls -1 "$ARTIFACTS_DIR" | sort)
  if [[ "${#CANDIDATES[@]}" -lt 2 ]]; then
    echo "[rollback-home-prod] need at least 2 artifacts for auto-rollback"
    echo "Pass BACKUP_DIR=<artifact-path> explicitly"
    exit 1
  fi

  PREVIOUS_INDEX=$((${#CANDIDATES[@]} - 2))
  BACKUP_DIR="$ARTIFACTS_DIR/${CANDIDATES[$PREVIOUS_INDEX]}"
fi

if [[ ! -d "$BACKUP_DIR" ]]; then
  echo "[rollback-home-prod] backup dir not found: $BACKUP_DIR"
  exit 1
fi

echo "[rollback-home-prod] redeploying artifact: $BACKUP_DIR"
npx wrangler pages deploy "$BACKUP_DIR" --project-name "$PROJECT_NAME" --branch "$DEPLOY_BRANCH"

echo "[rollback-home-prod] done"
npx wrangler pages deployment list --project-name "$PROJECT_NAME"
