#!/usr/bin/env bun
import { fetch } from 'bun';
import { program } from 'commander';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { watch } from 'fs/promises';
import localtunnel from 'localtunnel';
import os from 'os';
import { join, relative } from 'path';
import open from 'open';

const BASE_URL = "https://wallet.bitte.ai/api/ai-plugins";
const CONFIG_DIR = join(os.homedir(), '.ai-agent-cli');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');
const AI_PLUGIN_PATH = ".well-known/ai-plugin.json";
const PLAYGROUND_URL = "https://wallet.bitte.ai/smart-actions/prompt/what%20can%20you%20help%20me%20with%3F?mode=debug&agentId=";

interface Config {
    apiKeys: { [pluginId: string]: string };
}

function loadConfig(): Config {
    if (!existsSync(CONFIG_FILE)) {
        return { apiKeys: {} };
    }
    return JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
}

function saveConfig(config: Config): void {
    if (!existsSync(CONFIG_DIR)) {
        mkdirSync(CONFIG_DIR, { recursive: true });
    }
    writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

function getApiKey(pluginId: string): string | undefined {
    const config = loadConfig();
    return config.apiKeys[pluginId];
}

function setApiKey(pluginId: string, apiKey: string): void {
    const config = loadConfig();
    config.apiKeys[pluginId] = apiKey;
    saveConfig(config);
}

async function registerPlugin(pluginId: string): Promise<string> {
    const response = await fetch(`${BASE_URL}/${pluginId}`, { method: 'POST' });
    if (response.ok) {
        const data = await response.json();
        console.log(`Plugin registered successfully. API Key: ${data.apiKey}`);
        setApiKey(pluginId, data.apiKey);
        console.log(`API key has been stored locally.`);
        return pluginId; 
    } else {
        console.error(`Error registering plugin: ${await response.text()}`);
        throw new Error('Plugin registration failed');
    }
}

async function updatePlugin(pluginId: string): Promise<void> {
    const apiKey = getApiKey(pluginId);
    if (!apiKey) {
        console.error(`No API key found for plugin ${pluginId}. Please register the plugin first.`);
        return;
    }

    const response = await fetch(`${BASE_URL}/${pluginId}`, {
        method: 'PUT',
        headers: { 'bitte-api-key': apiKey },
    });
    if (response.ok) {
        console.log("Plugin updated successfully.");
    } else {
        console.error(`Error updating plugin: ${await response.text()}`);
    }
}

async function deletePlugin(pluginId: string): Promise<void> {
    const apiKey = getApiKey(pluginId);
    if (!apiKey) {
        console.error(`No API key found for plugin ${pluginId}. Please register the plugin first.`);
        return;
    }

    const response = await fetch(`${BASE_URL}/${pluginId}`, {
        method: 'DELETE',
        headers: { 'bitte-api-key': apiKey },
    });
    if (response.ok) {
        console.log("Plugin deleted successfully.");
        const config = loadConfig();
        delete config.apiKeys[pluginId];
        saveConfig(config);
        console.log("API key removed from local storage.");
    } else {
        console.error(`Error deleting plugin: ${await response.text()}`);
    }
}

async function validateOpenApiSpec(url: string | URL): Promise<boolean> {
    const response = await fetch(url);
    const data = await response.json();

    console.log("Validating OpenAPI specification..."); 
    console.log(data); 

    // TODO: Implement proper OpenAPI spec validation
    return true;
}

async function watchForChanges(pluginId: string): Promise<void> {
    const projectDir = process.cwd();
    console.log(`Watching for changes in ${projectDir}`);

    const watcher = watch(projectDir, { recursive: true });

    for await (const event of watcher) {
        const relativePath = relative(projectDir, event.filename! || '');
        // Ignore hidden files and directories
        if (!relativePath.startsWith('.') && !relativePath.includes('node_modules')) {
            console.log(`Change detected in ${relativePath}. Updating plugin...`);
            await updatePlugin(pluginId);
        }
    }
}

async function openPlayground(agentId: string): Promise<void> {
    const playgroundUrl = `${PLAYGROUND_URL}${agentId}`;
    console.log(`Opening playground: ${playgroundUrl}`);
    await open(playgroundUrl);
}

async function startLocalTunnelAndRegister(port: number): Promise<void> {
    const tunnel = await localtunnel({ port });
    console.log(`LocalTunnel URL: ${tunnel.url}`);

    const pluginId = new URL(tunnel.url).hostname;

    if (await validateOpenApiSpec(new URL(`${tunnel.url}/${AI_PLUGIN_PATH}`))) {
        const agentId = await registerPlugin(pluginId);
        await openPlayground(agentId);

        // Set up cleanup on process termination
        const cleanup = async () => {
            console.log('Terminating. Cleaning up...');
            await deletePlugin(pluginId);
            tunnel.close();
            process.exit(0);
        };

        process.on('SIGINT', cleanup);
        process.on('SIGTERM', cleanup);

        console.log('Tunnel is running. Watching for changes. Press Ctrl+C to stop.');
        
        // Start watching for changes
        await watchForChanges(pluginId);
    } else {
        console.error("OpenAPI specification validation failed. Please check your specification and try again.");
        tunnel.close();
    }
}

program
    .name('ai-agent-cli')
    .description('CLI tool for managing AI agents')
    .version('0.0.2');

program
    .command('start')
    .description('Make your AI agent discoverable and register the plugin')
    .requiredOption('-p, --port <number>', 'Local port to expose', parseInt)
    .action(async (options) => {
        await startLocalTunnelAndRegister(options.port);
    });

program
    .command('update')
    .description('Update an existing plugin')
    .argument('<pluginId>', 'Plugin ID (URL without https://)')
    .action(async (pluginId) => {
        await updatePlugin(pluginId);
    });

program
    .command('delete')
    .description('Delete a plugin')
    .argument('<pluginId>', 'Plugin ID (URL without https://)')
    .action(async (pluginId) => {
        await deletePlugin(pluginId);
    });

program.parse();