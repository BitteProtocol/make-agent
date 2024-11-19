import { AuthenticationService } from "./authentication";
import type { BitteUrls } from "../config/constants";

export class PluginService {
  private readonly bitteUrls: BitteUrls;
  readonly auth: AuthenticationService;

  constructor(bitteUrls: BitteUrls) {
    this.bitteUrls = bitteUrls;
    this.auth = new AuthenticationService(bitteUrls);
  }

  async register({
    pluginId,
    accountId,
  }: {
    pluginId: string;
    accountId?: string;
  }): Promise<string | null> {
    let message = await this.auth.getAuthentication(accountId);
    if (!message || !accountId) {
      const signedMessage = await this.auth.getSignedMessage();
      message = JSON.stringify(signedMessage);
    }

    try {
      const response = await fetch(`${this.bitteUrls.BASE_URL}/${pluginId}`, {
        method: "POST",
        headers: { "bitte-api-key": message },
      });

      if (response.ok) {
        await response.json();
        console.log("Plugin registered successfully");
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

  async update(pluginId: string, accountId?: string): Promise<void> {
    const message = await this.auth.getAuthentication(accountId);

    if (!message) {
      console.error(
        `No API key found for plugin ${pluginId}. Please register the plugin first.`,
      );
      return;
    }

    const response = await fetch(`${this.bitteUrls.BASE_URL}/${pluginId}`, {
      method: "PUT",
      headers: { "bitte-api-key": message },
    });

    if (response.ok) {
      console.log("Plugin updated successfully.");
    } else {
      console.error(`Error updating plugin: ${await response.text()}`);
    }
  }

  async delete(pluginId: string): Promise<void> {
    const message = await this.auth.getAuthentication();

    if (!message) {
      console.error("No API key found. Unable to delete plugin.");
      return;
    }

    const response = await fetch(`${this.bitteUrls.BASE_URL}/${pluginId}`, {
      method: "DELETE",
      headers: { "bitte-api-key": message },
    });

    if (response.ok) {
      console.log("Plugin deleted successfully");
    } else {
      console.error(`Error deleting plugin: ${await response.text()}`);
    }
  }
}
