import { Command } from "commander";

import { PluginService } from "../services/plugin";
import { deployedUrl } from "../utils/deployed-url";
import { validateAndParseOpenApiSpec } from "../utils/openapi";
import { getSpecUrl, getHostname } from "../utils/url-utils";

export const deployCommand = new Command()
  .name("deploy")
  .description(
    "Deploy your AI agent, making it discoverable and registering it as a plugin",
  )
  .option("-u, --url <url>", "Specify the deployment URL")
  .action(async (options) => {
    const url = options.url || deployedUrl;

    if (!url) {
      console.error("Deployed URL could not be determined.");
      return;
    }

    const id = getHostname(url);
    const specUrl = getSpecUrl(url);
    const { isValid, accountId } = await validateAndParseOpenApiSpec(specUrl);

    if (!isValid) {
      console.error("OpenAPI specification validation failed.");
      return;
    }

    if (!accountId) {
      console.error("Failed to parse account ID from OpenAPI specification.");
      return;
    }
    const pluginService = new PluginService();
    try {
      await pluginService.update(id, accountId);
      console.log(`Plugin ${id} updated successfully.`);
    } catch (error) {
      console.log("Plugin not found. Attempting to register...");
      const result = await pluginService.register({
        pluginId: id,
        accountId,
      });
      if (result) {
        console.log(`Plugin ${id} registered successfully.`);
      } else {
        console.error("Plugin registration failed.");
      }
    }
  });
