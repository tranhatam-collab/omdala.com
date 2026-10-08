export interface GatewayPlugin {
  pluginId: string;
  name: string;
  protocol: 'local_ip' | 'ble' | 'serial' | 'other';
  discover(): Promise<void>;
  execute(command: unknown): Promise<void>;
  reportState(): Promise<Record<string, unknown>>;
  healthCheck(): Promise<boolean>;
  shutdown(): Promise<void>;
}
