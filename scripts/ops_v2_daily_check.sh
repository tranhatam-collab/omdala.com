#!/usr/bin/env bash
set -euo pipefail

REPORT_DIR="${REPORT_DIR:-reports/ops}"
mkdir -p "${REPORT_DIR}"
mkdir -p "${REPORT_DIR}/cache"

TIMESTAMP="$(date -u +"%Y-%m-%dT%H-%M-%SZ")"
REPORT_FILE="${REPORT_DIR}/v2-daily-check-${TIMESTAMP}.md"
REPORT_JSON_FILE="${REPORT_DIR}/v2-daily-check-${TIMESTAMP}.json"
LOG_CACHE_FILE="${LOG_CACHE_FILE:-${REPORT_DIR}/cache/v2-log-query-cache.json}"
PREV_REPORT_FILE="${PREV_REPORT_FILE:-}"

CHAIN_LOG="/tmp/omdala_v2_chain.log"
TRACE_QUERY_FILE="/tmp/omdala_trace_query.txt"
PERF_FILE="/tmp/omdala_smoke_perf.json"

echo "[ops] running v2 daily chain check"
bash scripts/smoke_v2_reality_chain.sh | tee "${CHAIN_LOG}"

TRACE_REQUEST_ID=$(python3 - <<'PY'
import re

path = "/tmp/omdala_v2_chain.log"
request_id = ""

pattern = re.compile(r"\[trace\] request_id: (.+)$")
with open(path, "r", encoding="utf-8") as f:
    for line in f:
        m = pattern.search(line.strip())
        if m:
            request_id = m.group(1)

print(request_id)
PY
)

export TIMESTAMP REPORT_JSON_FILE TRACE_REQUEST_ID

if [[ -z "${PREV_REPORT_FILE}" ]]; then
  PREV_REPORT_FILE=$(python3 - <<'PY'
import glob
import os

files = sorted(glob.glob('reports/ops/v2-daily-check-*.json'))
print(files[-1] if files else "")
PY
)
fi

export LOG_CACHE_FILE PREV_REPORT_FILE

PERF_SUMMARY=$(python3 - <<'PY'
import json
from pathlib import Path

path = Path('/tmp/omdala_smoke_perf.json')
if not path.exists():
    print("N/A|N/A|N/A|N/A|N/A")
else:
    payload = json.loads(path.read_text(encoding='utf-8'))
    print(
        f"{payload.get('sample_count','N/A')}|"
        f"{payload.get('p50_ms','N/A')}|"
        f"{payload.get('p95_ms','N/A')}|"
        f"{payload.get('max_ms','N/A')}|"
        f"{payload.get('threshold_ms','N/A')}"
    )
PY
)

IFS='|' read -r PERF_SAMPLE PERF_P50 PERF_P95 PERF_MAX PERF_THRESHOLD <<< "${PERF_SUMMARY}"

python3 - <<'PY'
import json
import os
from pathlib import Path

timestamp = os.environ["TIMESTAMP"]
report_json_file = os.environ["REPORT_JSON_FILE"]
base_url = os.environ.get("BASE_URL", "https://omdala-api.tranhatam66.workers.dev")
trace_request_id = os.environ.get("TRACE_REQUEST_ID", "")
perf_file = Path("/tmp/omdala_smoke_perf.json")
cache_file = Path(os.environ.get("LOG_CACHE_FILE", ""))
prev_report_file = Path(os.environ.get("PREV_REPORT_FILE", ""))

budget_thresholds = {
    "DATABASE_TIMEOUT": int(os.environ.get("BUDGET_DATABASE_TIMEOUT", "20")),
    "DATABASE_UNAVAILABLE": int(os.environ.get("BUDGET_DATABASE_UNAVAILABLE", "5")),
    "DATABASE_CONSTRAINT_FOREIGN_KEY": int(os.environ.get("BUDGET_DATABASE_CONSTRAINT_FOREIGN_KEY", "30")),
    "DATABASE_CONSTRAINT_UNIQUE": int(os.environ.get("BUDGET_DATABASE_CONSTRAINT_UNIQUE", "20")),
    "DATABASE_CONSTRAINT_VIOLATION": int(os.environ.get("BUDGET_DATABASE_CONSTRAINT_VIOLATION", "30")),
}

payload = {
    "timestamp_utc": timestamp,
    "base_url": base_url,
    "chain_status": "PASS",
    "trace_request_id": trace_request_id or None,
    "latency": None,
    "docs": {
        "runbook": "docs/OMDALA_V2_ALERT_RESPONSE_RUNBOOK_2026.md",
        "queries": "docs/OMDALA_CLOUDFLARE_LOG_QUERIES_2026.md",
    },
    "health_budget": {
        "source": "not_available",
        "thresholds": budget_thresholds,
        "counts": {},
        "status": "unknown",
        "breaches": [],
    },
    "trend": {
        "source": "not_available",
        "p95_ms": {
            "current_24h": None,
            "previous_24h": None,
            "delta_ms": None,
            "delta_percent": None,
        },
        "error_counts": {
            "current_24h": {},
            "previous_24h": {},
            "delta": {},
        },
    },
}

if perf_file.exists():
    payload["latency"] = json.loads(perf_file.read_text(encoding="utf-8"))

cache = None
if cache_file.exists():
    try:
        cache = json.loads(cache_file.read_text(encoding="utf-8"))
    except Exception:
        cache = None

