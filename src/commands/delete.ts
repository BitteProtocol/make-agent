import { Command } from "commander";

import { setup } from "./setup.ts";
import { PluginService } from "../services/plugin";

export const deleteCommand = new Command()
  .name("delete")
  .description("Delete your AI agent plugin")
  .option("-u, --url <url>", "Specify the deployment URL")
  .action(async (options) => {
    const pluginService = new PluginService();
    const [{ pluginId }, authentication] = await Promise.all([
      setup(options.url),
      pluginService.auth.getAuthentication(),
    ]);

    if (!authentication) {
      console.error("Authentication failed. Unable to delete the plugin.");
      return;
    }

    try {
      await pluginService.delete(pluginId);
      console.log(`Plugin ${pluginId} deleted successfully.`);
    } catch (error) {
      console.error("Failed to delete the plugin:", error);
    }
  });
