import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { pathToFileURL } from "node:url";

const SHA256 = /^[a-f0-9]{64}$/;
export const EMPTY_UNRESOLVED_IMPORT_SHA256 = "37517e5f3dc66819f61f5a7bb8ace1921282415f10551d2defa5c3eb0985b570";

function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  }
  return value;
}

function stableBytes(value) {
  return Buffer.from(JSON.stringify(stable(value)));
}

function providerResults(response, label) {
  if (
    response?.success !== true ||
    !Array.isArray(response.errors) || response.errors.length !== 0 ||
    !Array.isArray(response.result) || response.result.length !== 1 ||
    response.result[0]?.success !== true ||
    !Array.isArray(response.result[0].results)
  ) throw new Error(`${label} is not an exact successful D1 response`);
  return response.result[0].results;
}

function response(path, label) {
  return JSON.parse(readFileSync(path, "utf8"), label);
}

function normalizeSql(sql) {
  if (sql === null) return null;
  if (typeof sql !== "string") throw new Error("sqlite_master SQL must be text or null");
  return sql
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\s*([(),=><])\s*/g, "$1")
    .replace(/;$/, "")
    .toLowerCase();
}

function exactKeys(row, keys, label) {
  if (!row || typeof row !== "object" || Array.isArray(row)) throw new Error(`${label} row is invalid`);
  if (Object.keys(row).sort().join(",") !== [...keys].sort().join(",")) {
    throw new Error(`${label} row keys are not exact`);
  }
}

export function canonicalSchemaManifest({ objects, columns, indexes, indexColumns }) {
  if (![objects, columns, indexes, indexColumns].every(Array.isArray)) {
    throw new Error("D1 schema evidence arrays are required");
  }
  const canonical = {
    objects: objects.map((row) => {
      exactKeys(row, ["type", "name", "tbl_name", "sql"], "sqlite_master");
      return { ...row, sql: normalizeSql(row.sql) };
    }).sort((a, b) => `${a.type}\0${a.name}`.localeCompare(`${b.type}\0${b.name}`)),
    columns: columns.map((row) => {
      exactKeys(row, ["table_name", "cid", "name", "type", "notnull", "dflt_value", "pk"], "table_info");
      return row;
    }).sort((a, b) => `${a.table_name}\0${String(a.cid).padStart(4, "0")}`.localeCompare(`${b.table_name}\0${String(b.cid).padStart(4, "0")}`)),
    indexes: indexes.map((row) => {
      exactKeys(row, ["table_name", "seq", "name", "unique", "origin", "partial"], "index_list");
      return row;
    }).sort((a, b) => `${a.table_name}\0${String(a.seq).padStart(4, "0")}`.localeCompare(`${b.table_name}\0${String(b.seq).padStart(4, "0")}`)),
    index_columns: indexColumns.map((row) => {
      exactKeys(row, ["table_name", "index_name", "seqno", "cid", "name"], "index_info");
      return row;
    }).sort((a, b) => `${a.table_name}\0${a.index_name}\0${String(a.seqno).padStart(4, "0")}`.localeCompare(`${b.table_name}\0${b.index_name}\0${String(b.seqno).padStart(4, "0")}`)),
  };
  return canonical;
}

export function verifySchemaEvidence({ marker, objects, columns, indexes, indexColumns, expectedDigest }) {
  if (!SHA256.test(expectedDigest ?? "")) throw new Error("Trusted schema manifest digest is invalid");
  if (
    !Array.isArray(marker) || marker.length !== 1 ||
    marker[0]?.schema_version !== 1 ||
    marker[0]?.database_name !== "omdala-audit-staging"
  ) throw new Error("D1 ledger schema marker is not exact");
  const manifest = canonicalSchemaManifest({ objects, columns, indexes, indexColumns });
  const actualDigest = digest(stableBytes(manifest));
  if (actualDigest !== expectedDigest) {
    throw new Error(`D1 ledger schema manifest digest mismatch: ${actualDigest}`);
  }
  return { manifest, schema_manifest_sha256: actualDigest };
}

