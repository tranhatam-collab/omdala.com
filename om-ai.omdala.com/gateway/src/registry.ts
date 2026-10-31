import { PLUGIN_ID_PATTERN } from './dispatcher.js';
import type { GatewayPlugin } from './plugin.js';

export class PluginRegistry {
  private readonly plugins = new Map<string, GatewayPlugin>();

  register(plugin: GatewayPlugin) {
    if (typeof plugin?.pluginId !== 'string' || !PLUGIN_ID_PATTERN.test(plugin.pluginId)) {
      throw new Error('invalid_plugin_id');
    }
    if (this.plugins.has(plugin.pluginId)) {
      throw new Error(`plugin_already_registered:${plugin.pluginId}`);
    }
    this.plugins.set(plugin.pluginId, plugin);
  }

  get(pluginId: string) {
    return this.plugins.get(pluginId);
  }

  list() {
    return [...this.plugins.values()];
  }
}
