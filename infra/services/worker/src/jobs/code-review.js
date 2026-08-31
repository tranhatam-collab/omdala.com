// AI Code Review Job Handler
// Analyzes code diffs using LLM and posts comments to GitHub PR.

import { pg } from '../lib/db.js';

export async function codeReviewJob(job) {
  const { prUrl, diff, repo, prNumber, commitSha } = job.data;

  if (!diff) {
    throw new Error('Missing code diff');
  }

  // Truncate diff to fit model context window
  const maxDiffLength = 8000;
  const truncatedDiff = diff.length > maxDiffLength
    ? diff.slice(0, maxDiffLength) + '\n\n[... truncated ...]'
    : diff;

  const prompt = `You are a senior code reviewer. Review the following diff and provide:
1. Summary of changes
2. Potential bugs or issues
3. Security concerns
4. Performance suggestions
5. Code style notes

Diff:
${truncatedDiff}

Respond in JSON format:
{
  "summary": "...",
  "issues": [{"severity": "high|medium|low", "line": 0, "message": "..."}],
  "security": [],
  "performance": [],
  "style": []
}`;

  const response = await fetch(process.env.AI_API_URL || 'https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI review failed: ${error}`);
  }

  const result = await response.json();
  const review = JSON.parse(result.choices[0].message.content);

  // Post to GitHub PR if token available
  if (process.env.GITHUB_TOKEN && repo && prNumber) {
    await postGitHubReview(repo, prNumber, commitSha, review);
  }

  // Log review for evidence
  await pg.query(
    `INSERT INTO omdala.evidence_logs (tenant_id, entity_type, entity_id, action, actor_type, payload)
     VALUES ($1, 'code_review', $2, 'completed', 'agent', $3)`,
    [job.data.tenantId || null, prUrl || commitSha, JSON.stringify({ issues: review.issues.length })]
  );

  return { success: true, review };
}

async function postGitHubReview(repo, prNumber, commitSha, review) {
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
`;

  await fetch(`https://api.github.com/repos/${repo}/issues/${prNumber}/comments`, {
    method: 'POST',
    headers: {
      'Authorization': `token ${process.env.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ body }),
  });
}
