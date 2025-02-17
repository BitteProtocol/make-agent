import type { BitteExtensionSchema } from "bitte-ai-spec";
import { Command } from "commander";

import { setup } from "./setup.ts";
import { PluginService } from "../services/plugin";

type VerifyData = {
  accountId: string;
  email: string;
  repo: string;
  version?: string;
  categories?: string[];
  chainIds?: number[];
};

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
    const { pluginId, xMbSpec } = await setup(options.url);

    try {
      const agentData = formVerifyData(xMbSpec, options);

      await new PluginService().verify({
        pluginId,
        ...agentData,
      });
    } catch (error) {
      console.error(`Failed to send verification request: ${error}`);
    }
  });

function formVerifyData(
  xMbSpec: BitteExtensionSchema,
  options?: {
    version?: string;
    categories?: string[];
    chains?: number[];
  },
): VerifyData {
  const accountId = xMbSpec["account-id"];
  const email = (options as { email?: string }).email ?? xMbSpec.email;
  const repo = (options as { repo?: string }).repo ?? xMbSpec.assistant.repo;

  if (!accountId || !email || !repo) {
    const missing = [
      !accountId && "[account-id] in OpenAPI spec",
      !email && "email",
      !repo && "repository URL",
    ]
      .filter(Boolean)
      .join(", ");
    throw new Error(`Missing required fields: ${missing}`);
  }

  return {
    accountId,
    email,
    repo,
    version: options?.version || xMbSpec.assistant.version,
    categories: options?.categories || xMbSpec.assistant.categories,
    chainIds: options?.chains || xMbSpec.assistant.chainIds,
  };
}
