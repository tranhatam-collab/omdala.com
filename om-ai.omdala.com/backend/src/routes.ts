import type { FastifyInstance } from 'fastify';
import { registerApprovalsRoutes } from './routes/approvals.js';
import { registerDevicesRoutes } from './routes/devices.js';
import { registerHealthRoutes } from './routes/health.js';
import { registerMemoryRoutes } from './routes/memory.js';
import { registerProofRoutes } from './routes/proofs.js';
import { registerRunsRoutes } from './routes/runs.js';
import { registerScenesRoutes } from './routes/scenes.js';
import { registerTransitionRoutes } from './routes/transitions.js';

export function registerRoutes(app: FastifyInstance) {
  registerHealthRoutes(app);
  registerDevicesRoutes(app);
  registerScenesRoutes(app);
  registerRunsRoutes(app);
  registerTransitionRoutes(app);
  registerProofRoutes(app);
  registerApprovalsRoutes(app);
  registerMemoryRoutes(app);
}
