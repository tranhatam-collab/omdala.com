// OMDALA API Gateway — Stub (P5)
// Full implementation: JWT verification, tenant routing, audit log, rate limit.

import Fastify from 'fastify';

const app = Fastify({ logger: true });

// Health endpoint (required for all services)
app.get('/health', async (_req, reply) => {
  return reply.send({
    status: 'ok',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.1.0'
  });
});

// Placeholder: will be implemented with JWT + tenant routing
app.get('/', async (_req, reply) => {
  return reply.send({ message: 'OMDALA API Gateway — coming soon' });
});

const PORT = process.env.PORT || 3000;

try {
  await app.listen({ port: PORT, host: '0.0.0.0' });
  app.log.info(`API Gateway listening on ${PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
