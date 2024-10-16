import { BASE_URL } from '../config/constants';
import type { KeySignMessageParams } from '../utils/verify-msg-utils';
import { getAuthentication, getSignedMessage } from './signer-service';

export async function registerPlugin(pluginId: string, bitteKey?: string): Promise<string | null> {

    if (!bitteKey) {
        const signedMessage = await getSignedMessage();
        bitteKey = JSON.stringify(signedMessage);
    }

    try {
        const response = await fetch(`${BASE_URL}/${pluginId}`, { method: 'POST', headers: { 'bitte-api-key': bitteKey } });
        if (response.ok) {
            await response.json();
            console.log(`Plugin registered successfully`);
            return pluginId;
        } else {
            const errorData = await response.json();
            console.error(`Error registering plugin: ${JSON.stringify(errorData)}`);
            if (errorData.debugUrl) {
                console.log(`Debug URL: ${errorData.debugUrl}`);
            }
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

export async function deletePlugin(pluginId: string): Promise<void> {
    const bitteKeyString = process.env.BITTE_KEY;

    if (!bitteKeyString) {
        console.error("No API key found. Unable to delete plugin.");
        return;
    }

    const response = await fetch(`${BASE_URL}/${pluginId}`, {
        method: 'DELETE',
        headers: { 'bitte-api-key': bitteKeyString },
    });
    
    if (response.ok) {
        console.log("Plugin deleted successfully")
    } else {
        console.error(`Error deleting plugin: ${await response.text()}`);
    }
}