import { BASE_URL } from '../config/constants';
import { authenticateOrCreateKey, getAuthentication } from './signer-service';

export async function registerPlugin(pluginId: string, accountId: string | undefined): Promise<string | null> {
    const message = await authenticateOrCreateKey(accountId)

    if(!message){
        console.error("Failed to register plugin: Authentication failed. Try again.")
        return null
    }

    try {
        const response = await fetch(`${BASE_URL}/${pluginId}`, { method: 'POST', headers: { 'bitte-api-key': message }});
        if (response.ok) {
            await response.json();
            console.log(`Plugin registered successfully`);
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
    } else {
        console.error(`Error deleting plugin: ${await response.text()}`);
    }
}