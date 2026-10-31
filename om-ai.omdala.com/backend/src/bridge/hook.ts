// Fastify wiring of the bridge consumer, for tests and for the day the boundary is opened.
// It is NOT installed by app.ts or server.ts: the public boundary stays closed until the API issues
// bridge credentials and an independent reviewer approves the exact SHA.
import type { FastifyInstance } from 'fastify';
import { bindVerifiedAuthContext } from '../auth.js';
import { fail } from '../response.js';
import { authorizeBridgeRequest, type BridgeDeps } from './consumer.js';

export const BRIDGE_WORKSPACE_HEADER = 'x-omdala-workspace-id';

export function installBridgeAuth(app: FastifyInstance, deps: BridgeDeps): void {
  app.addHook('onRequest', async (request, reply) => {
    const pathname = request.url.split(/[?#]/u, 1)[0] ?? '';
    if (pathname === '/health') return;

    const workspace = request.headers[BRIDGE_WORKSPACE_HEADER];
    const decision = await authorizeBridgeRequest(
      {
        method: request.method,
        path: request.url,
        authorization: request.headers.authorization,
        workspaceId: typeof workspace === 'string' ? workspace : undefined,
      },
      deps,
    );

    if (!decision.ok) {
      await reply.code(decision.status).header('cache-control', 'no-store').send(fail(decision.code));
      return;
    }
    bindVerifiedAuthContext(request, decision.auth);
  });
}
