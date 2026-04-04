#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-https://omdala-api.tranhatam66.workers.dev}"
ENV_FILE="${ENV_FILE:-.env}"
SMOKE_P95_THRESHOLD_MS="${SMOKE_P95_THRESHOLD_MS:-2500}"
SMOKE_ENFORCE_P95="${SMOKE_ENFORCE_P95:-1}"
SMOKE_CRITICAL_ROUTE_P95_THRESHOLD_MS="${SMOKE_CRITICAL_ROUTE_P95_THRESHOLD_MS:-2200}"
DURATIONS_FILE="/tmp/omdala_smoke_durations_ms.txt"
PERF_FILE="/tmp/omdala_smoke_perf.json"
ROUTE_DURATIONS_FILE="/tmp/omdala_smoke_route_durations.jsonl"

: > "${DURATIONS_FILE}"
: > "${ROUTE_DURATIONS_FILE}"

record_duration_ms() {
  local seconds="$1"
  python3 - "$seconds" >> "${DURATIONS_FILE}" <<'PY'
import sys

seconds = float(sys.argv[1])
print(round(seconds * 1000, 2))
PY
}

perform_request() {
  local label="$1"
  local method="$2"
  local url="$3"
  local output_file="$4"
  local body="${5:-}"
  local metrics
  local status
  local seconds

  if [[ -n "${body}" ]]; then
    metrics=$(curl -sS -o "${output_file}" -w "%{http_code} %{time_total}" -X "${method}" "${url}" -H "Content-Type: application/json" -d "${body}")
  else
    metrics=$(curl -sS -o "${output_file}" -w "%{http_code} %{time_total}" -X "${method}" "${url}")
  fi

  status="${metrics%% *}"
  seconds="${metrics##* }"
  record_duration_ms "${seconds}"

  cat "${output_file}"
  echo

  python3 - "$label" "$seconds" >> "${ROUTE_DURATIONS_FILE}" <<'PY'
import json
import sys

label = sys.argv[1]
seconds = float(sys.argv[2])
print(json.dumps({"route": label, "duration_ms": round(seconds * 1000, 2)}))
PY

  if (( status >= 400 )); then
    echo "[smoke] ERROR: ${label} failed with HTTP ${status}"
    exit 1
  fi
}

echo "[smoke] base: ${BASE_URL}"

echo "[smoke] health"
perform_request "health" "GET" "${BASE_URL}/v2/reality/health" "/tmp/omdala_smoke_health.json"

echo "[smoke] nodes"
perform_request "nodes" "GET" "${BASE_URL}/v2/reality/nodes" "/tmp/omdala_smoke_nodes.json"

echo "[smoke] states"
perform_request "states" "GET" "${BASE_URL}/v2/reality/states" "/tmp/omdala_smoke_states.json"

echo "[smoke] commitments"
perform_request "commitments" "GET" "${BASE_URL}/v2/reality/commitments" "/tmp/omdala_smoke_commitments_before.json"

echo "[smoke] transitions"
perform_request "transitions" "GET" "${BASE_URL}/v2/reality/transitions" "/tmp/omdala_smoke_transitions.json"

echo "[smoke] proofs"
perform_request "proofs" "GET" "${BASE_URL}/v2/reality/proofs" "/tmp/omdala_smoke_proofs_before.json"

echo "[smoke] trust"
perform_request "trust" "GET" "${BASE_URL}/v2/reality/trust" "/tmp/omdala_smoke_trust_before.json"

FROM_NODE_ID="${FROM_NODE_ID:-node_a}"
TO_NODE_ID="${TO_NODE_ID:-node_b}"

echo "[smoke] create commitment"
perform_request \
  "create_commitment" \
  "POST" \
  "${BASE_URL}/v2/reality/commitments" \
  "/tmp/omdala_smoke_create_commitment.json" \
  "{\"fromNodeId\":\"${FROM_NODE_ID}\",\"toNodeId\":\"${TO_NODE_ID}\",\"title\":\"smoke-check\",\"summary\":\"smoke run\",\"amount\":1000,\"currency\":\"VND\"}"

COMMITMENT_ID=$(python3 - <<'PY'
import json
import sys

with open('/tmp/omdala_smoke_create_commitment.json', 'r', encoding='utf-8') as f:
    payload = json.load(f)

print(payload.get('data', {}).get('id', ''))
PY
)

if [[ -z "${COMMITMENT_ID}" ]]; then
  echo "[smoke] ERROR: commitment id missing"
  exit 1
fi

echo "[smoke] create proof for commitment ${COMMITMENT_ID}"
perform_request \
  "create_proof" \
  "POST" \
  "${BASE_URL}/v2/reality/proofs" \
  "/tmp/omdala_smoke_create_proof.json" \
  "{\"commitmentId\":\"${COMMITMENT_ID}\",\"type\":\"payment\",\"summary\":\"smoke-proof\"}"

echo "[smoke] trust after proof"
perform_request "trust_after" "GET" "${BASE_URL}/v2/reality/trust" "/tmp/omdala_smoke_trust_after.json"

echo "[smoke] assert trust increased after proof"
bash scripts/smoke_v2_reality.assert_only.sh

echo "[smoke] evaluate p95 latency threshold"
SMOKE_P95_THRESHOLD_MS="${SMOKE_P95_THRESHOLD_MS}" \
SMOKE_ENFORCE_P95="${SMOKE_ENFORCE_P95}" \
SMOKE_CRITICAL_ROUTE_P95_THRESHOLD_MS="${SMOKE_CRITICAL_ROUTE_P95_THRESHOLD_MS}" \
DURATIONS_FILE="${DURATIONS_FILE}" \
PERF_FILE="${PERF_FILE}" \
ROUTE_DURATIONS_FILE="${ROUTE_DURATIONS_FILE}" \
python3 - <<'PY'
import json
import math
import os
import sys

