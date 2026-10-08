import Fastify from 'fastify';
import { bindVerifiedAuthContext, type AuthContext } from './auth.js';
import { registerRoutes } from './routes.js';

const DEFAULT_TEST_IDENTITY: AuthContext = Object.freeze({
  userId: 'test_verified_user',
  role: 'owner',
});

/** Internal route harness. Production entrypoints must use createApp(). */
export function createOperationalTestApp(identity: AuthContext = DEFAULT_TEST_IDENTITY) {
  const app = Fastify({ logger: false });
  app.addHook('onRequest', async (request) => {
    bindVerifiedAuthContext(request, identity);
  });
  registerRoutes(app);
  return app;
}