export function verifyActivationEvidence(rows, config) {
  if (!Array.isArray(rows) || rows.length !== 1) {
    throw new Error("D1 ledger requires one immutable ACTIVATED epoch receipt");
  }
  const row = rows[0];
  exactKeys(row, ["singleton", "activation_epoch", "reconciliation_receipt_sha256", "reconciliation_payload_json", "activated_at"], "activation");
  if (
    row.singleton !== 1 || row.activation_epoch !== config.activation_epoch ||
    !SHA256.test(row.reconciliation_receipt_sha256 ?? "") ||
    typeof row.reconciliation_payload_json !== "string" ||
    digest(Buffer.from(row.reconciliation_payload_json)) !== row.reconciliation_receipt_sha256 ||
    typeof row.activated_at !== "string" || Number.isNaN(Date.parse(row.activated_at))
  ) throw new Error("D1 ledger ACTIVATED epoch identity or digest is invalid");
  let payload;
  try { payload = JSON.parse(row.reconciliation_payload_json); } catch { throw new Error("D1 ledger activation receipt is not JSON"); }
  requireExactActivationPayload(payload);
  if (
    payload?.schema_version !== 1 ||
    payload.verdict !== "STAGING_DURABLE_LEDGER_HISTORY_RECONCILED" ||
    payload.activation_epoch !== config.activation_epoch ||
    payload.database_id !== config.database_id ||
    payload.repository !== "tranhatam-collab/omdala.com" ||
    !Number.isSafeInteger(payload.cutoff_workflow_run_id) || payload.cutoff_workflow_run_id <= 0 ||
    payload.workflow_path !== ".github/workflows/staging-transaction.yml" ||
    payload.workflow_ref !== "refs/heads/main" ||
    !/^[a-f0-9]{40}$/.test(payload.control_plane_sha ?? "") ||
    !SHA256.test(payload.retained_actions_history_inventory_sha256 ?? "") ||
    !SHA256.test(payload.provider_reconciliation_receipt_sha256 ?? "") ||
    !exactProviderReadbackDigests(payload.provider_readback_sha256_by_target) ||
    payload.imported_unresolved_count !== 0 ||
    payload.imported_unresolved_digest !== EMPTY_UNRESOLVED_IMPORT_SHA256 ||
    !exactOperatorAuthority(payload.operator_authority_receipt) ||
    typeof payload.reconciled_at !== "string" || Number.isNaN(Date.parse(payload.reconciled_at)) ||
    payload.reconciled_at !== row.activated_at ||
    payload.provider_readback_verified !== true ||
    payload.actions_history_reconciled !== true ||
    payload.historical_unresolved_transactions_imported !== true ||
    payload.contains_secret_values !== false ||
    payload.production_release_authorized !== false
  ) throw new Error("D1 ledger activation reconciliation receipt is not exact");
  return { receipt_sha256: row.reconciliation_receipt_sha256, activated_at: row.activated_at };
}

function requireExactActivationPayload(payload) {
  exactKeys(payload, [
    "schema_version", "verdict", "activation_epoch", "database_id", "repository",
    "cutoff_workflow_run_id", "workflow_path", "workflow_ref", "control_plane_sha",
    "retained_actions_history_inventory_sha256", "provider_reconciliation_receipt_sha256",
    "provider_readback_sha256_by_target", "imported_unresolved_count", "imported_unresolved_digest",
    "operator_authority_receipt", "provider_readback_verified", "actions_history_reconciled",
    "historical_unresolved_transactions_imported", "reconciled_at", "contains_secret_values",
    "production_release_authorized",
  ], "activation payload");
}

function exactProviderReadbackDigests(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const names = ["api", "web", "app", "auth", "brand"];
  return Object.keys(value).sort().join(",") === [...names].sort().join(",") &&
    names.every((name) => SHA256.test(value[name] ?? ""));
}

function exactOperatorAuthority(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.keys(value).sort().join(",") === ["approval_receipt_sha256", "approver_login", "environment", "type"].sort().join(",") &&
    value.type === "github-environment-approval" && value.environment === "staging" &&
    typeof value.approver_login === "string" && /^[A-Za-z0-9-]{1,39}$/.test(value.approver_login) &&
    SHA256.test(value.approval_receipt_sha256 ?? "");
}

function exactSnapshotBound(responseValue, label) {
  const rows = providerResults(responseValue, label);
  if (
    rows.length !== 1 ||
    Object.keys(rows[0] ?? {}).sort().join(",") !== "event_count,high_water_rowid" ||
    !Number.isSafeInteger(rows[0].event_count) || rows[0].event_count < 0 ||
    !Number.isSafeInteger(rows[0].high_water_rowid) || rows[0].high_water_rowid < 0 ||
    (rows[0].event_count === 0) !== (rows[0].high_water_rowid === 0)
  ) throw new Error(`${label} is not an exact event count`);
  return rows[0];
}

