import Fastify from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { installDirectPublicBoundary } from './publicBoundary.js';
import { registerRoutes } from './routes.js';

export function createApp() {
  const app = Fastify({ logger: true });

  const enableDocs = process.env.OM_AI_ENABLE_DOCS === '1';

  if (enableDocs) {
    void app.register(swagger, {
      openapi: {
        openapi: '3.0.0',
        info: {
          title: 'Om AI Platform API',
          version: '1.0.0',
          description: 'Policy-first, proof-first, and live-session-ready API for Om AI Reality and Om AI Live.',
        },
        servers: [{ url: 'http://localhost:3001' }],
      },
    });

    void app.register(swaggerUi, {
      routePrefix: '/docs',
    });

    app.get('/openapi.json', async (_request, reply) => {
      reply.type('application/json');
      const withSwagger = app as typeof app & { swagger: () => unknown };
      return withSwagger.swagger();
    });
  }

  installDirectPublicBoundary(app);
  registerRoutes(app);
  return app;
}
