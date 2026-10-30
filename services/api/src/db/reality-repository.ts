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
import { DEFAULT_REALITY_SCENES } from "../reality-scene-defaults";
import { queryRows } from "./client";
import { ResourceAccessError, toDbQueryError } from "./errors";

type SqlRow = Record<string, unknown>;

async function runWithDbContext<T>(
  operation: string,
  action: () => Promise<T>,
): Promise<T> {
  try {
    return await action();
  } catch (error) {
    if (error instanceof ResourceAccessError) {
      throw error;
    }
    throw toDbQueryError(error, operation);
  }
}

export function normalizeExplanation(raw: unknown): string[] {
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

export async function listNodes(
  env: ApiBindings,
  ownerEmail: string,
): Promise<NodeRecord[]> {
  const rows = (await runWithDbContext("listNodes", () =>
    queryRows(
      env,
      "SELECT id, slug, node_type, name, summary, location_text, visibility, status, 0 AS proof_count, 0 AS resource_count FROM omdala.nodes WHERE owner_email = $1 ORDER BY created_at DESC LIMIT 200",
      [ownerEmail],
    ),
  )) as SqlRow[];
  return rows.map(mapNode);
}

export async function listStates(
  env: ApiBindings,
  ownerEmail: string,
): Promise<StateRecord[]> {
  const rows = (await runWithDbContext("listStates", () =>
    queryRows(
      env,
      `SELECT s.id, s.node_id, s.label, s.summary, s.status, s.updated_at
       FROM omdala.states s
       INNER JOIN omdala.nodes n ON n.id = s.node_id
       WHERE n.owner_email = $1
       ORDER BY s.updated_at DESC LIMIT 200`,
      [ownerEmail],
    ),
  )) as SqlRow[];
  return rows.map(mapState);
}

export async function listCommitments(
  env: ApiBindings,
  ownerEmail: string,
): Promise<CommitmentRecord[]> {
  const rows = (await runWithDbContext("listCommitments", () =>
    queryRows(
      env,
      `SELECT c.id, c.from_node_id, c.to_node_id, c.title, c.summary,
              c.amount, c.currency, c.due_at, c.status, c.created_at, c.updated_at
       FROM omdala.commitments c
       INNER JOIN omdala.nodes from_node ON from_node.id = c.from_node_id
       INNER JOIN omdala.nodes to_node ON to_node.id = c.to_node_id
       WHERE from_node.owner_email = $1 AND to_node.owner_email = $1
       ORDER BY c.created_at DESC LIMIT 200`,
      [ownerEmail],
    ),
  )) as SqlRow[];
  return rows.map(mapCommitment);
}

export async function createCommitment(
  env: ApiBindings,
  ownerEmail: string,
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
      `INSERT INTO omdala.commitments
        (id, from_node_id, to_node_id, title, summary, amount, currency, due_at, status, created_at, updated_at)
       SELECT $1, $2, $3, $4, $5, $6, $7, $8, 'draft', $9, $10
       FROM omdala.nodes from_node
       INNER JOIN omdala.nodes to_node ON to_node.id = $3
       WHERE from_node.id = $2
         AND from_node.owner_email = $11
         AND to_node.owner_email = $11
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
        ownerEmail,
      ],
    ),
  )) as SqlRow[];

  if (!rows[0]) {
    throw new ResourceAccessError(
      "Commitment nodes are not available in the current tenant scope",
    );
  }

  return mapCommitment(rows[0]);
}

export async function listTransitions(
  env: ApiBindings,
  ownerEmail: string,
): Promise<TransitionRecord[]> {
  const rows = (await runWithDbContext("listTransitions", () =>
    queryRows(
      env,
      `SELECT t.id, t.commitment_id, t.node_id, t.from_state_label,
              t.to_state_label, t.summary, t.status, t.created_at, t.updated_at
       FROM omdala.transitions t
       INNER JOIN omdala.nodes n ON n.id = t.node_id
       WHERE n.owner_email = $1
       ORDER BY t.created_at DESC LIMIT 200`,
      [ownerEmail],
    ),
  )) as SqlRow[];
  return rows.map(mapTransition);
}

export async function listProofs(
  env: ApiBindings,
  ownerEmail: string,
): Promise<RealityProofRecord[]> {
  const rows = (await runWithDbContext("listProofs", () =>
    queryRows(
      env,
      "SELECT id, commitment_id, transition_id, proof_type, summary, verification_status, created_at FROM omdala.proofs WHERE owner_email = $1 ORDER BY created_at DESC LIMIT 200",
      [ownerEmail],
    ),
  )) as SqlRow[];
  return rows.map(mapProof);
}

export async function createProof(
  env: ApiBindings,
  ownerEmail: string,
  input: Required<Pick<RealityProofRequest, "type" | "summary">> &
    Omit<RealityProofRequest, "type" | "summary">,
): Promise<RealityProofRecord> {
  const id = generateId("proof");
  const now = new Date().toISOString();

  if (input.commitmentId) {
    const rows = (await runWithDbContext("assertProofCommitmentScope", () =>
      queryRows(
        env,
        `SELECT c.id
         FROM omdala.commitments c
         INNER JOIN omdala.nodes from_node ON from_node.id = c.from_node_id
         INNER JOIN omdala.nodes to_node ON to_node.id = c.to_node_id
         WHERE c.id = $1
           AND from_node.owner_email = $2
           AND to_node.owner_email = $2
         LIMIT 1`,
        [input.commitmentId, ownerEmail],
      ),
    )) as SqlRow[];
    if (!rows[0]) {
      throw new ResourceAccessError(
        "Commitment is not available in the current tenant scope",
      );
    }
  }

  if (input.transitionId) {
    const rows = (await runWithDbContext("assertProofTransitionScope", () =>
      queryRows(
        env,
        `SELECT t.id
         FROM omdala.transitions t
         INNER JOIN omdala.nodes n ON n.id = t.node_id
         WHERE t.id = $1 AND n.owner_email = $2
         LIMIT 1`,
        [input.transitionId, ownerEmail],
      ),
    )) as SqlRow[];
    if (!rows[0]) {
      throw new ResourceAccessError(
        "Transition is not available in the current tenant scope",
      );
    }
  }

  const rows = (await runWithDbContext("createProof", () =>
    queryRows(
      env,
      `INSERT INTO omdala.proofs (id, owner_email, commitment_id, transition_id, proof_type, summary, verification_status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8)
     RETURNING id, commitment_id, transition_id, proof_type, summary, verification_status, created_at`,
      [
        id,
        ownerEmail,
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
      ownerEmail,
      input.commitmentId,
      String(rows[0].id),
    );
  }

  return mapProof(rows[0]);
}

async function applyTrustDeltaForProofSubmission(
  env: ApiBindings,
  ownerEmail: string,
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
      `SELECT c.from_node_id, c.to_node_id
       FROM omdala.commitments c
       INNER JOIN omdala.nodes from_node ON from_node.id = c.from_node_id
       INNER JOIN omdala.nodes to_node ON to_node.id = c.to_node_id
       WHERE c.id = $1
         AND (from_node.owner_email = $2 OR to_node.owner_email = $2)
       LIMIT 1`,
      [commitmentId, ownerEmail],
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
        "SELECT score, level FROM omdala.trust_scores WHERE node_id = $1 LIMIT 1",
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
          "UPDATE omdala.trust_scores SET score = $2, level = $3, updated_at = NOW() WHERE node_id = $1",
          [nodeId, nextScore, nextLevel],
        );
      } else {
        await queryRows(
          env,
          "INSERT INTO omdala.trust_scores (node_id, score, level, explanation, updated_at) VALUES ($1, $2, $3, $4::jsonb, NOW())",
          [nodeId, nextScore, nextLevel, explanation],
        );
      }

      await queryRows(
        env,
        "INSERT INTO omdala.trust_score_history (node_id, previous_score, new_score, reason_code, reason_detail, event_id, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW())",
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

export async function listTrust(
  env: ApiBindings,
  ownerEmail: string,
): Promise<TrustScoreRecord[]> {
  const rows = (await runWithDbContext("listTrust", () =>
    queryRows(
      env,
      "SELECT t.node_id, t.score, t.level, CAST(t.explanation AS text) AS explanation, t.updated_at FROM omdala.trust_scores t INNER JOIN omdala.nodes n ON n.id = t.node_id WHERE n.owner_email = $1 ORDER BY t.updated_at DESC LIMIT 200",
      [ownerEmail],
    ),
  )) as SqlRow[];
  return rows.map(mapTrust);
}

export async function getTrustByNodeId(
  env: ApiBindings,
  ownerEmail: string,
  nodeId: string,
): Promise<TrustScoreRecord | null> {
  const rows = (await runWithDbContext("getTrustByNodeId", () =>
    queryRows(
      env,
      "SELECT t.node_id, t.score, t.level, CAST(t.explanation AS text) AS explanation, t.updated_at FROM omdala.trust_scores t INNER JOIN omdala.nodes n ON n.id = t.node_id WHERE t.node_id = $1 AND n.owner_email = $2 LIMIT 1",
      [nodeId, ownerEmail],
    ),
  )) as SqlRow[];
  if (!rows[0]) {
    return null;
  }
  return mapTrust(rows[0]);
}

// ── Scenes and runs (tenant-scoped; migration 0004_reality_scenes_runs) ───────

export type RealitySceneRecord = {
  scene_id: string;
  display_name: string;
  safety_class: string;
  actions: unknown[];
  created_at: string;
};

export type RealityRunRecord = {
  run_id: string;
  source: string;
  source_id: string;
  actor_id: string;
  status: string;
  policy_decision: string;
  proof_id: string | null;
  created_at: string;
};

const iso = (value: unknown): string =>
  value instanceof Date ? value.toISOString() : String(value);

function mapScene(row: SqlRow): RealitySceneRecord {
  return {
    scene_id: String(row.scene_id),
    display_name: String(row.display_name),
    safety_class: String(row.safety_class),
    actions: Array.isArray(row.actions) ? row.actions : [],
    created_at: iso(row.created_at),
  };
}

function mapRun(row: SqlRow): RealityRunRecord {
  return {
    run_id: String(row.run_id),
    source: String(row.source),
    source_id: String(row.source_id),
    actor_id: String(row.actor_id),
    status: String(row.status),
    policy_decision: String(row.policy_decision),
    proof_id: row.proof_id === null || row.proof_id === undefined ? null : String(row.proof_id),
    created_at: iso(row.created_at),
  };
}

// Every tenant starts from the default catalog; seeding is idempotent and
// never touches rows a tenant already has.
async function ensureDefaultScenes(env: ApiBindings, ownerEmail: string): Promise<void> {
  for (const scene of DEFAULT_REALITY_SCENES) {
    await queryRows(
      env,
      `INSERT INTO omdala.reality_scenes (owner_email, scene_id, display_name, safety_class, actions)
       VALUES ($1, $2, $3, $4, $5::jsonb)
       ON CONFLICT (owner_email, scene_id) DO NOTHING`,
      [ownerEmail, scene.scene_id, scene.display_name, scene.safety_class, JSON.stringify(scene.actions)],
    );
  }
}

export async function listScenes(
  env: ApiBindings,
  ownerEmail: string,
): Promise<RealitySceneRecord[]> {
  const rows = (await runWithDbContext("listScenes", async () => {
    await ensureDefaultScenes(env, ownerEmail);
    return queryRows(
      env,
      `SELECT scene_id, display_name, safety_class, actions, created_at
       FROM omdala.reality_scenes
       WHERE owner_email = $1
       ORDER BY created_at ASC, scene_id ASC
       LIMIT 200`,
      [ownerEmail],
    );
  })) as SqlRow[];
  return rows.map(mapScene);
}

/** Runs a scene the caller owns; null when the scene is not in the caller's scope. */
export async function runScene(
  env: ApiBindings,
  ownerEmail: string,
  sceneId: string,
): Promise<RealityRunRecord | null> {
  const rows = (await runWithDbContext("runScene", async () => {
    await ensureDefaultScenes(env, ownerEmail);
    return queryRows(
      env,
      `INSERT INTO omdala.reality_runs
         (owner_email, run_id, source, source_id, actor_id, status, policy_decision, proof_id, created_at)
       SELECT s.owner_email, $3, 'scene', s.scene_id, s.owner_email,
              'succeeded', 'allow_with_logging', $4, NOW()
       FROM omdala.reality_scenes s
       WHERE s.owner_email = $1 AND s.scene_id = $2
       RETURNING run_id, source, source_id, actor_id, status, policy_decision, proof_id, created_at`,
      [ownerEmail, sceneId, generateId("run_scene"), generateId("proof")],
    );
  })) as SqlRow[];
  return rows[0] ? mapRun(rows[0]) : null;
}

export async function listRuns(
  env: ApiBindings,
  ownerEmail: string,
  options: { page: number; limit: number },
): Promise<{ runs: RealityRunRecord[]; total: number }> {
  const offset = (options.page - 1) * options.limit;
  const [totalRows, rows] = (await runWithDbContext("listRuns", () =>
    Promise.all([
      queryRows(env, "SELECT count(*)::int AS total FROM omdala.reality_runs WHERE owner_email = $1", [ownerEmail]),
      queryRows(
        env,
        `SELECT run_id, source, source_id, actor_id, status, policy_decision, proof_id, created_at
         FROM omdala.reality_runs
         WHERE owner_email = $1
         ORDER BY created_at DESC, run_id DESC
         LIMIT $2 OFFSET $3`,
        [ownerEmail, options.limit, offset],
      ),
    ]),
  )) as [SqlRow[], SqlRow[]];
  return { runs: rows.map(mapRun), total: Number(totalRows[0]?.total ?? 0) };
}
