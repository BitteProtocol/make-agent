import { Command } from "commander";
import { updatePlugin } from "../services/plugin-service";
import { validateAndParseOpenApiSpec } from "../services/openapi-service";
import { getSpecUrl, getHostname } from "../utils/url-utils";
import { deployedUrl } from "../utils/deployed-url";
import { getAuthentication } from "../services/signer-service";
import { getBitteUrls } from "../config/constants";

export const updateCommand = new Command()
  .name("update")
  .description("Update an existing AI agent plugin")
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

    const authentication = await getAuthentication(accountId);
    if (!authentication) {
      console.error("Authentication failed. Unable to update the plugin.");
      return;
    }
    const bitteUrls = getBitteUrls();
    try {
      await updatePlugin(pluginId, accountId, bitteUrls.BASE_URL);
      console.log(`Plugin ${pluginId} updated successfully.`);
    } catch (error) {
      console.error("Failed to update the plugin:", error);
    }
  });
