import type { GatewayPlugin } from '../plugin.js';

export function createLocalIpPlugin(): GatewayPlugin {
  return {
    pluginId: 'local_ip',
    name: 'Local IP Plugin',
    protocol: 'local_ip',
    async discover() {},
    async execute() {},
    async reportState() {
      return { protocol: 'local_ip', ok: true };
    },
    async healthCheck() {
      return true;
    },
    async shutdown() {},
  };
}
