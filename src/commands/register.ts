import { Command } from "commander";
import { registerPlugin } from "../services/plugin-service";
import { openPlayground } from "../services/tunnel-service";
import { validateAndParseOpenApiSpec } from "../services/openapi-service";
import { getSpecUrl, getHostname } from "../utils/url-utils";
import { deployedUrl } from "../utils/deployed-url";

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

        const result = await registerPlugin(pluginId, accountId);
        if (result) {
            const receivedId = await openPlayground(result);
            console.log(`Plugin ${pluginId} registered successfully.`);
            console.log(`Received ID from playground: ${receivedId}`);
        } else {
            console.error('Plugin registration failed.');
        }
    });