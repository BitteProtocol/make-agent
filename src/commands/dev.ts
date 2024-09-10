import { Command } from "commander";
import { startLocalTunnelAndRegister } from "../services/tunnel-service";

export const devCommand = new Command()
    .name('dev')
    .description('Make your AI agent discoverable and register the plugin')
    .requiredOption('-p, --port <number>', 'Local port to expose', parseInt)
    .action(async (options) => {
        await startLocalTunnelAndRegister(options.port);
    });