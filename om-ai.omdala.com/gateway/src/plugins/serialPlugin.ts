import type { GatewayPlugin } from '../plugin.js';

export function createSerialPlugin(): GatewayPlugin {
  return {
    pluginId: 'serial',
    name: 'Serial Plugin',
    protocol: 'serial',
    async discover() {},
    async execute() {},
    async reportState() {
      return { protocol: 'serial', ok: true };
    },
    async healthCheck() {
      return true;
    },
    async shutdown() {},
  };
}
