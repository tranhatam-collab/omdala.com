// OMDALA API Gateway (P5)
// Full implementation: JWT verification, tenant routing, audit log, rate limit.

import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';

import { jwtVerifyMiddleware } from './middleware/jwt-verify.js';
import { tenantRouterMiddleware } from './middleware/tenant-router.js';
import { auditLogHook } from './middleware/audit-log.js';

import healthRoutes from './routes/health.js';
import userRoutes from './routes/users.js';
import projectRoutes from './routes/projects.js';
import taskRoutes from './routes/tasks.js';
import approvalRoutes from './routes/approvals.js';

const app = Fastify({ logger: true });

// Security plugins
await app.register(cors, {
  origin: [/\.omdala\.com$/, /\.iai\.one$/, /\.muonnoi\.org$/, /\.tranhatam\.com$/],
  credentials: true,
});

await app.register(helmet, {
  contentSecurityPolicy: false, // Allow frontend frameworks
});

await app.register(rateLimit, {
  max: parseInt(process.env.RATE_LIMIT) || 100,
  timeWindow: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  keyGenerator: (req) => req.headers['x-tenant-id'] || req.ip,
});

// Authentication + Tenant routing (onRequest)
app.addHook('onRequest', async (request, reply) => {
  // Skip JWT for health endpoints
  if (request.url.startsWith('/health')) return;

  await jwtVerifyMiddleware(request, reply);
  await tenantRouterMiddleware(request, reply);
});

// Audit logging (onResponse — fires after response is fully sent)
app.addHook('onResponse', auditLogHook);

// Register routes
await app.register(healthRoutes);
await app.register(userRoutes, { prefix: '/users' });
await app.register(projectRoutes, { prefix: '/projects' });
await app.register(taskRoutes, { prefix: '/tasks' });
await app.register(approvalRoutes, { prefix: '/approvals' });

// 404 handler
app.setNotFoundHandler(async (request, reply) => {
  reply.code(404).send({
    error: 'Not Found',
    path: request.url,
    timestamp: new Date().toISOString(),
  });
});

// Error handler
app.setErrorHandler((err, request, reply) => {
  app.log.error(err);
  reply.code(err.statusCode || 500).send({
    error: err.message || 'Internal Server Error',
    code: err.code,
    timestamp: new Date().toISOString(),
  });
});

const PORT = process.env.PORT || 3000;

try {
  await app.listen({ port: PORT, host: '0.0.0.0' });
  app.log.info(`API Gateway listening on ${PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
