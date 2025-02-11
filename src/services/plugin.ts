import { AuthenticationService } from "./authentication";
import { getBitteUrls, type BitteUrls } from "../config/constants";

export class PluginService {
  readonly bitteUrls: BitteUrls;
  readonly auth: AuthenticationService;

  constructor(testnet: boolean = false) {
    this.bitteUrls = getBitteUrls(testnet);
    this.auth = new AuthenticationService(this.bitteUrls);
  }

  async register({ pluginId }: { pluginId: string }): Promise<string | null> {
    let apiKey = await this.auth.getAuthentication();
    try {
      const response = await fetch(`${this.bitteUrls.BASE_URL}/${pluginId}`, {
        method: "POST",
        headers: { authorization: apiKey },
      });

      if (response.ok) {
        await response.json();
        console.log("Plugin registered successfully");
        return pluginId;
      } else {
        const errorMessage = `Failed to register plugin (ID: ${pluginId}). HTTP Status: ${response.status} - ${response.statusText}.`;
        console.error(errorMessage);
        const errorData = await response.text();
        console.error(`Server response: ${errorData}`);
        return null;
      }
    } catch (error) {
      console.error(`Network error during plugin registration: ${error}`);
      return null;
    }
  }

  async update(pluginId: string): Promise<string | null> {
    const apiKey = await this.auth.getAuthentication();

    if (!apiKey) {
      console.warn(`No API key found for plugin ${pluginId}.`);
      return null;
    }

    const response = await fetch(`${this.bitteUrls.BASE_URL}/${pluginId}`, {
      method: "PUT",
      headers: { authorization: apiKey },
    });

    if (!response.ok) {
      const responseText = await response.text();
      if (responseText.includes("Plugin not found")) {
        console.warn(`Plugin with ID ${pluginId} not found/registered.`);
      } else {
        console.error("Failed to update plugin", responseText);
      }
      return null;
    }

    console.log("Plugin updated successfully.");
    return pluginId;
  }

  async delete(pluginId: string): Promise<void> {
    const apiKey = await this.auth.getAuthentication();

    if (!apiKey) {
      console.error("No API key found. Unable to delete plugin.");
      return;
    }

    const response = await fetch(`${this.bitteUrls.BASE_URL}/${pluginId}`, {
      method: "DELETE",
      headers: { authorization: apiKey },
    });

    if (response.ok) {
      console.log("Plugin deleted successfully");
    } else {
      console.error(`Error deleting plugin: ${await response.text()}`);
    }
  }

  async verify({
    pluginId,
    email,
    repo,
    version,
    categories,
    chains,
  }: {
    pluginId: string;
    email: string;
    repo: string;
    version?: string;
    categories?: string[];
    chains?: number[];
  }): Promise<void> {
    const apiKey = await this.auth.getAuthentication();
    if (!apiKey) {
      console.error("No API key found. Unable to request plugin verification.");
      return;
    }

    try {
      const res = await fetch(`${this.bitteUrls.BASE_URL}/verify/${pluginId}`, {
        method: "POST",
        headers: { authorization: apiKey },
        body: JSON.stringify({
          repo: repo,
          email: email,
          version: version,
          categories: categories,
          chains: chains,
        }),
      });

      if (res.ok) {
        console.log(
          "Your verification request has been uploaded and will be processed in the following days.",
        );
      } else {
        console.error(
          `Failed to upload verification request: ${JSON.stringify(
            await res.json(),
          )} \nStatus: ${res.status}`,
        );
      }
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : JSON.stringify(error);
      console.error(`Failed to request plugin verification: ${msg}`);
    }
  }
}
