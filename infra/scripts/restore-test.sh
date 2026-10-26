#!/usr/bin/env bash
# Legacy restore drill disabled: it used the shared .env and omdala-postgres
# cluster, and its public-table-count comparison could not prove restore parity.
set -euo pipefail
printf '%s\n' 'ERROR: legacy restore-test is disabled. Use an approved isolated scratch restore with exact source, target, and parity receipts.' >&2
exit 1
