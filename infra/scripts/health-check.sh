#!/bin/bash
# OMDALA Infra Health Check (P7)
# Verifies all services are up and responding.
# Usage: ./scripts/health-check.sh
# Exit 0 if all pass, Exit 1 if any fail.

set -euo pipefail

DOMAIN="${INFRA_DOMAIN:-infra.omdala.com}"
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
  if docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
    local status
    status=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "no healthcheck")
    if [[ "$status" == "healthy" || "$status" == "no healthcheck" ]]; then
      echo "  [OK] $name (container: $container, status: $status)"
    else
      echo "  [WARN] $name (container: $container, status: $status)"
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
check_docker "Caddy" "omdala-caddy"
check_docker "PostgreSQL" "omdala-postgres"
check_docker "Valkey" "omdala-valkey"
check_docker "MinIO" "omdala-minio"
check_docker "API Gateway" "omdala-api"
check_docker "Worker" "omdala-worker"
check_docker "Uptime Kuma" "omdala-uptime"
check_docker "Keycloak" "omdala-keycloak"
check_docker "Backup" "omdala-backup"

echo ""
echo "[3/4] Database connectivity..."
if docker exec omdala-postgres pg_isready -U postgres > /dev/null 2>&1; then
  echo "  [OK] PostgreSQL is ready"
else
  echo "  [FAIL] PostgreSQL is NOT ready"
  ((FAILURES++)) || true
fi

echo ""
echo "[4/4] Disk space..."
USAGE=$(df / | awk 'NR==2 {print $5}' | tr -d '%')
if [[ "$USAGE" -lt 85 ]]; then
  echo "  [OK] Disk usage: ${USAGE}%"
else
  echo "  [WARN] Disk usage high: ${USAGE}%"
fi

echo ""
if [[ "$FAILURES" -eq 0 ]]; then
  echo "=== ALL CHECKS PASSED ==="
  exit 0
else
  echo "=== $FAILURES CHECK(S) FAILED ==="
  exit 1
fi
