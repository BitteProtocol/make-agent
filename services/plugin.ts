import { AuthenticationService } from "./authentication";
import { getBitteUrls, type BitteUrls } from "../config/constants";

export class PluginService {
  readonly bitteUrls: BitteUrls;
  readonly auth: AuthenticationService;

  constructor(testnet: boolean = false) {
    this.bitteUrls = getBitteUrls(testnet);
    this.auth = new AuthenticationService(this.bitteUrls);
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
        const errorMessage = `Failed to register plugin (ID: ${pluginId}). HTTP Status: ${response.status} - ${response.statusText}.`;
        console.error(errorMessage);
        console.error(`Server response: ${JSON.stringify(errorData)}`);
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

  async verify({
    pluginId,
    email,
    repo,
    version,
    accountId,
  }: {
    pluginId: string;
    email: string;
    repo: string;
    version?: string;
    accountId?: string;
  }): Promise<void> {
    const message = await this.auth.getAuthentication(accountId);
    if (!message) {
      console.error("No API key found. Unable to request plugin verification.");
      return;
    }

    try {
      //const res = await fetch(`${this.bitteUrls.BASE_URL}/verify/${pluginId}`, {
      const res = await fetch(
        `http://localhost:3001/api/ai-plugins/verify/${pluginId}`,
        {
          method: "POST",
          headers: { "bitte-api-key": message },
          body: JSON.stringify({
            repo: repo,
            email: email,
            version: version,
          }),
        },
      );

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
