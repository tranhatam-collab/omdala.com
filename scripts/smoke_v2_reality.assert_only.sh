#!/usr/bin/env bash
set -euo pipefail

BEFORE_FILE="${BEFORE_FILE:-/tmp/omdala_smoke_trust_before.json}"
AFTER_FILE="${AFTER_FILE:-/tmp/omdala_smoke_trust_after.json}"
FROM_NODE_ID="${FROM_NODE_ID:-node_a}"
TO_NODE_ID="${TO_NODE_ID:-node_b}"

if [[ ! -f "${BEFORE_FILE}" ]]; then
  echo "[assert] ERROR: missing BEFORE_FILE: ${BEFORE_FILE}"
  exit 1
fi

if [[ ! -f "${AFTER_FILE}" ]]; then
  echo "[assert] ERROR: missing AFTER_FILE: ${AFTER_FILE}"
  exit 1
fi

FROM_NODE_ID="${FROM_NODE_ID}" \
TO_NODE_ID="${TO_NODE_ID}" \
BEFORE_FILE="${BEFORE_FILE}" \
AFTER_FILE="${AFTER_FILE}" \
python3 - <<'PY'
import json
import os
import sys

before_file = os.environ["BEFORE_FILE"]
after_file = os.environ["AFTER_FILE"]
from_node = os.environ["FROM_NODE_ID"]
to_node = os.environ["TO_NODE_ID"]

def load(path: str):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def trust_map(payload: dict) -> dict:
    trust = payload.get("data", {}).get("trust", [])
    out = {}
    for item in trust:
        node_id = item.get("nodeId")
        score = item.get("score")
        if node_id:
            out[node_id] = score
    return out

before = trust_map(load(before_file))
after = trust_map(load(after_file))

def assert_node_increase(node_id: str) -> None:
    prev_score = before.get(node_id)
    next_score = after.get(node_id)

    if next_score is None:
        print(f"[assert] ERROR: trust missing after proof for node '{node_id}'")
        sys.exit(1)

    if prev_score is None:
        print(f"[assert] trust created for node '{node_id}' at score={next_score}")
        return

    if float(next_score) <= float(prev_score):
        print(
            f"[assert] ERROR: trust did not increase for node '{node_id}' "
            f"(before={prev_score}, after={next_score})"
        )
        sys.exit(1)

    print(
        f"[assert] trust increased for node '{node_id}' "
        f"(before={prev_score}, after={next_score})"
    )

assert_node_increase(from_node)
assert_node_increase(to_node)
PY
