import { Command } from 'commander';
import { setup } from './setup.ts';

export const validateCommand = new Command()
  .name('validate')
  .description('Validate your AI agent API spec')
  .option('-u, --url <url>', 'Specify the deployment URL')
  .action(async (options) => {
    await setup(options.url);
  });
