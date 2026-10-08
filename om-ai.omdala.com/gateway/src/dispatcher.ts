import type { GatewayPlugin } from './plugin.js';

export type GatewayCommand = {
  commandId: string;
  pluginId: string;
  payload: unknown;
};

export class CommandDispatcher {
  constructor(private readonly resolvePlugin: (pluginId: string) => GatewayPlugin | undefined) {}

  async dispatch(command: GatewayCommand) {
    const plugin = this.resolvePlugin(command.pluginId);
    if (!plugin) {
      throw new Error(`plugin_not_found:${command.pluginId}`);
    }

    await plugin.execute(command.payload);
    return { commandId: command.commandId, status: 'dispatched' as const };
  }
}
