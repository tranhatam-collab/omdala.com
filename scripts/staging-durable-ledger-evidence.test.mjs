import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { describe, it } from "node:test";
import {
  EMPTY_UNRESOLVED_IMPORT_SHA256,
  validatePagedLedgerSnapshot,
  verifyActivationEvidence,
  verifySchemaEvidence,
} from "./staging-durable-ledger-evidence.mjs";

const migration = "infra/d1/migrations-audit/0004_staging_transaction_ledger.sql";
const config = JSON.parse(readFileSync("infra/staging/ledger-d1.json", "utf8"));

function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function python(script) {
  const result = spawnSync("python3", ["-c", script, migration], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

function schemaFixture() {
  return python(String.raw`
import json, sqlite3, sys
c=sqlite3.connect(':memory:')
c.executescript(open(sys.argv[1]).read())
tables=['staging_transaction_ledger_schema','staging_transaction_ledger_activation','staging_transaction_events']
q="SELECT type,name,tbl_name,sql FROM sqlite_master WHERE name IN (?,?,?) OR tbl_name IN (?,?,?) ORDER BY type,name"
objects=[dict(zip(['type','name','tbl_name','sql'],r)) for r in c.execute(q,tables+tables)]
columns=[]; indexes=[]; index_columns=[]
for table in tables:
  columns += [dict(table_name=table,cid=r[0],name=r[1],type=r[2],notnull=r[3],dflt_value=r[4],pk=r[5]) for r in c.execute(f"pragma table_info('{table}')")]
  listed=list(c.execute(f"pragma index_list('{table}')"))
  indexes += [dict(table_name=table,seq=r[0],name=r[1],unique=r[2],origin=r[3],partial=r[4]) for r in listed]
  for index in listed:
    index_columns += [dict(table_name=table,index_name=index[1],seqno=r[0],cid=r[1],name=r[2]) for r in c.execute(f"pragma index_info('{index[1]}')")]
print(json.dumps(dict(objects=objects,columns=columns,indexes=indexes,indexColumns=index_columns)))
`);
}

function provider(results) {
  return { success: true, errors: [], result: [{ success: true, results }] };
}

function event(rowid, eventId) {
  return {
    ledger_rowid: rowid,
    event_id: eventId,
    transaction_id: `staging-${40 + rowid}-1`,
    event_type: "PREPARED",
    event_sequence: 0,
    workflow_run_id: 40 + rowid,
    candidate_sha: "a".repeat(40),
    prepared_sha256: "b".repeat(64),
    payload_sha256: "b".repeat(64),
    payload_json: "{}",
    created_at: "2026-10-08T00:00:00Z",
  };
}

describe("D1 durable ledger schema and bounded evidence", () => {
  it("binds exact sqlite_master, column, index, and trigger definitions", () => {
    const fixture = schemaFixture();
    const accepted = verifySchemaEvidence({
      marker: [{ schema_version: 1, database_name: "omdala-audit-staging" }],
      ...fixture,
      expectedDigest: config.schema_manifest_sha256,
    });
    assert.equal(accepted.schema_manifest_sha256, config.schema_manifest_sha256);
    const wrong = structuredClone(fixture);
    wrong.objects.find((entry) => entry.name === "staging_transaction_events_no_delete").sql =
      "CREATE TRIGGER staging_transaction_events_no_delete BEFORE DELETE ON staging_transaction_events BEGIN SELECT 1; END";
    assert.throws(() => verifySchemaEvidence({
      marker: [{ schema_version: 1, database_name: "omdala-audit-staging" }],
      ...wrong,
      expectedDigest: config.schema_manifest_sha256,
    }), /digest mismatch/);
  });

  it("requires an exact immutable activation reconciliation receipt", () => {
    const payload = `${JSON.stringify({
      schema_version: 1,
      verdict: "STAGING_DURABLE_LEDGER_HISTORY_RECONCILED",
      activation_epoch: config.activation_epoch,
      database_id: config.database_id,
      repository: "tranhatam-collab/omdala.com",
      cutoff_workflow_run_id: 40,
      workflow_path: ".github/workflows/staging-transaction.yml",
      workflow_ref: "refs/heads/main",
      control_plane_sha: "a".repeat(40),
      retained_actions_history_inventory_sha256: "b".repeat(64),
      provider_reconciliation_receipt_sha256: "c".repeat(64),
      provider_readback_sha256_by_target: Object.fromEntries(["api", "web", "app", "auth", "brand"].map((name, index) => [name, String(index + 1).repeat(64)])),
      imported_unresolved_count: 0,
      imported_unresolved_digest: EMPTY_UNRESOLVED_IMPORT_SHA256,
      operator_authority_receipt: {
        type: "github-environment-approval",
        environment: "staging",
        approver_login: "founder-operator",
        approval_receipt_sha256: "e".repeat(64),
      },
      provider_readback_verified: true,
      actions_history_reconciled: true,
      historical_unresolved_transactions_imported: true,
      reconciled_at: "2026-10-08T00:00:00Z",
      contains_secret_values: false,
      production_release_authorized: false,
    })}\n`;
    const row = {
      singleton: 1,
      activation_epoch: config.activation_epoch,
      reconciliation_receipt_sha256: digest(payload),
      reconciliation_payload_json: payload,
      activated_at: "2026-10-08T00:00:00Z",
    };
    assert.equal(verifyActivationEvidence([row], config).receipt_sha256, digest(payload));
    assert.throws(() => verifyActivationEvidence([], config), /ACTIVATED/);
    assert.throws(() => verifyActivationEvidence([{ ...row, reconciliation_payload_json: `${payload} ` }], config), /digest/);
    const nonzeroImport = `${JSON.stringify({ ...JSON.parse(payload), imported_unresolved_count: 1 })}\n`;
    assert.throws(() => verifyActivationEvidence([{ ...row, reconciliation_receipt_sha256: digest(nonzeroImport), reconciliation_payload_json: nonzeroImport }], config), /not exact/);
    const forgedEmptyDigest = `${JSON.stringify({ ...JSON.parse(payload), imported_unresolved_digest: "d".repeat(64) })}\n`;
    assert.throws(() => verifyActivationEvidence([{ ...row, reconciliation_receipt_sha256: digest(forgedEmptyDigest), reconciliation_payload_json: forgedEmptyDigest }], config), /not exact/);
    const booleansOnly = `${JSON.stringify({
      schema_version: 1,
      verdict: "STAGING_DURABLE_LEDGER_HISTORY_RECONCILED",
      activation_epoch: config.activation_epoch,
      database_id: config.database_id,
      repository: "tranhatam-collab/omdala.com",
      provider_readback_verified: true,
      actions_history_reconciled: true,
      historical_unresolved_transactions_imported: true,
      contains_secret_values: false,
      production_release_authorized: false,
    })}\n`;
    assert.throws(() => verifyActivationEvidence([{ ...row, reconciliation_receipt_sha256: digest(booleansOnly), reconciliation_payload_json: booleansOnly }], config), /keys are not exact/);
  });

  it("assembles every keyset page and blocks omitted, duplicate, or moving rows", () => {
    const rows = [event(1, "one"), event(2, "two"), event(3, "three")];
    const bound = provider([{ event_count: 3, high_water_rowid: 3 }]);
    const pages = rows.map((row, index) => ({ index, afterRowid: index, response: provider([row]) }));
    assert.deepEqual(validatePagedLedgerSnapshot({ countBefore: bound, countAfter: bound, pages, pageSize: 1 }), rows);
    const omitted = structuredClone(pages);
    omitted[1].response.result[0].results = [];
    assert.throws(() => validatePagedLedgerSnapshot({ countBefore: bound, countAfter: bound, pages: omitted, pageSize: 1 }), /truncated|omitted/);
    const duplicate = structuredClone(pages);
    duplicate[2].response.result[0].results[0].event_id = "two";
    assert.throws(() => validatePagedLedgerSnapshot({ countBefore: bound, countAfter: bound, pages: duplicate, pageSize: 1 }), /duplicate/);
    assert.throws(() => validatePagedLedgerSnapshot({
      countBefore: bound,
      countAfter: provider([{ event_count: 4, high_water_rowid: 4 }]),
      pages,
      pageSize: 1,
    }), /changed/);
  });

  it("enforces activation, exact PREPARED linkage, one unresolved transaction, and append-only terminals atomically", () => {
    const result = python(String.raw`
import hashlib, json, sqlite3, sys
c=sqlite3.connect(':memory:')
c.executescript(open(sys.argv[1]).read())
def blocked(sql,args=()):
  try: c.execute(sql,args); return False
  except sqlite3.DatabaseError: return True
insert="INSERT INTO staging_transaction_events(event_id,transaction_id,event_type,event_sequence,workflow_run_id,candidate_sha,prepared_sha256,payload_sha256,payload_json,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)"
sha='a'*64; candidate='b'*40; now='2026-10-08T00:00:00Z'
def event_payload(kind, transaction, run, candidate_value, prepared=None, padding=None):
  record_type={'PREPARED':'capsule','COMMITTED':'commit','RECOVERED':'recovery'}[kind]
  value={'schema_version':1,'record_type':record_type,'transaction_id':transaction,'workflow_run_id':run,'candidate_sha':candidate_value,'production_release_authorized':False}
  if prepared is not None: value['prepared_record_sha256']=prepared
  if padding is not None: value['padding']=padding
  return json.dumps(value)
orphan=('staging-1-1:COMMITTED','staging-1-1','COMMITTED',1,1,candidate,sha,'c'*64,event_payload('COMMITTED','staging-1-1',1,candidate,sha),now)
before_activation=blocked(insert,orphan)
payload=json.dumps({'schema_version':1,'verdict':'STAGING_DURABLE_LEDGER_HISTORY_RECONCILED','imported_unresolved_count':0,'imported_unresolved_digest':'37517e5f3dc66819f61f5a7bb8ace1921282415f10551d2defa5c3eb0985b570'})+'\n'
c.execute("INSERT INTO staging_transaction_ledger_activation VALUES(1,'omdala-staging-ledger-v1',?,?,?)",(hashlib.sha256(payload.encode()).hexdigest(),payload,now))
orphan_terminal=blocked(insert,orphan)
bad_prepared=blocked(insert,('staging-1-1:PREPARED','staging-1-1','PREPARED',0,1,candidate,sha,'d'*64,event_payload('PREPARED','staging-1-1',1,candidate),now))
oversized_payload=blocked(insert,('staging-9-1:PREPARED','staging-9-1','PREPARED',0,9,candidate,sha,sha,event_payload('PREPARED','staging-9-1',9,candidate,padding='a'*1048576),now))
bad_event_id=blocked(insert,('wrong','staging-9-1','PREPARED',0,9,candidate,sha,sha,event_payload('PREPARED','staging-9-1',9,candidate),now))
bad_transaction_identity=blocked(insert,('staging-8-1:PREPARED','staging-8-1','PREPARED',0,9,candidate,sha,sha,event_payload('PREPARED','staging-8-1',9,candidate),now))
uppercase_hex=blocked(insert,('staging-9-1:PREPARED','staging-9-1','PREPARED',0,9,'A'*40,sha,sha,event_payload('PREPARED','staging-9-1',9,'A'*40),now))
bad_payload_identity=blocked(insert,('staging-9-1:PREPARED','staging-9-1','PREPARED',0,9,candidate,sha,sha,event_payload('PREPARED','staging-10-1',9,candidate),now))
prepared=('staging-1-1:PREPARED','staging-1-1','PREPARED',0,1,candidate,sha,sha,event_payload('PREPARED','staging-1-1',1,candidate),now)
c.execute(insert,prepared)
exact_retry=blocked(insert,prepared)
second_unresolved=blocked(insert,('staging-2-1:PREPARED','staging-2-1','PREPARED',0,2,candidate,'e'*64,'e'*64,event_payload('PREPARED','staging-2-1',2,candidate),now))
wrong_terminal=blocked(insert,('staging-1-1:COMMITTED','staging-1-1','COMMITTED',1,1,'c'*40,sha,'f'*64,event_payload('COMMITTED','staging-1-1',1,'c'*40,sha),now))
terminal=('staging-1-1:COMMITTED','staging-1-1','COMMITTED',1,1,candidate,sha,'f'*64,event_payload('COMMITTED','staging-1-1',1,candidate,sha),now)
c.execute(insert,terminal)
dual_terminal=blocked(insert,('staging-1-1:RECOVERED','staging-1-1','RECOVERED',1,1,candidate,sha,'1'*64,event_payload('RECOVERED','staging-1-1',1,candidate,sha),now))
event_update=blocked("UPDATE staging_transaction_events SET created_at=? WHERE event_id=?",('x','staging-1-1:PREPARED'))
event_delete=blocked("DELETE FROM staging_transaction_events WHERE event_id=?",('staging-1-1:PREPARED',))
activation_update=blocked("UPDATE staging_transaction_ledger_activation SET activated_at='x'")
print(json.dumps({name:globals()[name] for name in ['before_activation','orphan_terminal','bad_prepared','oversized_payload','bad_event_id','bad_transaction_identity','uppercase_hex','bad_payload_identity','exact_retry','second_unresolved','wrong_terminal','dual_terminal','event_update','event_delete','activation_update']} | {'event_count':c.execute('select count(*) from staging_transaction_events').fetchone()[0]}))
`);
    for (const name of ["before_activation", "orphan_terminal", "bad_prepared", "oversized_payload", "bad_event_id", "bad_transaction_identity", "uppercase_hex", "bad_payload_identity", "exact_retry", "second_unresolved", "wrong_terminal", "dual_terminal", "event_update", "event_delete", "activation_update"]) {
      assert.equal(result[name], true, name);
    }
    assert.equal(result.event_count, 2);
  });
});
