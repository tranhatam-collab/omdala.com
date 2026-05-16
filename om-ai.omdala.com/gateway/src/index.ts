import { PluginRegistry } from './registry.js';
import { CommandDispatcher } from './dispatcher.js';
import { createLocalIpPlugin } from './plugins/localIpPlugin.js';
import { createBlePlugin } from './plugins/blePlugin.js';
import { createSerialPlugin } from './plugins/serialPlugin.js';
import { LiveProviderRouter } from './liveProviderRouter.js';

const registry = new PluginRegistry();

registry.register(createLocalIpPlugin());
registry.register(createBlePlugin());
registry.register(createSerialPlugin());

const dispatcher = new CommandDispatcher((pluginId) => registry.get(pluginId));
const liveProviderRouter = new LiveProviderRouter();

void dispatcher.dispatch({
  commandId: 'cmd_demo_01',
  pluginId: 'local_ip',
  payload: { action: 'ping' },
});

const liveDecision = liveProviderRouter.route({
  workspaceType: 'personal',
  planId: 'free',
  avatarRequested: false,
});

process.stdout.write(`Om AI gateway loaded ${registry.list().length} plugin(s)\n`);
process.stdout.write(
  `Om AI live routing primary=${liveDecision.primary} fallback=${liveDecision.fallback.join(',')} reason=${liveDecision.reason}\n`,
);
