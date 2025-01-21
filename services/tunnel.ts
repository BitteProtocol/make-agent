import { spawn, type ChildProcess } from "child_process";
import { promises as fs } from "fs";
import { watch } from "fs/promises";
import localtunnel from "localtunnel";
import open from "open";
import { homedir } from "os";
import { relative, join } from "path";

import { PluginService } from "./plugin";
import { BITTE_CONFIG_ENV_KEY } from "../config/constants";
import { appendToEnv, removeFromEnv } from "../utils/file-utils";
import { validateAndParseOpenApiSpec } from "../utils/openapi";
import { getSpecUrl } from "../utils/url-utils";

interface BitteConfig {
  url?: string;
  pluginId?: string;
  receivedId?: string;
}

interface TunnelConfig {
  port: number;
  useServeo: boolean;
  useTestnet: boolean;
}

export class TunnelService {
  private readonly config: TunnelConfig;
  private readonly playgroundUrl: string;
  private readonly pluginService: PluginService;
  private tunnelUrl?: string;
  private pluginId?: string;
  private cleanup?: () => Promise<void>;
  private isCleaningUp = false;

  constructor(config: TunnelConfig) {
    this.config = config;
    this.pluginService = new PluginService(config.useTestnet);
    this.playgroundUrl = this.pluginService.bitteUrls.PLAYGROUND_URL;
  }

  async start(): Promise<void> {
    console.log(
      `Setting up ${
        this.config.useServeo ? "Serveo" : "Localtunnel"
      } tunnel on port ${this.config.port}...`,
    );

    const tunnel = this.config.useServeo
      ? await this.setupServeo()
      : await this.setupLocaltunnel();

    this.tunnelUrl = tunnel.tunnelUrl;
    this.cleanup = tunnel.cleanup;
    this.pluginId = new URL(this.tunnelUrl).hostname;

    await this.setupAndValidate();
    this.registerCleanupHandlers();

    console.log(
      "Tunnel is running. Watching for changes. Press Ctrl+C to stop.",
    );
    await this.watchForChanges();
  }

  private async setupLocaltunnel(): Promise<{
    tunnelUrl: string;
    cleanup: () => Promise<void>;
  }> {
    try {
      const tunnel = await localtunnel({ port: this.config.port });
      console.log(`Localtunnel URL: ${tunnel.url}`);
      return {
        tunnelUrl: tunnel.url,
        cleanup: async () => tunnel.close(),
      };
    } catch (error) {
      throw new Error("Failed to set up localtunnel.");
    }
  }

  private async setupServeo(): Promise<{
    tunnelUrl: string;
    cleanup: () => Promise<void>;
  }> {
    const sshKeyPath = join(homedir(), ".ssh", "serveo_key");
    await this.ensureSSHKey(sshKeyPath);

    return new Promise((resolve, reject) => {
      const tunnel = spawn("ssh", [
        "-R",
        `80:localhost:${this.config.port}`,
        "serveo.net",
        "-i",
        sshKeyPath,
      ]);

      this.handleServeoTunnel(tunnel, resolve, reject);
    });
  }

  private async ensureSSHKey(sshKeyPath: string): Promise<void> {
    try {
      await fs.access(sshKeyPath);
    } catch {
      console.log("Generating SSH key for Serveo...");
      await new Promise<void>((resolve, reject) => {
        const sshKeygen = spawn("ssh-keygen", [
          "-t",
          "rsa",
          "-b",
          "4096",
          "-f",
          sshKeyPath,
          "-N",
          "",
        ]);
        sshKeygen.on("close", (code) => {
          code === 0
            ? resolve()
            : reject(new Error(`ssh-keygen exited with code ${code}`));
        });
      });
      console.log("SSH key generated successfully.");
    }
  }

