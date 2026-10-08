// Test Helper for API Gateway
// Builds a Fastify instance and monkey-patches pg.query for route mocking.

import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
// Prevent Redis from connecting during tests
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:0';

import { pg } from './lib/db.js';

import healthRoutes from './routes/health.js';
import userRoutes from './routes/users.js';
import projectRoutes from './routes/projects.js';
import taskRoutes from './routes/tasks.js';
import approvalRoutes from './routes/approvals.js';

/**
 * Build app for testing.
 * @param {object} opts
 * @param {Function} opts.mockPgQuery - async (sql, params) => { rows: [...] }
 * @param {Function} opts.mockRedisPing - async () => 'PONG'
 * @param {object} opts.user - mock user
 * @param {object} opts.tenant - mock tenant
 */
export async function buildApp(opts = {}) {
  // Monkey-patch pg.query for tests
  const originalQuery = pg.query.bind(pg);
  pg.query = opts.mockPgQuery || originalQuery;

  const app = Fastify({ logger: false });

  // Store mocks for health tests
  app.decorate('mockRedisPing', opts.mockRedisPing || (async () => 'PONG'));
  app.decorate('mockR2Check', true);

  // Security plugins (relaxed for tests)
  await app.register(cors, { origin: true });
  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(rateLimit, { max: 1000, timeWindow: 60000 });

  // Mock tenant + user for authenticated routes
  app.addHook('onRequest', async (request) => {
    if (!request.url.startsWith('/health')) {
      request.user = opts.user || { id: 'user-001', email: 'test@omdala.com', roles: ['tenant_admin'] };
      request.tenant = opts.tenant || { id: 'tenant-001', slug: 'demo', plan: 'pro' };
      // Auto-set tenant header for middleware compatibility
      if (!request.headers['x-tenant-id']) {
        request.headers['x-tenant-id'] = request.tenant.slug;
      }
    }
  });

  // Register routes
  await app.register(healthRoutes);
  await app.register(userRoutes, { prefix: '/users' });
  await app.register(projectRoutes, { prefix: '/projects' });
  await app.register(taskRoutes, { prefix: '/tasks' });
  await app.register(approvalRoutes, { prefix: '/approvals' });

  // 404
  app.setNotFoundHandler(async (request, reply) => {
    reply.code(404).send({ error: 'Not Found', path: request.url });
  });

  // Error handler
  app.setErrorHandler((err, request, reply) => {
    reply.code(err.statusCode || 500).send({
      error: err.message || 'Internal Server Error',
      code: err.code,
    });
  });

  // Restore original query on close
  const originalClose = app.close.bind(app);
  app.close = async () => {
    pg.query = originalQuery;
    return originalClose();
  };

  return app;
}
