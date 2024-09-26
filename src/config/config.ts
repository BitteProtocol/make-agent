import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { CONFIG_DIR, CONFIG_FILE } from './constants';

interface Config {
    apiKeys: { [pluginId: string]: string };
}

export function loadConfig(): Config {
    if (!existsSync(CONFIG_FILE)) {
        return { apiKeys: {} };
    }
    return JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
}

export function saveConfig(config: Config): void {
    if (!existsSync(CONFIG_DIR)) {
        mkdirSync(CONFIG_DIR, { recursive: true });
    }
    writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

//deprecate?
export function getApiKey(pluginId: string): string | undefined {
    const config = loadConfig();
    return config.apiKeys[pluginId];
}
//deprecate?
export function setApiKey(pluginId: string, apiKey: string): void {
    const config = loadConfig();
    config.apiKeys[pluginId] = apiKey;
    saveConfig(config);
}