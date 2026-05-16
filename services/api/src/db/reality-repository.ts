import type {
  CommitmentRecord,
  NodeRecord,
  RealityProofRecord,
  StateRecord,
  TransitionRecord,
  TrustScoreRecord,
} from "@omdala/types";
import type {
  ApiBindings,
  RealityCommitmentRequest,
  RealityProofRequest,
} from "../contracts";
import { queryRows } from "./client";
import { toDbQueryError } from "./errors";

type SqlRow = Record<string, unknown>;

async function runWithDbContext<T>(
  operation: string,
  action: () => Promise<T>,
): Promise<T> {
  try {
    return await action();
  } catch (error) {
    throw toDbQueryError(error, operation);
  }
}

function normalizeExplanation(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((item) => String(item));
  }

  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item));
      }
    } catch {
      return [];
    }
  }

  return [];
}

function mapNode(row: SqlRow): NodeRecord {
  const proofCountRaw = row.proof_count ?? row.proofCount ?? 0;
  const resourceCountRaw = row.resource_count ?? row.resourceCount ?? 0;

  return {
    id: String(row.id),
    slug: String(row.slug),
    nodeType: row.node_type as NodeRecord["nodeType"],
    name: String(row.name),
    summary: String(row.summary ?? ""),
    locationText: String(row.location_text ?? ""),
    visibility: row.visibility as NodeRecord["visibility"],
    status: row.status as NodeRecord["status"],
    primaryRole: "business",
    trustLevel: "basic",
    verificationStatus: "pending",
    proofCount: Number(proofCountRaw),
    resourceCount: Number(resourceCountRaw),
  };
}

