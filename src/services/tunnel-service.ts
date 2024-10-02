import { watch, writeFile, readFile, unlink } from 'fs/promises';
import localtunnel from 'localtunnel';
import open from 'open';
import { join, relative } from 'path';
import { PLAYGROUND_URL } from '../config/constants';
import { validateAndParseOpenApiSpec } from './openapi-service';
import { deletePlugin, registerPlugin, updatePlugin } from './plugin-service';
import { getAuthentication } from './signer-service';
import { getSpecUrl } from '../utils/url-utils';
const BITTE_CONFIG_PATH = join(process.cwd(), 'bitte.dev.json');


async function updateBitteConfig(data: any) {
    let existingConfig = {};
    try {
        const existingData = await readFile(BITTE_CONFIG_PATH, 'utf8');
        existingConfig = JSON.parse(existingData);
    } catch (error) {
        // File doesn't exist or couldn't be read, we'll create a new one
    }

    const updatedConfig = { ...existingConfig, ...data };
    await writeFile(BITTE_CONFIG_PATH, JSON.stringify(updatedConfig, null, 2));
    console.log('bitte.dev.json file updated successfully.');
}

export async function watchForChanges(pluginId: string, tunnel: any): Promise<void> {
    const projectDir = process.cwd();
    console.log(`Watching for changes in ${projectDir}`);
    console.log('Any file changes will trigger a plugin update attempt.');

    const watcher = watch(projectDir, { recursive: true });

    for await (const event of watcher) {
        const relativePath = relative(projectDir, event.filename || '');
        // Ignore hidden files and directories
        if (!relativePath.startsWith('.') && !relativePath.includes('node_modules')) {
            console.log(`Change detected in ${relativePath}. Attempting to update or register the plugin...`);
            const { accountId } = await validateAndParseOpenApiSpec(getSpecUrl(tunnel.url));
            const authentication = await getAuthentication(accountId);
            const result = authentication
                ? await updatePlugin(pluginId, accountId)
                : await registerPlugin(pluginId, accountId);
            
            if (result && !authentication) {
                await openPlayground(result);
            } else if (!result && !authentication) {
                console.log('Registration failed. Waiting for next file change to retry...');
            }
        }
    }
}

export async function openPlayground(agentId: string): Promise<string> {
    const playgroundUrl = `${PLAYGROUND_URL}${agentId}`;
    console.log(`Opening playground: ${playgroundUrl}`);
    await open(playgroundUrl);

    console.log('Waiting for the ID from the playground...');
    return "";
}

async function setupAndValidate(tunnel: any, pluginId: string): Promise<void> {
    // First, update bitte.dev.json with the tunnel URL
    await updateBitteConfig({ url: tunnel.url });
    
    await new Promise(resolve => setTimeout(resolve, 1000));

    const specUrl = getSpecUrl(tunnel.url)

    console.log("Validating OpenAPI spec...")
    const { isValid, accountId } = await validateAndParseOpenApiSpec(specUrl);

    if (!isValid) {
        console.log('OpenAPI specification validation failed.');
        return;
    }

    if (!accountId) {
        console.log('Failed to parse account ID from OpenAPI specification.');
        return;
    }    

    const result = await registerPlugin(pluginId, accountId);

    if (!result) {
        console.log('Initial registration failed. Waiting for file changes to retry...');
        return;
    }

    const receivedId = await openPlayground(result);
    console.log(`Received ID from playground: ${receivedId}`);

    // Update bitte.dev.json with additional info
    await updateBitteConfig({
        pluginId,
        receivedId,
    });
}


export async function startLocalTunnelAndRegister(port: number): Promise<void> {
    console.log("Setting up local tunnel...")
    const tunnel = await localtunnel({ port });
    console.log(`LocalTunnel URL: ${tunnel.url}`);

    const pluginId = new URL(tunnel.url).hostname;
    await setupAndValidate(tunnel, pluginId);
    
    // Set up cleanup on process termination
    const cleanup = async () => {
        console.log('Terminating. Cleaning up...');
        const { accountId } = await validateAndParseOpenApiSpec(getSpecUrl(tunnel.url));
        const authentication = await getAuthentication(accountId);
        if (authentication) {
            await deletePlugin(pluginId, accountId);
        }
        tunnel.close();

        const emptyConfig = {
            pluginId: '',
            url: '',
            receivedId: '',
        };
        await writeFile(BITTE_CONFIG_PATH, JSON.stringify(emptyConfig, null, 2));
        console.log('bitte.dev.json file values replaced with empty strings.');

        process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

    console.log('Tunnel is running. Watching for changes. Press Ctrl+C to stop.');

    // Start watching for changes
    await watchForChanges(pluginId, tunnel);
}