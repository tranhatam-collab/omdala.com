// Deploy Job Handler
// SSH-based deployment to VPS or Cloudflare Pages/Workers.
// Requires SSH_PRIVATE_KEY and DEPLOY_TARGET environment variables.

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function deployJob(job) {
  const { target, branch = 'main', environment = 'staging', rollback = false } = job.data;

  if (!target) {
    throw new Error('Missing deployment target');
  }

  const deployScripts = {
    'vps-staging': `cd /opt/omdala-infra && git fetch && git checkout ${branch} && docker compose up -d --build`,
    'vps-production': `cd /opt/omdala-infra && git fetch && git checkout ${branch} && ./scripts/health-check.sh && docker compose up -d --build`,
    'cloudflare-pages': `npx wrangler pages deploy --project-name omdala-web --branch ${branch}`,
    'cloudflare-worker': `npx wrangler deploy --env ${environment}`,
  };

  const script = deployScripts[target];
  if (!script) {
    throw new Error(`Unknown deploy target: ${target}`);
  }

  const { stdout, stderr } = await execAsync(script, {
    env: { ...process.env, DEPLOY_ENV: environment },
    timeout: 300_000, // 5 minutes
  });

  if (stderr && !stderr.includes('warning')) {
    throw new Error(`Deploy failed: ${stderr}`);
  }

  return { success: true, target, environment, output: stdout };
}
