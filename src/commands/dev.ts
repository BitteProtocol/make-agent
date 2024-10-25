import { Command } from "commander";
import { startLocalTunnelAndRegister } from "../services/tunnel-service";
import { detectPort } from "../utils/port-detector";

export const devCommand = new Command()
    .name('dev')
    .description('Make your AI agent discoverable and register the plugin')
    .option('-p, --port <number>', 'Local port to expose', parseInt)
    .action(async (options) => {
        let port = options.port;
        if (!port) {
            port = await detectPort();
            if (!port) {
                console.error('Unable to detect the port automatically. Please specify a port using the -p or --port option.');
                process.exit(1);
            }
            console.log(`Detected port: ${port}`);
        }
        await startLocalTunnelAndRegister(port);
    });
