// AI Task Job Handler
// Processes agent tasks through the sole AIAGENT authority, then records the
// provider's reconciled receipt, usage, and cost. There is no alternate
// provider route in this worker.

import { pg } from '../lib/db.js';
import {
  AIAGENT_DEFAULT_MODEL,
  buildAiagentRequestId,
  callAiagentChat,
} from '../lib/aiagent.js';

const UUID_PATTERN = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;

export async function aiTaskJob(job, dependencies = {}) {
  const { taskId, model, prompt, maxTokens } = job.data;
  if (!UUID_PATTERN.test(String(taskId || ''))) throw new Error('AI_TASK_ID_INVALID');

  const requestedModel = model ?? AIAGENT_DEFAULT_MODEL;
  const requestedMaxTokens = maxTokens ?? 2000;
  const requestId = buildAiagentRequestId(JSON.stringify({
    type: 'ai-task', taskId, model: requestedModel, prompt, maxTokens: requestedMaxTokens,
  }));
  const startedAt = Date.now();

  const taskResult = await pg.query(
    `SELECT tenant_id, status, output_payload, cost_actual, token_count, model_used
     FROM omdala.agent_tasks WHERE id = $1`,
    [taskId],
  );
  if (taskResult.rows.length === 0) throw new Error(`Task not found: ${taskId}`);

  const prior = completedResult(taskResult.rows[0], requestId);
  if (prior) return prior;
  if (hasReceipt(taskResult.rows[0])) throw new Error('AI_TASK_EXISTING_OUTPUT_CONFLICT');

  const aiagentCall = dependencies.aiagentCall || callAiagentChat;
  const result = await aiagentCall({
    messages: [{ role: 'user', content: prompt }],
    model: requestedModel,
    maxTokens: requestedMaxTokens,
    requestId,
    taskType: 'chat',
    env: dependencies.env || process.env,
    fetchImpl: dependencies.fetchImpl || globalThis.fetch,
  });

  const durationMs = Date.now() - startedAt;
  const tokenInput = result.data.usage.input_tokens;
  const tokenOutput = result.data.usage.output_tokens;
  const costUsd = result.data.cost_usd;
  const outputPayload = {
    contract_version: result.contractVersion,
    trace_id: result.traceId,
    receipt_hash: result.receipt.receipt_hash,
    receipt_signing_key_id: result.receipt.signing_key_id,
    ...result.data,
  };
  const evidence = {
    model: result.data.model,
    tokenInput,
    tokenOutput,
    costUsd,
    durationMs,
    requestId: result.data.request_id,
    traceId: result.traceId,
    runId: result.data.run_id,
    receiptId: result.data.receipt_id,
    receiptHash: result.receipt.receipt_hash,
    receiptSigningKeyId: result.receipt.signing_key_id,
    ledgerEntryId: result.data.ledger_entry_id,
    contractVersion: result.contractVersion,
  };

  const persisted = await pg.query(
    `WITH updated AS (
       UPDATE omdala.agent_tasks
       SET status = 'completed',
           output_payload = $1,
           cost_actual = COALESCE(cost_actual, 0) + $2,
           token_count = COALESCE(token_count, 0) + $3,
           model_used = $4,
           completed_at = now()
       WHERE id = $5
         AND (output_payload IS NULL OR output_payload->>'receipt_id' IS NULL)
       RETURNING tenant_id
     ), usage_insert AS (
       INSERT INTO omdala.model_usage
         (tenant_id, task_id, model, provider, token_input, token_output, cost_usd, latency_ms)
       SELECT tenant_id, $5, $4, 'iai-one', $6, $7, $2, $8 FROM updated
       RETURNING id
     )
     INSERT INTO omdala.evidence_logs
       (tenant_id, entity_type, entity_id, action, actor_type, payload)
     SELECT tenant_id, 'agent_task', $5, 'ai_completion', 'agent', $9 FROM updated
     RETURNING id`,
    [JSON.stringify(outputPayload), costUsd, tokenInput + tokenOutput, result.data.model,
      taskId, tokenInput, tokenOutput, durationMs, JSON.stringify(evidence)],
  );

  if (persisted.rowCount === 0 && persisted.rows.length === 0) {
    const concurrent = await pg.query(
      'SELECT tenant_id, status, output_payload, cost_actual, token_count, model_used FROM omdala.agent_tasks WHERE id = $1',
      [taskId],
    );
    const existing = completedResult(concurrent.rows[0], requestId);
    if (!existing || existing.receiptId !== result.data.receipt_id) {
      throw new Error('AI_TASK_RECEIPT_CONFLICT');
    }
    return existing;
  }

  return resultSummary(result, durationMs);
}

function completedResult(row, requestId) {
  if (!row || row.status !== 'completed' || !row.output_payload) return null;
  const output = typeof row.output_payload === 'string' ? JSON.parse(row.output_payload) : row.output_payload;
  if (!output || output.request_id !== requestId || typeof output.receipt_id !== 'string') {
    throw new Error('AI_TASK_EXISTING_OUTPUT_CONFLICT');
  }
  return {
    success: true,
    replayed: true,
    costUsd: Number(output.cost_usd),
    tokens: Number(output.usage?.total_tokens),
    durationMs: Number(output.usage?.latency_ms || 0),
    requestId: output.request_id,
    traceId: output.trace_id,
    runId: output.run_id,
    receiptId: output.receipt_id,
    receiptHash: output.receipt_hash,
    ledgerEntryId: output.ledger_entry_id,
  };
}

function hasReceipt(row) {
  if (!row?.output_payload) return false;
  const output = typeof row.output_payload === 'string' ? JSON.parse(row.output_payload) : row.output_payload;
  return typeof output?.receipt_id === 'string' && output.receipt_id.length > 0;
}

function resultSummary(result, durationMs) {
  return {
    success: true,
    replayed: false,
    costUsd: result.data.cost_usd,
    tokens: result.data.usage.total_tokens,
    durationMs,
    requestId: result.data.request_id,
    traceId: result.traceId,
    runId: result.data.run_id,
    receiptId: result.data.receipt_id,
    receiptHash: result.receipt.receipt_hash,
    ledgerEntryId: result.data.ledger_entry_id,
  };
}
