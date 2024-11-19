import { Command } from "commander";

import { TunnelService } from "../services/tunnel";
import { detectPort } from "../utils/port-detector";

export const devCommand = new Command()
  .name("dev")
  .description("Make your AI agent discoverable and register the plugin")
  .option("-p, --port <number>", "Local port to expose", parseInt)
  .option("-s, --serveo", "Use Serveo instead of Localtunnel", false)
  .option("-t, --testnet", "Use Testnet instead of Mainnet", false)
  .action(async (options) => {
    let port = options.port;
    if (!port) {
      port = await detectPort();
      if (!port) {
        console.error(
          "Unable to detect the port automatically. Please specify a port using the -p or --port option.",
        );
        process.exit(1);
      }
      console.log(`Detected port: ${port}`);
    }
    const tunnelService = new TunnelService({
      port,
      useServeo: options.serveo,
      useTestnet: options.testnet,
    });
    await tunnelService.start();
  });
