import { spawn } from "child_process";
import { promises as fs } from "fs";
import { watch } from "fs/promises";
import localtunnel from "localtunnel";
import open from "open";
import { homedir } from "os";
import { relative } from "path";
import { join } from "path";

import { validateAndParseOpenApiSpec } from "./openapi-service";
import { PluginService } from "./plugin-service";
import { authenticateOrCreateKey, getAuthentication } from "./signer-service";
import {
  BITTE_CONFIG_ENV_KEY,
  getBitteUrls,
  type BitteUrls,
} from "../config/constants";
import { appendToEnv, removeFromEnv } from "../utils/file-utils";
import { getSpecUrl } from "../utils/url-utils";

interface BitteConfig {
  url?: string;
  pluginId?: string;
  receivedId?: string;
}

async function updateBitteConfig(data: BitteConfig): Promise<void> {
  let existingConfig = {};
  try {
    const existingData = process?.env?.BITTE_CONFIG;
    if (existingData) {
      existingConfig = JSON.parse(existingData);
      removeFromEnv(BITTE_CONFIG_ENV_KEY);
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

export async function watchForChanges(
  pluginId: string,
  tunnelUrl: string,
  bitteUrls: BitteUrls,
): Promise<void> {
  const projectDir = process.cwd();
  console.log(`Watching for changes in ${projectDir}`);
  console.log("Any file changes will trigger a plugin update attempt.");
  const pluginService = new PluginService(bitteUrls);

  const watcher = watch(projectDir, { recursive: true });

  for await (const event of watcher) {
    const relativePath = relative(projectDir, event.filename || "");
    // Ignore hidden files and directories
    if (
      !relativePath.startsWith(".") &&
      !relativePath.includes("node_modules") &&
      !relativePath.includes("bitte.dev.json")
    ) {
      console.log(
        `Change detected in ${relativePath}. Attempting to update or register the plugin...`,
      );
      const { accountId } = await validateAndParseOpenApiSpec(
        getSpecUrl(tunnelUrl),
      );
      const authentication = await getAuthentication(accountId);
      const result = authentication
        ? await pluginService.update(pluginId, accountId)
        : await pluginService.register({ pluginId, accountId });

      if (result && !authentication) {
        await openPlayground(result, bitteUrls.PLAYGROUND_URL);
      } else if (!result && !authentication) {
        console.log(
          "Registration failed. Waiting for next file change to retry...",
        );
      }
    }
  }
}

export async function openPlayground(
  agentId: string,
  playgroundUrl: string,
): Promise<string> {
  const url = `${playgroundUrl}${agentId}`;
  console.log(`Opening playground: ${url}`);
  await open(url);

  console.log("Waiting for the ID from the playground...");
  return "";
}

async function setupAndValidate(
  tunnelUrl: string,
  pluginId: string,
  bitteUrls: BitteUrls,
): Promise<void> {
  await updateBitteConfig({ url: tunnelUrl });

  await new Promise((resolve) => setTimeout(resolve, 1000));

  const signedMessage = await authenticateOrCreateKey(bitteUrls);
  if (!signedMessage) {
    console.log("Failed to authenticate or create a key.");
    return;
  }

  const specUrl = getSpecUrl(tunnelUrl);

  console.log("Validating OpenAPI spec...");
  const { isValid, accountId } = await validateAndParseOpenApiSpec(specUrl);

  if (!isValid) {
    console.log("OpenAPI specification validation failed.");
    return;
  }

  if (!accountId) {
    console.log("Failed to parse account ID from OpenAPI specification.");
    return;
  }

  const result = await new PluginService(bitteUrls).register({
    pluginId,
    accountId,
  });

  if (!result) {
    console.log(
      "Initial registration failed. Waiting for file changes to retry...",
    );
    return;
  }

  const receivedId = await openPlayground(result, bitteUrls.PLAYGROUND_URL);
  console.log(`Received ID from playground: ${receivedId}`);

  // Update bitte.dev.json with additional info
  await updateBitteConfig({
    pluginId,
    receivedId,
  });
}

async function setupLocaltunnel(
  port: number,
): Promise<{ tunnelUrl: string; cleanup: () => Promise<void> }> {
  try {
    const tunnel = await localtunnel({ port });
    console.log(`Localtunnel URL: ${tunnel.url}`);
    return {
      tunnelUrl: tunnel.url,
      cleanup: async () => {
        tunnel.close();
      },
    };
  } catch (error) {
    throw new Error("Failed to set up localtunnel.");
  }
}

async function setupServeo(
  port: number,
): Promise<{ tunnelUrl: string; cleanup: () => Promise<void> }> {
  const sshKeyPath = join(homedir(), ".ssh", "serveo_key");

  // Check if SSH key exists, if not, create it
  try {
    await fs.access(sshKeyPath);
  } catch (error) {
    console.log("Generating SSH key for Serveo...");
    await new Promise((resolve, reject) => {
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
        if (code === 0) resolve(null);
        else reject(new Error(`ssh-keygen process exited with code ${code}`));
      });
    });
    console.log("SSH key generated successfully.");
  }

  return new Promise((resolve, reject) => {
    const tunnel = spawn("ssh", [
      "-R",
      `80:localhost:${port}`,
      "serveo.net",
      "-i",
      sshKeyPath,
    ]);

    let tunnelUrl = "";

    tunnel.stdout.on("data", (data) => {
      const output = data.toString();
      console.log(output);
      if (output.includes("Forwarding HTTP traffic from")) {
        tunnelUrl = output.match(/https?:\/\/[^\s]+/)[0];
        resolve({
          tunnelUrl,
          cleanup: async () => {
            tunnel.kill();
          },
        });
      }
    });

    tunnel.stderr.on("data", (data) => {
      console.error(`Tunnel error: ${data}`);
    });

    tunnel.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Tunnel process exited with code ${code}`));
      }
    });
  });
}

export async function startLocalTunnelAndRegister(
  port: number,
  useServeo: boolean = false,
  useTestnet: boolean = false,
): Promise<void> {
  console.log(
    `Setting up ${useServeo ? "Serveo" : "Localtunnel"} tunnel on port ${port}...`,
  );
  const { tunnelUrl, cleanup } = useServeo
    ? await setupServeo(port)
    : await setupLocaltunnel(port);
  const bitteUrls = getBitteUrls(useTestnet);
  const pluginId = new URL(tunnelUrl).hostname;
  await setupAndValidate(tunnelUrl, pluginId, bitteUrls);

  let isCleaningUp = false;

  const fullCleanup = async (): Promise<void> => {
    if (isCleaningUp) return;
    isCleaningUp = true;
    console.log("Terminating. Cleaning up...");
    await removeFromEnv(BITTE_CONFIG_ENV_KEY).catch(() => {});
    console.log("bitte.dev.json file deleted successfully.");

    try {
      await new PluginService(bitteUrls).delete(pluginId);
    } catch (error) {
      console.error("Error deleting plugin:", error);
    }

    await cleanup();
    console.log("Cleanup completed. Exiting...");
    process.exit(0);
  };

  process.on("SIGINT", async () => {
    await fullCleanup();
  });

  process.on("SIGTERM", async () => {
    await fullCleanup();
  });

  process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
    process.exit(1);
  });

  console.log("Tunnel is running. Watching for changes. Press Ctrl+C to stop.");

  // Start watching for changes
  await watchForChanges(pluginId, tunnelUrl, bitteUrls);
}
