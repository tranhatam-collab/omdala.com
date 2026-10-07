// AI Code Review Job Handler
// Analyzes code diffs through the canonical AIAGENT contract and may post the
// validated result to a GitHub pull request.

import { pg } from '../lib/db.js';
import {
  AIAGENT_DEFAULT_MODEL,
  buildAiagentRequestId,
  callAiagentChat,
} from '../lib/aiagent.js';

const UUID_PATTERN = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;

export async function codeReviewJob(job, dependencies = {}) {
  const { taskId, prUrl, diff, repo, prNumber, commitSha } = job.data;
  if (!UUID_PATTERN.test(String(taskId || ''))) throw new Error('CODE_REVIEW_TASK_ID_INVALID');
  if (typeof diff !== 'string' || !diff) throw new Error('Missing code diff');

  const maxDiffLength = 8000;
  const truncatedDiff = diff.length > maxDiffLength
    ? `${diff.slice(0, maxDiffLength)}\n\n[... truncated ...]`
    : diff;
  const model = job.data.model ?? AIAGENT_DEFAULT_MODEL;
  const requestId = buildAiagentRequestId(JSON.stringify({
    type: 'code-review', taskId, repo, prNumber, commitSha, model, diff: truncatedDiff,
  }));
  const taskResult = await pg.query(
    'SELECT tenant_id, status, output_payload FROM omdala.agent_tasks WHERE id = $1',
    [taskId],
  );
  if (taskResult.rows.length === 0) throw new Error(`Task not found: ${taskId}`);
  const prior = completedReview(taskResult.rows[0], requestId);
  if (prior) return prior;
  if (hasReceipt(taskResult.rows[0])) throw new Error('CODE_REVIEW_EXISTING_OUTPUT_CONFLICT');

  const prompt = `You are a senior code reviewer. Review the following diff and provide:
1. Summary of changes
2. Potential bugs or issues
3. Security concerns
4. Performance suggestions
5. Code style notes

Diff:
${truncatedDiff}

Respond with only one JSON object in this exact shape:
{
  "summary": "...",
  "issues": [{"severity": "high|medium|low", "line": 0, "message": "..."}],
  "security": [],
  "performance": [],
  "style": []
}`;

  const startedAt = Date.now();
  const aiagentCall = dependencies.aiagentCall || callAiagentChat;
  const result = await aiagentCall({
    messages: [{ role: 'user', content: prompt }],
    model,
    maxTokens: 2000,
    requestId,
    taskType: 'code-review',
    env: dependencies.env || process.env,
    fetchImpl: dependencies.fetchImpl || globalThis.fetch,
  });
  const durationMs = Date.now() - startedAt;
  const review = parseCodeReview(result.data.response);
  const outputPayload = {
    contract_version: result.contractVersion,
    trace_id: result.traceId,
    receipt_hash: result.receipt.receipt_hash,
    receipt_signing_key_id: result.receipt.signing_key_id,
    ...result.data,
    review,
  };
  const evidence = {
    issues: review.issues.length,
    model: result.data.model,
    costUsd: result.data.cost_usd,
    requestId: result.data.request_id,
    traceId: result.traceId,
    runId: result.data.run_id,
    receiptId: result.data.receipt_id,
    receiptHash: result.receipt.receipt_hash,
    receiptSigningKeyId: result.receipt.signing_key_id,
    ledgerEntryId: result.data.ledger_entry_id,
    contractVersion: result.contractVersion,
    repository: typeof repo === 'string' ? repo : null,
    pullRequest: Number.isSafeInteger(prNumber) ? prNumber : null,
    commitSha: typeof commitSha === 'string' ? commitSha : null,
    prUrl: typeof prUrl === 'string' ? prUrl : null,
  };

  const persisted = await pg.query(
    `WITH updated AS (
       UPDATE omdala.agent_tasks
       SET status = 'completed', output_payload = $1,
           cost_actual = COALESCE(cost_actual, 0) + $2,
           token_count = COALESCE(token_count, 0) + $3,
           model_used = $4, completed_at = now()
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
     SELECT tenant_id, 'agent_task', $5, 'code_review_completed', 'agent', $9 FROM updated
     RETURNING id`,
    [JSON.stringify(outputPayload), result.data.cost_usd, result.data.usage.total_tokens,
      result.data.model, taskId, result.data.usage.input_tokens, result.data.usage.output_tokens,
      durationMs, JSON.stringify(evidence)],
  );
  const newlyPersisted = persisted.rowCount > 0 || persisted.rows.length > 0;
  if (!newlyPersisted) {
    const concurrent = await pg.query(
      'SELECT tenant_id, status, output_payload FROM omdala.agent_tasks WHERE id = $1',
      [taskId],
    );
    const existing = completedReview(concurrent.rows[0], requestId);
    if (!existing || existing.receiptId !== result.data.receipt_id) {
      throw new Error('CODE_REVIEW_RECEIPT_CONFLICT');
    }
    return existing;
  }

  if (process.env.GITHUB_TOKEN && repo && prNumber) {
    await postGitHubReview(repo, prNumber, commitSha, review, result.data.receipt_id);
  }
  return reviewSummary(result, review, false);
}

