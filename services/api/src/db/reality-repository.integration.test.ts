// PREP_UNDER_ASSUMPTION(CTL-03, PostgreSQL via Hyperdrive for the main API)
//
// Real-SQL tenant isolation for the reality repository. Skipped unless
// OMDALA_TEST_DATABASE_URL names a TLS-capable scratch server (see
// auth-repository.integration.test.ts for the setup); runs on a throwaway database.
import { randomBytes } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { ApiBindings } from "../contracts";
import { ResourceAccessError } from "./errors";
import {
  createCommitment,
  createProof,
  getTrustByNodeId,
  listCommitments,
  listNodes,
  listProofs,
  listStates,
  listTransitions,
  listTrust,
} from "./reality-repository";

const adminUrl = process.env.OMDALA_TEST_DATABASE_URL;
const migrationsDir = resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "../../../../infra/postgres/migrations",
);
const A = "tenant-a@example.com";
const B = "tenant-b@example.com";

describe.skipIf(!adminUrl)("reality repository tenant isolation on real PostgreSQL", () => {
  const dbName = `omdala_reality_${randomBytes(6).toString("hex")}`;
  let admin: Client;
  let pg: Client;
  let env: ApiBindings;

  beforeAll(async () => {
    admin = new Client({ connectionString: adminUrl });
    await admin.connect();
    await admin.query(`CREATE DATABASE ${dbName}`);
    const url = new URL(adminUrl!);
    url.pathname = `/${dbName}`;
    pg = new Client({ connectionString: url.toString() });
    await pg.connect();
    for (const name of readdirSync(migrationsDir).filter((n) => /^\d{4}_.+\.sql$/.test(n)).sort()) {
      await pg.query(readFileSync(resolve(migrationsDir, name), "utf8"));
    }
    env = { ENVIRONMENT: "test", OMDALA_DB_TLS_INSECURE: "1", DATABASE_URL: url.toString() } as ApiBindings;

    // Tenant A owns a1+a2, a commitment between them, a transition, a proof and trust rows.
    // Tenant B owns b1.
    await pg.query(`
      INSERT INTO omdala.nodes (id, owner_email, slug, node_type, name) VALUES
        ('a1', '${A}', 'a1', 'business', 'A One'),
        ('a2', '${A}', 'a2', 'person', 'A Two'),
        ('b1', '${B}', 'b1', 'business', 'B One');
      INSERT INTO omdala.states (id, node_id, label) VALUES ('sa1', 'a1', 'current'), ('sb1', 'b1', 'current');
      INSERT INTO omdala.commitments (id, from_node_id, to_node_id, title) VALUES ('ca', 'a1', 'a2', 'A deal');
      INSERT INTO omdala.transitions (id, commitment_id, node_id, from_state_label, to_state_label)
        VALUES ('ta', 'ca', 'a1', 'draft', 'active');
      INSERT INTO omdala.proofs (id, owner_email, commitment_id, proof_type, summary)
        VALUES ('pa', '${A}', 'ca', 'document', 'A proof');
      INSERT INTO omdala.trust_scores (node_id, score, level) VALUES ('a1', 70, 'verified'), ('b1', 10, 'basic');
    `);
  });

  afterAll(async () => {
    await pg?.end().catch(() => undefined);
    await admin?.query(`DROP DATABASE IF EXISTS ${dbName} WITH (FORCE)`).catch(() => undefined);
    await admin?.end().catch(() => undefined);
  });

  it("gives tenant A its own rows in every list", async () => {
    expect((await listNodes(env, A)).map((n) => n.id).sort()).toEqual(["a1", "a2"]);
    expect((await listStates(env, A)).length).toBe(1);
    expect((await listCommitments(env, A)).map((c) => c.id)).toEqual(["ca"]);
    expect((await listTransitions(env, A)).length).toBe(1);
    expect((await listProofs(env, A)).map((p) => p.id)).toEqual(["pa"]);
    expect((await listTrust(env, A)).map((t) => t.nodeId)).toEqual(["a1"]);
  });

  it("shows tenant B none of tenant A's rows in any list", async () => {
    expect((await listNodes(env, B)).map((n) => n.id)).toEqual(["b1"]);
    expect((await listStates(env, B)).map((s) => s.nodeId)).toEqual(["b1"]);
    expect(await listCommitments(env, B)).toEqual([]);
    expect(await listTransitions(env, B)).toEqual([]);
    expect(await listProofs(env, B)).toEqual([]);
    expect((await listTrust(env, B)).map((t) => t.nodeId)).toEqual(["b1"]);
  });

  it("answers a trust lookup for another tenant's node with null", async () => {
    expect(await getTrustByNodeId(env, B, "a1")).toBeNull();
    expect((await getTrustByNodeId(env, A, "a1"))?.nodeId).toBe("a1");
  });

  it("returns nothing for an unknown caller", async () => {
    expect(await listNodes(env, "nobody@example.com")).toEqual([]);
    expect(await listTrust(env, "nobody@example.com")).toEqual([]);
  });

  it("refuses commitments that touch another tenant's nodes", async () => {
    const base = { title: "x", summary: "y" };
    await expect(createCommitment(env, B, { ...base, fromNodeId: "a1", toNodeId: "a2" })).rejects.toBeInstanceOf(ResourceAccessError);
    await expect(createCommitment(env, B, { ...base, fromNodeId: "b1", toNodeId: "a2" })).rejects.toBeInstanceOf(ResourceAccessError);
    await expect(createCommitment(env, B, { ...base, fromNodeId: "a1", toNodeId: "b1" })).rejects.toBeInstanceOf(ResourceAccessError);
    expect((await pg.query("SELECT count(*)::int AS n FROM omdala.commitments")).rows[0].n).toBe(1);
  });

  it("creates a commitment inside the caller's own scope", async () => {
    const record = await createCommitment(env, A, { fromNodeId: "a1", toNodeId: "a2", title: "ok", summary: "fine" });
    expect(record.fromNodeId).toBe("a1");
    expect((await listCommitments(env, B)).length).toBe(0);
  });

  it("refuses proofs that reference another tenant's commitment or transition", async () => {
    await expect(createProof(env, B, { type: "document", summary: "s", commitmentId: "ca" })).rejects.toBeInstanceOf(ResourceAccessError);
    await expect(createProof(env, B, { type: "document", summary: "s", transitionId: "ta" })).rejects.toBeInstanceOf(ResourceAccessError);
    expect((await pg.query("SELECT count(*)::int AS n FROM omdala.proofs")).rows[0].n).toBe(1);
  });

  it("creates a proof for the owner and keeps it out of tenant B's list", async () => {
    const proof = await createProof(env, A, { type: "document", summary: "own", commitmentId: "ca" });
    expect(proof.commitmentId).toBe("ca");
    expect((await listProofs(env, B)).length).toBe(0);
  });
});
