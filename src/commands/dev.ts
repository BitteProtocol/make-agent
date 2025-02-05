import { Command } from "commander";
import dotenv from "dotenv";
import isPortReachable from "is-port-reachable";
import open from "open";

import { DEFAULT_PORT } from "../config/constants";
import { startUIServer } from "../services/server";
import { getDeployedUrl } from "../utils/deployed-url";
import { validateEnv } from "../utils/env";
import { validateAndParseOpenApiSpec } from "../utils/openapi";
import { detectPort } from "../utils/port-detector";
import { getHostname, getSpecUrl } from "../utils/url-utils";

dotenv.config();
validateEnv();

export interface ApiConfig {
  key: string;
  url: string;
  localAgentUrl?: string;
  serverPort: number;
}

interface ValidationResult {
  pluginId: string;
  accountId: string;
  spec: unknown;
}

async function findAvailablePort(startPort: number): Promise<number> {
  let port = startPort;
  while (await isPortReachable(port, { host: "localhost" })) {
    port++;
  }
  return port;
}

const API_CONFIG: ApiConfig = {
  key: process.env.BITTE_API_KEY!,
  url: process.env.BITTE_API_URL || "https://wallet.bitte.ai/api/v1/chat",
  serverPort: DEFAULT_PORT,
};

async function fetchAndValidateSpec(url: string): Promise<ValidationResult> {
  console.log("[Dev] Getting plugin ID and spec URL");
  const pluginId = getHostname(url);
  const specUrl = getSpecUrl(url);
  console.log("[Dev] Plugin ID:", pluginId);
  console.log("[Dev] Spec URL:", specUrl);

  let isValid, accountId;
  try {
    console.log("[Dev] Validating OpenAPI spec...");
    const validation = await validateAndParseOpenApiSpec(specUrl);
    ({ isValid, accountId } = validation);
    console.log("[Dev] Validation result:", { isValid, accountId });
  } catch (error) {
    console.error(
      "Failed to validate OpenAPI spec:",
      error instanceof Error ? error.message : "Unknown error",
    );
    isValid = false;
    accountId = undefined;
  }

  console.log("[Dev] Fetching spec content...");
  const specContent = await fetch(specUrl).then((res) => res.text());
  let spec = JSON.parse(specContent);
  console.log("[Dev] Successfully parsed spec content");

  console.log("[Dev] Spec validation status:", isValid);

  console.log("[Dev] Updating spec with server URL and account ID");
  spec = {
    ...spec,
    servers: [{ url }],
    "x-mb": {
      ...spec["x-mb"],
      "account-id": accountId || "anon",
    },
  };
  console.log("[Dev] Updated spec servers URL:", spec.servers[0].url);

  return {
    pluginId,
    accountId: accountId || "anon",
    spec,
  };
}

async function setupPorts(options: {
  port?: string;
}): Promise<{ port: number; serverPort: number }> {
  let port = parseInt(options.port || "") || 0;

  if (port === 0) {
    const detectedPort = await detectPort();
    if (detectedPort) {
      port = detectedPort;
    } else {
      port = await findAvailablePort(DEFAULT_PORT);
    }
  }

  const serverPort = await findAvailablePort(DEFAULT_PORT);

  return { port, serverPort };
}

export const devCommand = new Command()
  .name("dev")
  .description("Start a local playground for your AI agent")
  .option("-p, --port <port>", "Port to run playground on")
  .option("-t, --testnet", "Use Testnet instead of Mainnet", false)
  .action(async (options) => {
    try {
      const { port, serverPort } = await setupPorts(options);

      API_CONFIG.serverPort = serverPort;
      API_CONFIG.localAgentUrl = `http://localhost:${port}`;

      const deployedUrl = getDeployedUrl(port);
      if (!deployedUrl) {
        throw new Error("Deployed URL could not be determined.");
      }

      let agentSpec;
      try {
        console.log(
          "[Dev] Fetching and validating OpenAPI spec from:",
          deployedUrl,
        );
        const { spec } = await fetchAndValidateSpec(deployedUrl);
        console.log("[Dev] OpenAPI spec validation successful");
        agentSpec = spec;
      } catch (error) {
        console.error("[Dev] Error validating OpenAPI spec:", error);
        throw error;
      }

      const server = await startUIServer(API_CONFIG, agentSpec);

      await open(`http://localhost:${port}`);

      process.on("SIGINT", async () => {
        server.close();
        process.exit(0);
      });
    } catch (error) {
      process.exit(1);
    }
  });
