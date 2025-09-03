import { Command } from 'commander';

import { PluginService } from '../services/plugin';
import { setup } from './setup.ts';

export const deployCommand = new Command()
  .name('deploy')
  .description(
    'Deploy your AI agent, making it discoverable and registering it as a plugin',
  )
  .option('-u, --url <url>', 'Specify the deployment URL')
  .action(async (options) => {
    const { pluginId } = await setup(options.url);

    const pluginService = new PluginService();
    try {
      const updateRes = await pluginService.update(pluginId);
      if (!updateRes) {
        console.log('Attempting to register plugin...');
        await pluginService.register({ pluginId });
      }
    } catch (error) {
      console.error(`Failed to deploy plugin ${pluginId}. Error: ${error}`);
    }
  });
