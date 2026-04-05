import type { GatewayPlugin } from '../plugin.js';

export function createBlePlugin(): GatewayPlugin {
  return {
    pluginId: 'ble',
    name: 'BLE Plugin',
    protocol: 'ble',
    async discover() {},
    async execute() {},
    async reportState() {
      return { protocol: 'ble', ok: true };
    },
    async healthCheck() {
      return true;
    },
    async shutdown() {},
  };
}
