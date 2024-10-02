import { Command } from "commander";
import { registerPlugin } from "../services/plugin-service";
import { validateAndParseOpenApiSpec } from "../services/openapi-service";
import { getSpecUrl, getHostname } from "../utils/url-utils";
import { deployedUrl } from "../utils/deployed-url";
import dotenv from "dotenv";

dotenv.config();

export const deployCommand = new Command()
    .name('deploy')
    .description('Deploy your AI agent, making it discoverable and registering it as a plugin')
    .option('-u, --url <url>', 'Specify the deployment URL')
    .action(async (options) => {
        const url = options.url || deployedUrl;

        if (!url) {
            console.error('Deployed URL could not be determined.');
            return;
        }

        const id = getHostname(url);
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

        const result = await registerPlugin(id, accountId);
        if (result) {
            console.log(`Plugin ${id} registered successfully.`);
        } else {
            console.error('Plugin registration failed.');
        }
    });