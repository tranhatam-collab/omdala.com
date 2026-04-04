#!/usr/bin/env bash
set -euo pipefail

REQUEST_ID="${REQUEST_ID:-}"
OUTPUT_FILE="${OUTPUT_FILE:-/tmp/omdala_trace_query.txt}"

if [[ -z "${REQUEST_ID}" ]]; then
  REQUEST_ID=$(python3 - <<'PY'
import json
from pathlib import Path

candidate_files = [
    Path('/tmp/omdala_smoke_create_proof.json'),
    Path('/tmp/omdala_smoke_create_commitment.json'),
    Path('/tmp/omdala_smoke_trust_after.json'),
    Path('/tmp/omdala_smoke_health.json'),
]

for path in candidate_files:
    if not path.exists():
        continue
    try:
        payload = json.loads(path.read_text(encoding='utf-8'))
    except Exception:
        continue

    request_id = payload.get('meta', {}).get('requestId')
    if request_id:
        print(request_id)
        break
PY
)
fi

if [[ -z "${REQUEST_ID}" ]]; then
  echo "[trace] ERROR: request_id not found."
  echo "[trace] Run smoke first (bash scripts/smoke_v2_reality.sh) or pass REQUEST_ID explicitly."
  exit 1
fi

cat > "${OUTPUT_FILE}" <<EOF
request_id = "${REQUEST_ID}"
| fields timestamp, message, method, route, path, status, error_code, sql_state, kind, operation, duration_ms
| sort timestamp asc
EOF

echo "[trace] request_id: ${REQUEST_ID}"
echo "[trace] query saved: ${OUTPUT_FILE}"
echo "[trace] paste into Cloudflare Logs:"
cat "${OUTPUT_FILE}"
