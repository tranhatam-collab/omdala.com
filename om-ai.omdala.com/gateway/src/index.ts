import { PluginRegistry } from './registry.js';
import { CommandDispatcher } from './dispatcher.js';
import { createLocalIpPlugin } from './plugins/localIpPlugin.js';
import { createBlePlugin } from './plugins/blePlugin.js';
import { createSerialPlugin } from './plugins/serialPlugin.js';

const registry = new PluginRegistry();

registry.register(createLocalIpPlugin());
registry.register(createBlePlugin());
registry.register(createSerialPlugin());

const dispatcher = new CommandDispatcher((pluginId) => registry.get(pluginId));

void dispatcher.dispatch({
  commandId: 'cmd_demo_01',
  pluginId: 'local_ip',
  payload: { action: 'ping' },
});

process.stdout.write(`Om AI gateway loaded ${registry.list().length} plugin(s)\n`);
