import { Command } from "commander";
import { validateAndParseOpenApiSpec } from "../services/openapi-service";
import { registerPlugin } from "../services/plugin-service";
import { deployedUrl } from "../utils/deployed-url";
import { getHostname, getSpecUrl } from "../utils/url-utils";
import { getBitteUrls } from "../config/constants";

export const registerCommand = new Command()
    .name('register')
    .description('Register a new plugin with a URL')
    .option('-u, --url <url>', 'Specify the deployment URL')
    .action(async (options) => {
        const url = options.url || deployedUrl;

        if (!url) {
            console.error('Deployed URL could not be determined.');
            return;
        }

        const pluginId = getHostname(url);
        const specUrl = getSpecUrl(url);
        const { isValid, accountId } = await validateAndParseOpenApiSpec(specUrl);

        if (!isValid) {
            console.error('OpenAPI specification validation failed.');
            return;
        }

        if (!accountId) {
            console.error('Failed to parse account ID from OpenAPI specification.');
            return;
        }

        const result = await registerPlugin({ pluginId, accountId, bitteUrls: getBitteUrls() });
        if (result) {
            console.log(`Plugin ${pluginId} registered successfully.`);
        } else {
            console.error('Plugin registration failed.');
        }
    });