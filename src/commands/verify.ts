import { Command } from "commander";

import type { VerifyData, XMbSpec } from "../config/types";
import { PluginService } from "../services/plugin";
import { deployedUrl } from "../utils/deployed-url";
import { validateAndParseOpenApiSpec } from "../utils/openapi";
import { getHostname, getSpecUrl } from "../utils/url";

export const verifyCommand = new Command()
  .name("verify")
  .description("Request verification of your deployed AI agent plugin")
  .option("-u, --url <url>", "Specify the url of the deployed plugin")
  .option(
    "-e, --email <email>",
    "Provide an email so we can contact you regarding the verification process",
  )
  .option(
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
    const xMbSpec = await validateAndParseOpenApiSpec(specUrl);
    if (!xMbSpec) {
      console.error("OpenAPI specification validation failed.");
      return;
    }

    try {
      const agentData = formVerifyData(options, xMbSpec);

      await new PluginService().verify({
        pluginId,
        ...agentData,
      });
    } catch (error) {
      console.error(`Failed to send verification request: ${error}`);
    }
  });

function formVerifyData(options: unknown, spec: XMbSpec): VerifyData {
  const verifyData: VerifyData = {
    accountId: spec["account-id"],
    email:
      ((options as { email?: string }).email ?? spec.email) ||
      (() => {
        throw new Error("Email is required");
      })(),
    repo:
      ((options as { repo?: string }).repo ?? spec.assistant.repo) ||
      (() => {
        throw new Error("Repository URL is required");
      })(),
    version:
      (options as { version?: string }).version ?? spec.assistant.version,
    categories:
      (options as { categories?: string[] }).categories ??
      spec.assistant.categories,
    chainIds:
      (options as { chains?: number[] }).chains ?? spec.assistant.chainIds,
  };
  return verifyData;
}
