import type { GatewayPlugin } from './plugin.js';

export class PluginRegistry {
  private readonly plugins = new Map<string, GatewayPlugin>();

  register(plugin: GatewayPlugin) {
    this.plugins.set(plugin.pluginId, plugin);
  }

  get(pluginId: string) {
    return this.plugins.get(pluginId);
  }

  list() {
    return [...this.plugins.values()];
  }
}
