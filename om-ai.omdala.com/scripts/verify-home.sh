#!/usr/bin/env bash
set -euo pipefail

HOME_URL="${HOME_URL:-http://localhost:4173}"
EXPECTED_TITLE_REGEX="${EXPECTED_TITLE_REGEX:-Om AI|OMDALA App}"
EXPECTED_MARKER_REGEX="${EXPECTED_MARKER_REGEX:-Om AI|OMDALA App|OMDALA}"

echo "[verify-home] check root"
HTML=$(node -e '
const url = process.argv[1];
fetch(url)
  .then((r) => {
    if (!r.ok) throw new Error(`http_${r.status}`);
    return r.text();
  })
  .then((html) => process.stdout.write(html))
  .catch((e) => {
    process.stderr.write(String(e.message || e));
    process.exit(1);
  });
' "$HOME_URL/")

echo "[verify-home] check title"
printf '%s' "$HTML" | node -e '
const fs = require("fs");
const h = fs.readFileSync(0, "utf8");
const regex = new RegExp(process.argv[1], "i");
const titleMatch = h.match(/<title>([^<]*)<\/title>/i);
const title = titleMatch ? titleMatch[1] : "";
if (!title || !regex.test(title)) {
  process.stderr.write(`missing_title_or_unexpected_title:${title}\n`);
  process.exit(1);
}
' "$EXPECTED_TITLE_REGEX"

echo "[verify-home] check description meta"
printf '%s' "$HTML" | node -e 'const fs=require("fs");const h=fs.readFileSync(0,"utf8");if(!/name="description"/.test(h)){process.stderr.write("missing_description_meta\n");process.exit(1)}'

echo "[verify-home] check app marker"
printf '%s' "$HTML" | node -e '
const fs = require("fs");
const h = fs.readFileSync(0, "utf8");
const marker = new RegExp(process.argv[1], "i");
if (!marker.test(h)) {
  process.stderr.write("missing_app_marker\n");
  process.exit(1);
}
' "$EXPECTED_MARKER_REGEX"

echo "[verify-home] done"