function mapState(row: SqlRow): StateRecord {
  return {
    id: String(row.id),
    nodeId: String(row.node_id),
    label: String(row.label),
    summary: String(row.summary ?? ""),
    status: row.status as StateRecord["status"],
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

function mapCommitment(row: SqlRow): CommitmentRecord {
  const record: CommitmentRecord = {
    id: String(row.id),
    fromNodeId: String(row.from_node_id),
    toNodeId: String(row.to_node_id),
    title: String(row.title),
    summary: String(row.summary ?? ""),
    status: row.status as CommitmentRecord["status"],
    proofIds: [],
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };

  if (row.amount !== null && row.amount !== undefined) {
    record.amount = Number(row.amount);
  }
  if (row.currency) {
    record.currency = String(row.currency);
  }
  if (row.due_at) {
    record.dueAt = new Date(String(row.due_at)).toISOString();
  }

  return record;
}

function mapTransition(row: SqlRow): TransitionRecord {
  const record: TransitionRecord = {
    id: String(row.id),
    nodeId: String(row.node_id),
    fromStateLabel: String(row.from_state_label),
    toStateLabel: String(row.to_state_label),
    summary: String(row.summary ?? ""),
    status: row.status as TransitionRecord["status"],
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };

  if (row.commitment_id) {
    record.commitmentId = String(row.commitment_id);
  }

  return record;
}

function mapProof(row: SqlRow): RealityProofRecord {
  const record: RealityProofRecord = {
    id: String(row.id),
    type: row.proof_type as RealityProofRecord["type"],
    summary: String(row.summary),
    verificationStatus:
      row.verification_status as RealityProofRecord["verificationStatus"],
    createdAt: new Date(String(row.created_at)).toISOString(),
  };

  if (row.commitment_id) {
    record.commitmentId = String(row.commitment_id);
  }
  if (row.transition_id) {
    record.transitionId = String(row.transition_id);
  }

  return record;
}

function mapTrust(row: SqlRow): TrustScoreRecord {
  return {
    nodeId: String(row.node_id),
    score: Number(row.score),
    level: row.level as TrustScoreRecord["level"],
    explanation: normalizeExplanation(row.explanation),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function listNodes(env: ApiBindings): Promise<NodeRecord[]> {
  const rows = (await runWithDbContext("listNodes", () =>
    queryRows(
      env,
      "SELECT id, slug, node_type, name, summary, location_text, visibility, status, 0 AS proof_count, 0 AS resource_count FROM nodes ORDER BY created_at DESC LIMIT 200",
    ),
  )) as SqlRow[];
  return rows.map(mapNode);
}

export async function listStates(env: ApiBindings): Promise<StateRecord[]> {
  const rows = (await runWithDbContext("listStates", () =>
    queryRows(
      env,
      "SELECT id, node_id, label, summary, status, updated_at FROM states ORDER BY updated_at DESC LIMIT 200",
    ),
  )) as SqlRow[];
  return rows.map(mapState);
}

export async function listCommitments(
  env: ApiBindings,
): Promise<CommitmentRecord[]> {
  const rows = (await runWithDbContext("listCommitments", () =>
    queryRows(
      env,
      "SELECT id, from_node_id, to_node_id, title, summary, amount, currency, due_at, status, created_at, updated_at FROM commitments ORDER BY created_at DESC LIMIT 200",
    ),
  )) as SqlRow[];
  return rows.map(mapCommitment);
}

export async function createCommitment(
  env: ApiBindings,
  input: Required<
    Pick<
      RealityCommitmentRequest,
      "fromNodeId" | "toNodeId" | "title" | "summary"
    >
  > &
    Omit<
      RealityCommitmentRequest,
      "fromNodeId" | "toNodeId" | "title" | "summary"
    >,
): Promise<CommitmentRecord> {
  const id = generateId("commitment");
  const now = new Date().toISOString();

  const rows = (await runWithDbContext("createCommitment", () =>
    queryRows(
      env,
      `INSERT INTO commitments (id, from_node_id, to_node_id, title, summary, amount, currency, due_at, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'draft', $9, $10)
     RETURNING id, from_node_id, to_node_id, title, summary, amount, currency, due_at, status, created_at, updated_at`,
      [
        id,
        input.fromNodeId,
        input.toNodeId,
        input.title,
        input.summary,
        input.amount ?? null,
        input.currency ?? null,
        input.dueAt ?? null,
        now,
        now,
      ],
    ),
  )) as SqlRow[];

  if (!rows[0]) {
    throw new Error("Failed to create commitment");
  }

  return mapCommitment(rows[0]);
}

export async function listTransitions(
  env: ApiBindings,
): Promise<TransitionRecord[]> {
  const rows = (await runWithDbContext("listTransitions", () =>
    queryRows(
      env,
      "SELECT id, commitment_id, node_id, from_state_label, to_state_label, summary, status, created_at, updated_at FROM transitions ORDER BY created_at DESC LIMIT 200",
    ),
  )) as SqlRow[];
  return rows.map(mapTransition);
}

export async function listProofs(
  env: ApiBindings,
): Promise<RealityProofRecord[]> {
  const rows = (await runWithDbContext("listProofs", () =>
    queryRows(
      env,
      "SELECT id, commitment_id, transition_id, proof_type, summary, verification_status, created_at FROM proofs ORDER BY created_at DESC LIMIT 200",
    ),
  )) as SqlRow[];
  return rows.map(mapProof);
}

export async function createProof(
  env: ApiBindings,
  input: Required<Pick<RealityProofRequest, "type" | "summary">> &
    Omit<RealityProofRequest, "type" | "summary">,
): Promise<RealityProofRecord> {
  const id = generateId("proof");
  const now = new Date().toISOString();

  const rows = (await runWithDbContext("createProof", () =>
    queryRows(
      env,
      `INSERT INTO proofs (id, commitment_id, transition_id, proof_type, summary, verification_status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7)
     RETURNING id, commitment_id, transition_id, proof_type, summary, verification_status, created_at`,
      [
        id,
        input.commitmentId ?? null,
        input.transitionId ?? null,
        input.type,
        input.summary,
        now,
        now,
      ],
    ),
  )) as SqlRow[];

  if (!rows[0]) {
    throw new Error("Failed to create proof");
  }

  if (input.commitmentId) {
    await applyTrustDeltaForProofSubmission(
      env,
      input.commitmentId,
      String(rows[0].id),
    );
  }

  return mapProof(rows[0]);
}

async function applyTrustDeltaForProofSubmission(
  env: ApiBindings,
  commitmentId: string,
  eventId: string,
): Promise<void> {
  // NOTE:
  // We intentionally do not block proof creation on trust updates.
  // Trust write path can fail independently (permissions/schema/runtime),
  // but proof should still be stored successfully.
  // This keeps the core execution path resilient while trust remains eventually consistent.
  try {
    const commitmentRows = (await queryRows(
      env,
      "SELECT from_node_id, to_node_id FROM commitments WHERE id = $1 LIMIT 1",
      [commitmentId],
    )) as SqlRow[];

    const commitment = commitmentRows[0];
    if (!commitment) {
      return;
    }

    const candidateNodeIds = [commitment.from_node_id, commitment.to_node_id]
      .map((value) => (value ? String(value) : ""))
      .filter(Boolean);

    for (const nodeId of candidateNodeIds) {
      const trustRows = (await queryRows(
        env,
        "SELECT score, level FROM trust_scores WHERE node_id = $1 LIMIT 1",
        [nodeId],
      )) as SqlRow[];

      const existing = trustRows[0];
      const previousScore = existing ? Number(existing.score) : null;
      const nextScore = existing
        ? Math.min(100, Number(existing.score) + 0.2)
        : 50;
      const nextLevel = existing ? String(existing.level) : "basic";
      const explanation = JSON.stringify([
        "Trust adjusted after proof submission.",
        "Pending verification may increase confidence further.",
      ]);

      if (existing) {
        await queryRows(
          env,
          "UPDATE trust_scores SET score = $2, level = $3, updated_at = NOW() WHERE node_id = $1",
          [nodeId, nextScore, nextLevel],
        );
      } else {
        await queryRows(
          env,
          "INSERT INTO trust_scores (node_id, score, level, explanation, updated_at) VALUES ($1, $2, $3, $4::jsonb, NOW())",
          [nodeId, nextScore, nextLevel, explanation],
        );
      }

      await queryRows(
        env,
        "INSERT INTO trust_score_history (node_id, previous_score, new_score, reason_code, reason_detail, event_id, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW())",
        [
          nodeId,
          previousScore,
          nextScore,
          "proof_submitted",
          "Automated trust update after proof submission.",
          eventId,
        ],
      );
    }
  } catch (error) {
    console.error("applyTrustDeltaForProofSubmission failed", {
      commitmentId,
      eventId,
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function listTrust(env: ApiBindings): Promise<TrustScoreRecord[]> {
  const rows = (await runWithDbContext("listTrust", () =>
    queryRows(
      env,
      "SELECT node_id, score, level, CAST(explanation AS text) AS explanation, updated_at FROM trust_scores ORDER BY updated_at DESC LIMIT 200",
    ),
  )) as SqlRow[];
  return rows.map(mapTrust);
}

export async function getTrustByNodeId(
  env: ApiBindings,
  nodeId: string,
): Promise<TrustScoreRecord | null> {
  const rows = (await runWithDbContext("getTrustByNodeId", () =>
    queryRows(
      env,
      "SELECT node_id, score, level, CAST(explanation AS text) AS explanation, updated_at FROM trust_scores WHERE node_id = $1 LIMIT 1",
      [nodeId],
    ),
  )) as SqlRow[];
  if (!rows[0]) {
    return null;
  }
  return mapTrust(rows[0]);
}
