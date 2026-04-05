import Fastify from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { registerRoutes } from './routes.js';

export function createApp() {
  const app = Fastify({ logger: true });

  void app.register(swagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'Om AI Platform API',
        version: '1.0.0',
        description: 'Policy-first, proof-first, and live-session-ready API for Om AI Reality and Om AI Live.',
      },
      servers: [{ url: 'http://localhost:3001' }],
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'Token as userId:role in dev',
          },
        },
      },
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

  registerRoutes(app);
  return app;
}