function parseCodeReview(content) {
  let review;
  try {
    review = JSON.parse(content);
  } catch (error) {
    throw new Error('AIAGENT_CODE_REVIEW_INVALID: response must be a JSON object', { cause: error });
  }
  if (!review || typeof review !== 'object' || Array.isArray(review)
    || typeof review.summary !== 'string' || review.summary.trim().length === 0 || review.summary.length > 10_000
    || !Array.isArray(review.issues)
    || !Array.isArray(review.security)
    || !Array.isArray(review.performance)
    || !Array.isArray(review.style)) {
    throw new Error('AIAGENT_CODE_REVIEW_INVALID: response schema is incomplete');
  }
  if (review.issues.length > 100
    || !review.issues.every((issue) => issue && typeof issue === 'object'
      && ['high', 'medium', 'low'].includes(issue.severity)
      && Number.isSafeInteger(issue.line) && issue.line >= 0
      && typeof issue.message === 'string' && issue.message.length > 0 && issue.message.length <= 4000)) {
    throw new Error('AIAGENT_CODE_REVIEW_INVALID: issues schema is invalid');
  }
  for (const key of ['security', 'performance', 'style']) {
    if (review[key].length > 100
      || !review[key].every((item) => typeof item === 'string' && item.length > 0 && item.length <= 4000)) {
      throw new Error(`AIAGENT_CODE_REVIEW_INVALID: ${key} schema is invalid`);
    }
  }
  return review;
}

function completedReview(row, requestId) {
  if (!row || row.status !== 'completed' || !row.output_payload) return null;
  const output = typeof row.output_payload === 'string' ? JSON.parse(row.output_payload) : row.output_payload;
  if (!output || output.request_id !== requestId || typeof output.receipt_id !== 'string' || !output.review) {
    throw new Error('CODE_REVIEW_EXISTING_OUTPUT_CONFLICT');
  }
  return {
    success: true,
    replayed: true,
    review: output.review,
    requestId: output.request_id,
    traceId: output.trace_id,
    runId: output.run_id,
    receiptId: output.receipt_id,
    receiptHash: output.receipt_hash,
    ledgerEntryId: output.ledger_entry_id,
    costUsd: Number(output.cost_usd),
  };
}

function hasReceipt(row) {
  if (!row?.output_payload) return false;
  const output = typeof row.output_payload === 'string' ? JSON.parse(row.output_payload) : row.output_payload;
  return typeof output?.receipt_id === 'string' && output.receipt_id.length > 0;
}

function reviewSummary(result, review, replayed) {
  return {
    success: true,
    replayed,
    review,
    requestId: result.data.request_id,
    traceId: result.traceId,
    runId: result.data.run_id,
    receiptId: result.data.receipt_id,
    receiptHash: result.receipt.receipt_hash,
    ledgerEntryId: result.data.ledger_entry_id,
    costUsd: result.data.cost_usd,
  };
}

async function postGitHubReview(repo, prNumber, commitSha, review, receiptId) {
  const marker = `<!-- omdala-aiagent-receipt:${receiptId} -->`;
  const body = `## AI Code Review (OMDALA)

**Summary:** ${review.summary}

### Issues
${review.issues.map(i => `- **${i.severity.toUpperCase()}** (line ${i.line}): ${i.message}`).join('\n') || 'None'}

### Security
${review.security.map(s => `- ${s}`).join('\n') || 'None'}

### Performance
${review.performance.map(p => `- ${p}`).join('\n') || 'None'}

### Style
${review.style.map(s => `- ${s}`).join('\n') || 'None'}
${commitSha ? `\nReviewed commit: \`${commitSha}\`` : ''}

${marker}`;

  const baseUrl = `https://api.github.com/repos/${repo}/issues/${prNumber}/comments`;
  const headers = {
    'Authorization': `token ${process.env.GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };
  const existing = await fetch(`${baseUrl}?per_page=100&sort=created&direction=desc`, {
    headers,
    signal: AbortSignal.timeout(30_000),
  });
  if (!existing.ok) {
    await existing.body?.cancel?.().catch(() => undefined);
    throw new Error(`GITHUB_REVIEW_LOOKUP_FAILED: HTTP ${existing.status}`);
  }
  const comments = await existing.json();
  if (Array.isArray(comments) && comments.some((comment) => typeof comment?.body === 'string' && comment.body.includes(marker))) {
    return;
  }
  const response = await fetch(baseUrl, {
    method: 'POST', headers, body: JSON.stringify({ body }), signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) {
    await response.body?.cancel?.().catch(() => undefined);
    throw new Error(`GITHUB_REVIEW_POST_FAILED: HTTP ${response.status}`);
  }
  await response.body?.cancel?.().catch(() => undefined);
}