  private handleServeoTunnel(
    tunnel: ChildProcess,
    resolve: (value: {
      tunnelUrl: string;
      cleanup: () => Promise<void>;
    }) => void,
    reject: (reason: Error) => void,
  ): void {
    let tunnelUrl = "";

    tunnel.stdout?.on("data", (data) => {
      const output = data.toString();
      console.log(output);
      if (output.includes("Forwarding HTTP traffic from")) {
        tunnelUrl = output.match(/https?:\/\/[^\s]+/)?.[0] ?? "";
        resolve({
          tunnelUrl,
          cleanup: async () => {
            tunnel.kill();
          },
        });
      }
    });

    tunnel.stderr?.on("data", (data) => {
      console.error(`Tunnel error: ${data}`);
    });

    tunnel.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Tunnel process exited with code ${code}`));
      }
    });
  }

  private async setupAndValidate(): Promise<void> {
    if (!this.tunnelUrl || !this.pluginId)
      throw new Error("Tunnel not initialized");

    await this.updateBitteConfig({ url: this.tunnelUrl });
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const signedMessage =
      await this.pluginService.auth.authenticateOrCreateKey();
    if (!signedMessage) {
      throw new Error("Failed to authenticate or create a key.");
    }

    const specUrl = getSpecUrl(this.tunnelUrl);
    const { isValid, accountId } = await validateAndParseOpenApiSpec(specUrl);

    if (!isValid || !accountId) {
      throw new Error(
        "OpenAPI specification validation failed or missing account ID.",
      );
    }

    const result = await this.pluginService.register({
      pluginId: this.pluginId,
      accountId,
    });

    if (!result) {
      console.log(
        "Initial registration failed. Waiting for file changes to retry...",
      );
      return;
    }

    const receivedId = await this.openPlayground(result);
    await this.updateBitteConfig({
      pluginId: this.pluginId,
      receivedId,
    });
  }

  private async watchForChanges(): Promise<void> {
    if (!this.tunnelUrl || !this.pluginId)
      throw new Error("Tunnel not initialized");

    const projectDir = process.cwd();
    console.log(`Watching for changes in ${projectDir}`);

    const watcher = watch(projectDir, { recursive: true });

    for await (const event of watcher) {
      await this.handleFileChange(event, projectDir);
    }
  }

  private async handleFileChange(
    event: { filename: string | null },
    projectDir: string,
  ): Promise<void> {
    if (!this.tunnelUrl || !this.pluginId) return;

    const relativePath = relative(projectDir, event.filename ?? "");
    if (this.shouldIgnorePath(relativePath)) return;

    console.log(
      `Change detected in ${relativePath}. Attempting to update or register the plugin...`,
    );

    const { accountId } = await validateAndParseOpenApiSpec(
      getSpecUrl(this.tunnelUrl),
    );
    const authentication =
      await this.pluginService.auth.getAuthentication(accountId);

    const result = authentication
      ? await this.pluginService.update(this.pluginId, accountId)
      : await this.pluginService.register({
          pluginId: this.pluginId,
          accountId,
        });

    if (result && !authentication) {
      await this.openPlayground(result);
    }
  }

  private shouldIgnorePath(path: string): boolean {
    return (
      path.startsWith(".") ||
      path.includes("node_modules") ||
      path.includes("bitte.dev.json")
    );
  }

  private async openPlayground(agentId: string): Promise<string> {
    const url = `${this.playgroundUrl}${agentId}`;
    console.log(`Opening playground: ${url}`);
    await open(url);
    console.log("Waiting for the ID from the playground...");
    return "";
  }

  private async updateBitteConfig(data: BitteConfig): Promise<void> {
    let existingConfig = {};
    try {
      const existingData = process?.env?.BITTE_CONFIG;
      if (existingData) {
        existingConfig = JSON.parse(existingData);
        await removeFromEnv(BITTE_CONFIG_ENV_KEY);
      }
    } catch (error) {
      // Env var doesn't exist or couldn't be read, we'll create a new one
    }

    const updatedConfig = { ...existingConfig, ...data };
    await appendToEnv(
      BITTE_CONFIG_ENV_KEY,
      JSON.stringify(updatedConfig, null, 2),
    );
    console.log("BITTE_CONFIG updated successfully.");
  }

  private registerCleanupHandlers(): void {
    const cleanup = async (): Promise<void> => {
      if (this.isCleaningUp) return;
      this.isCleaningUp = true;

      console.log("Terminating. Cleaning up...");
      await removeFromEnv(BITTE_CONFIG_ENV_KEY).catch(() => {});

      if (this.pluginId) {
        try {
          await this.pluginService.delete(this.pluginId);
        } catch (error) {
          console.error("Error deleting plugin:", error);
        }
      }

      if (this.cleanup) {
        await this.cleanup();
      }

      console.log("Cleanup completed. Exiting...");
      process.exit(0);
    };

    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);
    process.on("unhandledRejection", (reason, promise) => {
      console.error("Unhandled Rejection at:", promise, "reason:", reason);
      process.exit(1);
    });
  }
}
