import { watch, writeFile, readFile, unlink } from 'fs/promises';
import localtunnel from 'localtunnel';
import open from 'open';
import { join, relative } from 'path';
import { PLAYGROUND_URL } from '../config/constants';
import { validateAndParseOpenApiSpec } from './openapi-service';
import { deletePlugin, registerPlugin, updatePlugin } from './plugin-service';
import { authenticateOrCreateKey, getAuthentication } from './signer-service';
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

export async function watchForChanges(pluginId: string, tunnelUrl: string): Promise<void> {
    const projectDir = process.cwd();
    console.log(`Watching for changes in ${projectDir}`);
    console.log('Any file changes will trigger a plugin update attempt.');

    const watcher = watch(projectDir, { recursive: true });

    for await (const event of watcher) {
        const relativePath = relative(projectDir, event.filename || '');
        // Ignore hidden files and directories
        if (!relativePath.startsWith('.') && !relativePath.includes('node_modules') &&  !relativePath.includes('bitte.dev.json')) {
            console.log(`Change detected in ${relativePath}. Attempting to update or register the plugin...`);
            const { accountId } = await validateAndParseOpenApiSpec(getSpecUrl(tunnelUrl));
            const authentication = await getAuthentication(accountId);
            const result = authentication
                ? await updatePlugin(pluginId, accountId)
                : await registerPlugin(pluginId);
            
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

async function setupAndValidate(tunnelUrl: string, pluginId: string): Promise<void> {
    await updateBitteConfig({ url: tunnelUrl });
    
    await new Promise(resolve => setTimeout(resolve, 1000));

    const signedMessage = await authenticateOrCreateKey();
    if (!signedMessage) {
        console.log("Failed to authenticate or create a key.");
        return;
    }

    const specUrl = getSpecUrl(tunnelUrl);

    console.log(`Validating OpenAPI spec at ${specUrl}...`);
    const { isValid, accountId } = await validateAndParseOpenApiSpec(specUrl);

    if (!isValid) {
        console.log('OpenAPI specification validation failed.');
        return;
    }

    if (!accountId) {
        console.log('Failed to parse account ID from OpenAPI specification.');
        return;
    }    

    const result = await registerPlugin(pluginId, signedMessage);

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

async function setupTunnel(port: number): Promise<{ tunnelUrl: string; cleanup: () => Promise<void> }> {
    try {
        const tunnel = await localtunnel({ port });
        console.log(`Localtunnel URL: ${tunnel.url}`);
        return {
            tunnelUrl: tunnel.url,
            cleanup: async () => {
                tunnel.close();
            }
        };
    } catch (error) {
        throw new Error("Failed to set up localtunnel.");
    }
}

export async function startLocalTunnelAndRegister(port: number): Promise<void> {
    console.log("Setting up local tunnel...");
    const { tunnelUrl, cleanup } = await setupTunnel(port);

    const pluginId = new URL(tunnelUrl).hostname;
    await setupAndValidate(tunnelUrl, pluginId);
    
    let isCleaningUp = false;

    const fullCleanup = async () => {
        if (isCleaningUp) return;
        isCleaningUp = true;
        console.log('Terminating. Cleaning up...');
        await unlink(BITTE_CONFIG_PATH).catch(() => {});
        console.log('bitte.dev.json file deleted successfully.');
        
        try {
            await deletePlugin(pluginId);
        } catch (error) {
            console.error('Error deleting plugin:', error);
        }
        
        await cleanup();
        console.log('Cleanup completed. Exiting...');
        process.exit(0)
    };
    
    process.on('SIGINT', async () => {
        await fullCleanup();
    });
    
    process.on('SIGTERM', async () => {
        await fullCleanup();
    });

    process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);
        process.exit(1);
    });

    console.log('Tunnel is running. Watching for changes. Press Ctrl+C to stop.');

    // Start watching for changes
    await watchForChanges(pluginId, tunnelUrl);
}