// Health Routes
import Redis from 'ioredis';
import { pg } from '../lib/db.js';

// Lazy-init Redis to allow test mocking
let redis = null;
function getRedis() {
  if (!redis) redis = new Redis(process.env.REDIS_URL);
  return redis;
}

export default async function healthRoutes(app) {
  // Basic health check
  app.get('/health', {
    schema: {
      description: 'Basic health check',
      tags: ['Health'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
            version: { type: 'string' },
            gitCommit: { type: 'string' },
          },
        },
      },
    },
  }, async (_req, reply) => {
    const checks = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.1.0',
      gitCommit: process.env.GIT_COMMIT || 'unknown',
    };
    return reply.send(checks);
  });

  // Deep health check — verifies all dependencies
  app.get('/health/deep', {
    schema: {
      description: 'Deep health check — verifies PostgreSQL, Valkey, R2',
      tags: ['Health'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
            services: { type: 'object' },
          },
        },
        503: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
            services: { type: 'object' },
          },
        },
      },
    },
  }, async (_req, reply) => {
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
      const redisClient = app.mockRedisPing ? { ping: app.mockRedisPing } : getRedis();
      await redisClient.ping();
      checks.services.valkey = { status: 'ok' };
    } catch (err) {
      checks.services.valkey = { status: 'fail', error: err.message };
    }

    // R2 connectivity (check via aws-cli list or env check)
    try {
      if (app.mockR2Check) {
        checks.services.r2 = { status: 'ok' };
      } else {
        const { execSync } = await import('child_process');
        execSync(
          `aws s3 ls s3://${process.env.R2_BUCKET_BACKUPS}/ --endpoint-url ${process.env.R2_ENDPOINT} --region auto --max-items 1`,
          { stdio: 'pipe', timeout: 5000 }
        );
        checks.services.r2 = { status: 'ok' };
      }
    } catch (err) {
      checks.services.r2 = { status: 'fail', error: err.message || 'R2 check failed' };
    }

    const allOk = Object.values(checks.services).every(s => s.status === 'ok');
    checks.status = allOk ? 'ok' : 'degraded';

    return reply.code(allOk ? 200 : 503).send(checks);
  });
}
