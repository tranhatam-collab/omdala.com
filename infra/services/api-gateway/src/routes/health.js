// Health Routes
import { Pool } from 'pg';
import Redis from 'ioredis';

const pg = new Pool({ connectionString: process.env.DATABASE_URL, ssl: false });
const redis = new Redis(process.env.REDIS_URL);

export default async function healthRoutes(app) {
  // Basic health check
  app.get('/health', async (_req, reply) => {
    const checks = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.1.0',
      gitCommit: process.env.GIT_COMMIT || 'unknown',
    };
    return reply.send(checks);
  });

  // Deep health check — verifies all dependencies
  app.get('/health/deep', async (_req, reply) => {
    const checks = {
      timestamp: new Date().toISOString(),
      services: {},
    };

    // PostgreSQL
    try {
      const dbResult = await pg.query('SELECT 1 as check');
      checks.services.postgresql = { status: 'ok', latency: 'unknown' };
    } catch (err) {
      checks.services.postgresql = { status: 'fail', error: err.message };
    }

    // Redis/Valkey
    try {
      await redis.ping();
      checks.services.valkey = { status: 'ok' };
    } catch (err) {
      checks.services.valkey = { status: 'fail', error: err.message };
    }

    // R2 connectivity (check via aws-cli list or env check)
    try {
      const { execSync } = await import('child_process');
      execSync(
        `aws s3 ls s3://${process.env.R2_BUCKET_BACKUPS}/ --endpoint-url ${process.env.R2_ENDPOINT} --region auto --max-items 1`,
        { stdio: 'pipe', timeout: 5000 }
      );
      checks.services.r2 = { status: 'ok' };
    } catch (err) {
      checks.services.r2 = { status: 'fail', error: err.message || 'R2 check failed' };
    }

    const allOk = Object.values(checks.services).every(s => s.status === 'ok');
    checks.status = allOk ? 'ok' : 'degraded';

    return reply.code(allOk ? 200 : 503).send(checks);
  });
}
