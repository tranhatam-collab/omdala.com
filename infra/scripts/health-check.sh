#!/bin/bash
# OMDALA Infra Health Check (P7)
# Verifies all services are up and responding.
# Usage: ./scripts/health-check.sh
# Exit 0 if all pass, Exit 1 if any fail.

set -euo pipefail

case "${INFRA_ENVIRONMENT:-}" in
  staging)
    EXPECTED_DOMAIN="staging.infra.omdala.com"
    CONTAINER_PREFIX="omdala-staging"
    ;;
  production)
    EXPECTED_DOMAIN="infra.omdala.com"
    CONTAINER_PREFIX="omdala"
    ;;
  *)
    echo "ERROR: INFRA_ENVIRONMENT must explicitly select staging or production" >&2
    exit 1
    ;;
esac
DOMAIN="${INFRA_DOMAIN:-}"
if [[ "$DOMAIN" != "$EXPECTED_DOMAIN" ]]; then
  echo "ERROR: INFRA_DOMAIN does not match the selected environment" >&2
  exit 1
fi
FAILURES=0

check_http() {
  local name="$1"
  local url="$2"
  local expected="${3:-200}"
  local code
  code=$(curl -fsS -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
  if [[ "$code" == "$expected" ]]; then
    echo "  [OK] $name ($url)"
  else
    echo "  [FAIL] $name ($url) — expected $expected, got $code"
    ((FAILURES++)) || true
  fi
}

check_docker() {
  local name="$1"
  local container="$2"
  local running
  if ! running=$(docker ps --format '{{.Names}}' 2>/dev/null); then
    echo "  [FAIL] $name (Docker inventory unavailable)"
    ((FAILURES++)) || true
    return
  fi
  if grep -Fxq "$container" <<< "$running"; then
    local status
    status=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "unavailable")
    if [[ "$status" == "healthy" ]]; then
      echo "  [OK] $name (container: $container, status: $status)"
    else
      echo "  [FAIL] $name (container: $container, status: $status)"
      ((FAILURES++)) || true
    fi
  else
    echo "  [FAIL] $name (container: $container not running)"
    ((FAILURES++)) || true
  fi
}

echo "=== OMDALA Infra Health Check ==="
echo "Domain: $DOMAIN"
echo "Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo ""

echo "[1/4] External endpoints..."
check_http "infra-root" "https://${DOMAIN}/health"
check_http "api-gateway" "https://api.${DOMAIN}/health"
check_http "auth" "https://auth.${DOMAIN}/health/ready"
check_http "monitor" "https://monitor.${DOMAIN}"

echo ""
echo "[2/4] Docker containers..."
check_docker "Caddy" "${CONTAINER_PREFIX}-caddy"
check_docker "PostgreSQL" "${CONTAINER_PREFIX}-postgres"
check_docker "Valkey" "${CONTAINER_PREFIX}-valkey"
# MinIO is dev-only (profile: dev). Only check if explicitly requested.
if [[ "${INCLUDE_MINIO:-false}" == "true" ]]; then
  check_docker "MinIO" "${CONTAINER_PREFIX}-minio"
fi
check_docker "API Gateway" "${CONTAINER_PREFIX}-api"
check_docker "Worker" "${CONTAINER_PREFIX}-worker"
check_docker "Uptime Kuma" "${CONTAINER_PREFIX}-uptime"
check_docker "Keycloak" "${CONTAINER_PREFIX}-keycloak"
check_docker "Backup" "${CONTAINER_PREFIX}-backup"

echo ""
echo "[3/4] Database connectivity..."
if docker exec "${CONTAINER_PREFIX}-postgres" pg_isready -U postgres > /dev/null 2>&1; then
  echo "  [OK] PostgreSQL is ready"
else
  echo "  [FAIL] PostgreSQL is NOT ready"
  ((FAILURES++)) || true
fi

echo ""
echo "[4/4] Disk space..."
USAGE=$(df / | awk 'NR==2 {print $5}' | tr -d '%')
if [[ "$USAGE" =~ ^[0-9]+$ && "$USAGE" -lt 85 ]]; then
  echo "  [OK] Disk usage: ${USAGE}%"
else
  echo "  [FAIL] Disk usage unavailable or high: ${USAGE}%"
  ((FAILURES++)) || true
fi

echo ""
if [[ "$FAILURES" -eq 0 ]]; then
  echo "=== ALL CHECKS PASSED ==="
  exit 0
else
  echo "=== $FAILURES CHECK(S) FAILED ==="
  exit 1
fi