if cache:
    current_window = cache.get("window_24h", {})
    previous_window = cache.get("window_prev_24h", {})
    current_counts = current_window.get("error_counts", {}) or {}
    previous_counts = previous_window.get("error_counts", {}) or {}

    breaches = []
    for code, threshold in budget_thresholds.items():
        count = int(current_counts.get(code, 0) or 0)
        if count > threshold:
            breaches.append({"error_code": code, "count": count, "threshold": threshold})

    payload["health_budget"] = {
        "source": str(cache_file),
        "thresholds": budget_thresholds,
        "counts": current_counts,
        "status": "breached" if breaches else "ok",
        "breaches": breaches,
    }

    current_p95 = current_window.get("p95_ms")
    previous_p95 = previous_window.get("p95_ms")
    delta_ms = None
    delta_percent = None
    if current_p95 is not None and previous_p95 is not None:
        try:
            current_p95 = float(current_p95)
            previous_p95 = float(previous_p95)
            delta_ms = round(current_p95 - previous_p95, 2)
            if previous_p95 != 0:
                delta_percent = round((delta_ms / previous_p95) * 100, 2)
        except Exception:
            delta_ms = None
            delta_percent = None

    delta_counts = {}
    all_codes = set(current_counts.keys()) | set(previous_counts.keys())
    for code in sorted(all_codes):
        delta_counts[code] = int(current_counts.get(code, 0) or 0) - int(previous_counts.get(code, 0) or 0)

    payload["trend"] = {
        "source": str(cache_file),
        "p95_ms": {
            "current_24h": current_p95,
            "previous_24h": previous_p95,
            "delta_ms": delta_ms,
            "delta_percent": delta_percent,
        },
        "error_counts": {
            "current_24h": current_counts,
            "previous_24h": previous_counts,
            "delta": delta_counts,
        },
    }
elif prev_report_file.exists():
    try:
        prev = json.loads(prev_report_file.read_text(encoding="utf-8"))
        current_p95 = payload.get("latency", {}).get("p95_ms") if isinstance(payload.get("latency"), dict) else None
        previous_p95 = prev.get("latency", {}).get("p95_ms") if isinstance(prev.get("latency"), dict) else None
        delta_ms = None
        delta_percent = None
        if current_p95 is not None and previous_p95 is not None:
            current_p95 = float(current_p95)
            previous_p95 = float(previous_p95)
            delta_ms = round(current_p95 - previous_p95, 2)
            if previous_p95 != 0:
                delta_percent = round((delta_ms / previous_p95) * 100, 2)

        payload["trend"] = {
            "source": str(prev_report_file),
            "p95_ms": {
                "current_24h": current_p95,
                "previous_24h": previous_p95,
                "delta_ms": delta_ms,
                "delta_percent": delta_percent,
            },
            "error_counts": {
                "current_24h": {},
                "previous_24h": {},
                "delta": {},
            },
        }
    except Exception:
        pass

Path(report_json_file).write_text(json.dumps(payload, ensure_ascii=True, indent=2), encoding="utf-8")
PY

UPLOAD_RAW_OUTPUT=$(bash scripts/ops_v2_report_upload.sh "${REPORT_JSON_FILE}")
UPLOAD_RESULT=$(printf "%s\n" "${UPLOAD_RAW_OUTPUT}" | python3 - <<'PY'
import sys

lines = [line.strip() for line in sys.stdin if line.strip()]
match = ""
for line in lines:
    if "|" in line:
        match = line
if match:
    print(match)
PY
)

UPLOAD_STATUS="${UPLOAD_RESULT%%|*}"
UPLOAD_TARGET="${UPLOAD_RESULT##*|}"

{
  echo "# OMDALA V2 Daily Check Report"
  echo
  echo "- Timestamp (UTC): ${TIMESTAMP}"
  echo "- Base URL: ${BASE_URL:-https://omdala-api.tranhatam66.workers.dev}"
  echo "- Chain status: PASS"
  echo
  echo "## Latency Snapshot"
  echo
  echo "- Samples: ${PERF_SAMPLE}"
  echo "- p50: ${PERF_P50} ms"
  echo "- p95: ${PERF_P95} ms"
  echo "- max: ${PERF_MAX} ms"
  echo "- Threshold: ${PERF_THRESHOLD} ms"
  echo
  echo "## Trace"
  echo
  echo "- Request ID: ${TRACE_REQUEST_ID:-N/A}"
  if [[ -f "${TRACE_QUERY_FILE}" ]]; then
    echo "- Query file: ${TRACE_QUERY_FILE}"
    echo
    echo '```'
    cat "${TRACE_QUERY_FILE}"
    echo '```'
  else
    echo "- Query file: not found"
  fi
  echo
  echo "## Notes"
  echo
  echo "- Runbook: docs/OMDALA_V2_ALERT_RESPONSE_RUNBOOK_2026.md"
  echo "- Logs queries: docs/OMDALA_CLOUDFLARE_LOG_QUERIES_2026.md"
  echo "- JSON upload status: ${UPLOAD_STATUS}"
  echo "- JSON upload target: ${UPLOAD_TARGET}"
} > "${REPORT_FILE}"

echo "[ops] report generated: ${REPORT_FILE}"
echo "[ops] json generated: ${REPORT_JSON_FILE}"