export function validatePagedLedgerSnapshot({ countBefore, countAfter, pages, pageSize }) {
  if (!Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    throw new Error("D1 ledger page size is invalid");
  }
  const before = exactSnapshotBound(countBefore, "D1 count-before response");
  const after = exactSnapshotBound(countAfter, "D1 count-after response");
  if (before.event_count !== after.event_count || before.high_water_rowid !== after.high_water_rowid) {
    throw new Error("D1 ledger changed during its bounded snapshot");
  }
  const expectedPages = Math.ceil(before.event_count / pageSize);
  if (!Array.isArray(pages) || pages.length !== expectedPages) {
    throw new Error("D1 ledger page set is missing, duplicated, or unbounded");
  }
  const rows = [];
  let previousRowid = 0;
  for (let index = 0; index < pages.length; index += 1) {
    const page = pages[index];
    if (page.index !== index || page.afterRowid !== previousRowid) {
      throw new Error("D1 ledger keyset cursor is not exact");
    }
    const pageRows = providerResults(page.response, `D1 page ${index}`);
    const expectedLength = Math.min(pageSize, before.event_count - rows.length);
    if (pageRows.length !== expectedLength) {
      throw new Error("D1 ledger page is truncated or contains an omitted row");
    }
    for (const row of pageRows) {
      if (!Number.isSafeInteger(row?.ledger_rowid) || row.ledger_rowid <= previousRowid || row.ledger_rowid > before.high_water_rowid) {
        throw new Error("D1 ledger keyset rowid is invalid");
      }
      previousRowid = row.ledger_rowid;
    }
    rows.push(...pageRows);
  }
  if (rows.length !== before.event_count || (rows.length > 0 && previousRowid !== before.high_water_rowid)) {
    throw new Error("D1 ledger snapshot length or high-water row does not match its bound");
  }
  const eventIds = new Set();
  for (const row of rows) {
    if (typeof row?.event_id !== "string" || eventIds.has(row.event_id)) {
      throw new Error("D1 ledger snapshot contains a missing or duplicate event identity");
    }
    eventIds.add(row.event_id);
  }
  if (eventIds.size !== before.event_count) throw new Error("D1 ledger unique event count does not match its bound");
  return rows;
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 2) {
    if (!argv[index]?.startsWith("--") || argv[index + 1] === undefined) throw new Error("Arguments must use --name value pairs");
    args[argv[index].slice(2)] = argv[index + 1];
  }
  return args;
}

function schemaCommand(args) {
  const directory = args["evidence-dir"];
  const config = JSON.parse(readFileSync(args.config, "utf8"));
  const names = {
    marker: "schema-marker-response.json",
    activation: "schema-activation-response.json",
    objects: "schema-objects-response.json",
    columns: "schema-columns-response.json",
    indexes: "schema-indexes-response.json",
    indexColumns: "schema-index-columns-response.json",
  };
  const raw = Object.fromEntries(Object.entries(names).map(([key, name]) => [key, response(join(directory, name), name)]));
  const verified = verifySchemaEvidence({
    marker: providerResults(raw.marker, names.marker),
    objects: providerResults(raw.objects, names.objects),
    columns: providerResults(raw.columns, names.columns),
    indexes: providerResults(raw.indexes, names.indexes),
    indexColumns: providerResults(raw.indexColumns, names.indexColumns),
    expectedDigest: config.schema_manifest_sha256,
  });
  const activation = verifyActivationEvidence(providerResults(raw.activation, names.activation), config);
  const receipt = {
    schema_version: 1,
    verdict: "STAGING_DURABLE_LEDGER_SCHEMA_EXACT",
    database_name: config.database_name,
    database_id: config.database_id,
    schema_manifest_sha256: verified.schema_manifest_sha256,
    activation_epoch: config.activation_epoch,
    activation_receipt_sha256: activation.receipt_sha256,
    raw_provider_evidence: Object.fromEntries(Object.entries(names).map(([key, name]) => [key, {
      file: name,
      sha256: digest(readFileSync(join(directory, name))),
    }])),
    append_only_schema_verified: true,
    production_release_authorized: false,
  };
  writeFileSync(args.receipt, `${JSON.stringify(receipt, null, 2)}\n`, { mode: 0o600 });
}

function pagesCommand(args) {
  const directory = args["pages-dir"];
  const pageSize = Number(args["page-size"]);
  const pageFiles = readdirSync(directory).filter((name) => /^page-[0-9]{6}-response\.json$/.test(name)).sort();
  const pages = pageFiles.map((name, index) => {
    if (name !== `page-${String(index).padStart(6, "0")}-response.json`) {
      throw new Error("D1 ledger page filenames are not contiguous");
    }
    const value = response(join(directory, name), name);
    const rows = providerResults(value, name);
    const afterRowid = index === 0 ? 0 : providerResults(response(join(directory, pageFiles[index - 1]), pageFiles[index - 1]), pageFiles[index - 1]).at(-1)?.ledger_rowid;
    if (!Number.isSafeInteger(afterRowid)) throw new Error("D1 ledger prior page has no keyset cursor");
    return { index, afterRowid, response: value, rows };
  });
  const rows = validatePagedLedgerSnapshot({
    countBefore: response(args["count-before"], basename(args["count-before"])),
    countAfter: response(args["count-after"], basename(args["count-after"])),
    pages,
    pageSize,
  });
  writeFileSync(args.output, `${JSON.stringify(rows, null, 2)}\n`, { mode: 0o600 });
}

function main() {
  const [command, ...rest] = process.argv.slice(2);
  const args = parseArgs(rest);
  if (command === "verify-schema") schemaCommand(args);
  else if (command === "assemble-pages") pagesCommand(args);
  else throw new Error("Unknown durable ledger evidence command");
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { main(); } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
