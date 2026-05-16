#!/usr/bin/env bash
set -euo pipefail

echo "[web-gates] run web smoke"
bash ./scripts/verify-app_smoke.sh

echo "[web-gates] run lighthouse baseline"
bash ./scripts/lighthouse-baseline.sh

echo "[web-gates] done"
