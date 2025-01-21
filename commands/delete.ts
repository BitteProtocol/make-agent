import { Command } from "commander";

import { PluginService } from "../services/plugin";
import { deployedUrl } from "../utils/deployed-url";
import { validateAndParseOpenApiSpec } from "../utils/openapi";
import { getSpecUrl, getHostname } from "../utils/url-utils";

export const deleteCommand = new Command()
  .name("delete")
  .description("Delete your AI agent plugin")
  .option("-u, --url <url>", "Specify the deployment URL")
  .action(async (options) => {
    const url = options.url || deployedUrl;

    if (!url) {
      console.error("Deployed URL could not be determined.");
      return;
    }

    const pluginId = getHostname(url);
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
    const authentication =
      await pluginService.auth.getAuthentication(accountId);
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