durations_file = os.environ["DURATIONS_FILE"]
perf_file = os.environ["PERF_FILE"]
threshold = float(os.environ["SMOKE_P95_THRESHOLD_MS"])
critical_threshold = float(os.environ["SMOKE_CRITICAL_ROUTE_P95_THRESHOLD_MS"])
enforce = os.environ.get("SMOKE_ENFORCE_P95", "1") == "1"
route_durations_file = os.environ["ROUTE_DURATIONS_FILE"]

durations = []
with open(durations_file, "r", encoding="utf-8") as f:
    for line in f:
        line = line.strip()
        if not line:
            continue
        durations.append(float(line))

if not durations:
    print("[smoke] ERROR: no duration samples captured")
    sys.exit(1)

durations.sort()

def percentile(values, p):
    idx = max(0, math.ceil(p * len(values)) - 1)
    return values[idx]

p50 = percentile(durations, 0.50)
p95 = percentile(durations, 0.95)
max_v = durations[-1]

summary = {
    "sample_count": len(durations),
    "p50_ms": round(p50, 2),
    "p95_ms": round(p95, 2),
    "max_ms": round(max_v, 2),
    "threshold_ms": threshold,
    "critical_route_threshold_ms": critical_threshold,
    "enforce": enforce,
    "pass": p95 <= threshold,
}

route_samples = {}
with open(route_durations_file, "r", encoding="utf-8") as f:
    for line in f:
        line = line.strip()
        if not line:
            continue
        row = json.loads(line)
        route = row.get("route")
        duration = row.get("duration_ms")
        if not route or duration is None:
            continue
        route_samples.setdefault(route, []).append(float(duration))

critical_routes = {
    "create_commitment",
    "create_proof",
    "trust_after",
}

route_stats = {}
critical_failures = []

for route, values in route_samples.items():
    values.sort()
    rp95 = percentile(values, 0.95)
    entry = {
        "sample_count": len(values),
        "p95_ms": round(rp95, 2),
        "max_ms": round(values[-1], 2),
    }
    route_stats[route] = entry

    if route in critical_routes and rp95 > critical_threshold:
        critical_failures.append(
            {
                "route": route,
                "p95_ms": round(rp95, 2),
                "threshold_ms": critical_threshold,
            }
        )

summary["route_stats"] = route_stats
summary["critical_route_failures"] = critical_failures
summary["critical_routes"] = sorted(critical_routes)
summary["pass"] = summary["pass"] and (len(critical_failures) == 0)

with open(perf_file, "w", encoding="utf-8") as f:
    json.dump(summary, f)

print(
    "[smoke] perf: "
    f"samples={summary['sample_count']} "
    f"p50={summary['p50_ms']}ms "
    f"p95={summary['p95_ms']}ms "
    f"max={summary['max_ms']}ms "
    f"threshold={summary['threshold_ms']}ms"
)

if critical_failures:
    for item in critical_failures:
        print(
            "[smoke] critical route p95 exceeded: "
            f"route={item['route']} "
            f"p95={item['p95_ms']}ms "
            f"threshold={item['threshold_ms']}ms"
        )

if enforce and not summary["pass"]:
    print("[smoke] ERROR: latency threshold check failed")
    sys.exit(1)
PY

if [[ "${SMOKE_CLEANUP:-1}" = "1" && -n "${DATABASE_URL:-}" ]]; then
  echo "[smoke] post-cleanup consistency check"
  psql "${DATABASE_URL}" -f scripts/cleanup_consistency_check.sql >/tmp/omdala_cleanup_consistency.log 2>&1 || {
    echo "[smoke] cleanup consistency check failed (see /tmp/omdala_cleanup_consistency.log)"
    cat /tmp/omdala_cleanup_consistency.log
    exit 1
  }
  echo "[smoke] cleanup consistency check passed"
fi

if [[ "${SMOKE_CLEANUP:-1}" = "1" ]]; then
  if [[ -z "${DATABASE_URL:-}" ]]; then
    for candidate in "${ENV_FILE}" ".env.local"; do
      if [[ -f "${candidate}" ]]; then
        while IFS='=' read -r key value; do
          [[ "${key}" =~ ^[[:space:]]*# ]] && continue
          [[ -z "${key//[[:space:]]/}" ]] && continue

          key="${key#export }"
          key="${key//[[:space:]]/}"

          if [[ "${key}" = "DATABASE_URL" ]]; then
            value="${value#\"}"
            value="${value%\"}"
            value="${value#\'}"
            value="${value%\'}"
            DATABASE_URL="${value}"
            break
          fi
        done < "${candidate}"
      fi

      if [[ -n "${DATABASE_URL:-}" ]]; then
        break
      fi
    done
  fi

  if [[ -z "${DATABASE_URL:-}" ]]; then
    echo "[smoke] cleanup skipped: DATABASE_URL not set (or missing in ${ENV_FILE}/.env.local)"
  else
    echo "[smoke] cleanup test data"
    psql "${DATABASE_URL}" -f scripts/cleanup_test_data.sql >/tmp/omdala_smoke_cleanup.log 2>&1 || {
      echo "[smoke] cleanup failed (see /tmp/omdala_smoke_cleanup.log)"
      cat /tmp/omdala_smoke_cleanup.log
      exit 1
    }
    echo "[smoke] cleanup done"
  fi
fi

echo "[smoke] done"
