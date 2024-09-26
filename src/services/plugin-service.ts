import { loadConfig, saveConfig } from '../config/config';
import { BASE_URL } from '../config/constants';
import { authenticateOrCreateKey, getAuthentication } from './signer-service';

export async function registerPlugin(pluginId: string, accountId: string | undefined): Promise<string | null> {
    const auth = await authenticateOrCreateKey(accountId)

    if(!auth){
        console.error("Failed to register plugin: Authentication failed. Try again.")
        return null
    }

    try {
        const response = await fetch(`${BASE_URL}/${pluginId}`, { method: 'POST' });
        if (response.ok) {
            await response.json();
            console.log(`Plugin registered successfully. API Key: ${auth}`);
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

export async function updatePlugin(pluginId: string, accountId: string | undefined): Promise<void> {
    const message = await getAuthentication(accountId)

    if (!message) {
        console.error(`No API key found for plugin ${pluginId}. Please register the plugin first.`);
        return;
    }

    const response = await fetch(`${BASE_URL}/${pluginId}`, {
        method: 'PUT',
        headers: { 'bitte-api-key': message },
    });
    if (response.ok) {
        console.log("Plugin updated successfully.");
    } else {
        console.error(`Error updating plugin: ${await response.text()}`);
    }
}

export async function deletePlugin(pluginId: string, accountId: string | undefined): Promise<void> {
    const message = await getAuthentication(accountId)

    if (!message) {
        console.error(`No API key found for plugin ${pluginId}. Please register the plugin first.`);
        return;
    }

    const response = await fetch(`${BASE_URL}/${pluginId}`, {
        method: 'DELETE',
        headers: { 'bitte-api-key': message },
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