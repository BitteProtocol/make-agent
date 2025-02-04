import { Command } from "commander";

import { PluginService } from "../services/plugin";
import { deployedUrl } from "../utils/deployed-url";
import { validateAndParseOpenApiSpec } from "../utils/openapi";
import { getHostname, getSpecUrl } from "../utils/url-utils";

export const verifyCommand = new Command()
  .name("verify")
  .description("Request verification of your deployed AI agent plugin")
  .requiredOption("-u, --url <url>", "Specify the url of the deployed plugin")
  .requiredOption(
    "-e, --email <email>",
    "Provide an email so we can contact you regarding the verification process",
  )
  .requiredOption(
    "-r, --repo <repoUrl>",
    "To verify a plugin we need the url for a public repository containing the plugin's code",
  )
  .option(
    "-v, --version [versionNumber]",
    "Specify the version of the plugin in case of an update",
  )
  .option(
    "-c, --categories [categories]",
    "List some categories that describe the type of plugin you're verifying. Example: -c DeFi,Investing",
    (categories) =>
      categories && typeof categories === "string" && categories.length > 0
        ? categories.split(",")
        : null,
  )
  .option(
    "-x, --chains [chainIds]",
    "If your plugin works on specific evm chains, you can specify them so your plugin is easier to find. If your plugin does not work on evm you can ignore this flag. Example: -x 1,8453",
    (str) => {
      // convert comma separated numbers on a string to an int array
      if (!str || typeof str !== "string" || str.length === 0) {
        return null;
      }
      const strArray = str.split(",");
      return strArray.map((num) => parseInt(num));
    },
  )
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

    await new PluginService().verify({
      pluginId,
      email: options.email,
      repo: options.repo,
      version: options.version,
      categories: options.categories,
      chains: options.chains,
    });
  });
