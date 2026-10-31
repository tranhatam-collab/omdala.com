import type { GatewayPlugin } from './plugin.js';

export type GatewayCommand = {
  commandId: string;
  pluginId: string;
  payload: unknown;
};

export const PLUGIN_ID_PATTERN = /^[a-z][a-z0-9_]{0,63}$/;
export const MAX_COMMAND_PAYLOAD_BYTES = 64 * 1024;

function assertValidCommand(command: unknown): asserts command is GatewayCommand {
  if (typeof command !== 'object' || command === null || Array.isArray(command)) {
    throw new Error('invalid_command');
  }
  const { commandId, pluginId, payload } = command as Record<string, unknown>;
  if (typeof commandId !== 'string' || commandId.trim().length === 0 || commandId.length > 128) {
    throw new Error('invalid_command:commandId');
  }
  if (typeof pluginId !== 'string' || !PLUGIN_ID_PATTERN.test(pluginId)) {
    throw new Error('invalid_command:pluginId');
  }

  let size: number;
  try {
    const serialized = JSON.stringify(payload ?? null);
    size = serialized === undefined ? 0 : Buffer.byteLength(serialized, 'utf8');
  } catch {
    throw new Error('invalid_command:payload');
  }
  if (size > MAX_COMMAND_PAYLOAD_BYTES) {
    throw new Error('payload_too_large');
  }
}

export class CommandDispatcher {
  constructor(private readonly resolvePlugin: (pluginId: string) => GatewayPlugin | undefined) {}

  async dispatch(command: GatewayCommand) {
    assertValidCommand(command);

    const plugin = this.resolvePlugin(command.pluginId);
    if (!plugin) {
      throw new Error(`plugin_not_found:${command.pluginId}`);
    }

    await plugin.execute(command.payload);
    return { commandId: command.commandId, status: 'dispatched' as const };
  }
}
