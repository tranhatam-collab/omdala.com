// AI Task Job Handler
// Processes agent tasks: calls model API, records usage, stores results.

import { pg } from '../lib/db.js';

export async function aiTaskJob(job) {
  const { taskId, model, prompt, maxTokens } = job.data;
  const startedAt = Date.now();

  // Fetch task from DB
  const taskResult = await pg.query(
    'SELECT tenant_id FROM omdala.agent_tasks WHERE id = $1',
    [taskId]
  );

  if (taskResult.rows.length === 0) {
    throw new Error(`Task not found: ${taskId}`);
  }

  const { tenant_id: tenantId } = taskResult.rows[0];

  // Call AI model API
  const response = await fetch(process.env.AI_API_URL || 'https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: model || 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens || 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI API failed: ${error}`);
  }

  const result = await response.json();
  const durationMs = Date.now() - startedAt;
  const tokenInput = result.usage?.prompt_tokens || 0;
  const tokenOutput = result.usage?.completion_tokens || 0;
  const costUsd = estimateCost(model, tokenInput, tokenOutput);

  // Update task
  await pg.query(
    `UPDATE omdala.agent_tasks
     SET status = 'completed',
         output_payload = $1,
         cost_actual = cost_actual + $2,
         token_count = COALESCE(token_count, 0) + $3,
         model_used = $4,
         completed_at = now()
     WHERE id = $5`,
    [JSON.stringify(result), costUsd, tokenInput + tokenOutput, model, taskId]
  );

  // Record model usage
  await pg.query(
    `INSERT INTO omdala.model_usage (tenant_id, task_id, model, provider, token_input, token_output, cost_usd, latency_ms)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [tenantId, taskId, model, 'openai', tokenInput, tokenOutput, costUsd, durationMs]
  );

  // Create evidence log
  await pg.query(
    `INSERT INTO omdala.evidence_logs (tenant_id, entity_type, entity_id, action, actor_type, payload)
     VALUES ($1, 'agent_task', $2, 'ai_completion', 'agent', $3)`,
    [tenantId, taskId, JSON.stringify({ model, tokenInput, tokenOutput, costUsd, durationMs })]
  );

  return { success: true, costUsd, tokens: tokenInput + tokenOutput, durationMs };
}

function estimateCost(model, inputTokens, outputTokens) {
  // OpenAI pricing (approximate, update as needed)
  const pricing = {
    'gpt-4o': { input: 5 / 1_000_000, output: 15 / 1_000_000 },
    'gpt-4o-mini': { input: 0.15 / 1_000_000, output: 0.6 / 1_000_000 },
    'gpt-4-turbo': { input: 10 / 1_000_000, output: 30 / 1_000_000 },
  };
  const rate = pricing[model] || pricing['gpt-4o'];
  return (inputTokens * rate.input) + (outputTokens * rate.output);
}
