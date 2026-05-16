#!/usr/bin/env bash
set -euo pipefail

echo "[bootstrap] install dependencies"
make install

echo "[bootstrap] sync env files"
[ -f .env ] || cp .env.example .env
[ -f backend/.env ] || cp backend/.env.example backend/.env
[ -f web/.env ] || cp web/.env.example web/.env
[ -f gateway/.env ] || cp gateway/.env.example gateway/.env

echo "[bootstrap] run baseline checks"
npm run ci

echo "[bootstrap] done"
echo "Run: make dev"
