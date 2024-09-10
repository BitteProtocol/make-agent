import { getApiKey, loadConfig, saveConfig, setApiKey } from '../config/config';
import { BASE_URL } from '../config/constants';

export async function registerPlugin(pluginId: string): Promise<string | null> {
    try {
        const response = await fetch(`${BASE_URL}/${pluginId}`, { method: 'POST' });
        if (response.ok) {
            const data = await response.json();
            console.log(`Plugin registered successfully. API Key: ${data.apiKey}`);
            setApiKey(pluginId, data.apiKey);
            console.log(`API key has been stored locally.`);
            return pluginId;
        } else {
            const errorText = await response.text();
            console.error(`Error registering plugin: ${errorText}`);
            return null;
        }
    } catch (error) {
        console.error(`Network error during plugin registration: ${error}`);
        return null;
    }
}

export async function updatePlugin(pluginId: string): Promise<void> {
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

export async function deletePlugin(pluginId: string): Promise<void> {
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