#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3001}"

echo "[smoke] health"
curl -sSf "$BASE_URL/health" >/dev/null

echo "[smoke] ready"
curl -sSf "$BASE_URL/ready" >/dev/null

echo "[smoke] openapi"
curl -sSf "$BASE_URL/openapi.json" >/dev/null

echo "[smoke] create plan"
PLAN_RESPONSE=$(curl -sSf -X POST "$BASE_URL/v2/reality/transitions/plan" \
  -H "content-type: application/json" \
  -d '{"role":"owner","actionClass":"low","businessMode":false,"raw_input":"Om, cho phong con ngu"}')

PLAN_ID=$(printf '%s' "$PLAN_RESPONSE" | node -e 'const fs=require("fs");const j=JSON.parse(fs.readFileSync(0,"utf8"));process.stdout.write(j.data.plan_id)')

echo "[smoke] execute plan: $PLAN_ID"
EXEC_RESPONSE=$(curl -sSf -X POST "$BASE_URL/v2/reality/transitions/execute" \
  -H "content-type: application/json" \
  -H "x-user-id: smoke_user" \
  -H "x-role: owner" \
  -d "{\"plan_id\":\"$PLAN_ID\",\"actor_id\":\"smoke_user\"}")

PROOF_ID=$(printf '%s' "$EXEC_RESPONSE" | node -e 'const fs=require("fs");const j=JSON.parse(fs.readFileSync(0,"utf8"));process.stdout.write(j.data.proof.proofId)')

echo "[smoke] fetch proof: $PROOF_ID"
curl -sSf "$BASE_URL/v2/reality/proofs/$PROOF_ID" >/dev/null

echo "[smoke] request approval"
APPROVAL_RESPONSE=$(curl -sSf -X POST "$BASE_URL/v2/reality/approvals/request" \
  -H "content-type: application/json" \
  -d "{\"run_id\":\"$PLAN_ID\",\"requested_by\":\"smoke_user\"}")

APPROVAL_ID=$(printf '%s' "$APPROVAL_RESPONSE" | node -e 'const fs=require("fs");const j=JSON.parse(fs.readFileSync(0,"utf8"));process.stdout.write(j.data.approval.approval_id)')

echo "[smoke] confirm approval: $APPROVAL_ID"
curl -sSf -X POST "$BASE_URL/v2/reality/approvals/$APPROVAL_ID/confirm" \
  -H "x-user-id: smoke_user" \
  -H "x-role: owner" >/dev/null

echo "[smoke] done"
