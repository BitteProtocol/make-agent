import { Command } from "commander";
import dotenv from "dotenv";
import isPortReachable from "is-port-reachable";

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

const DEFAULT_PORTS = {
  SERVER: 3010,
} as const;

async function findAvailablePort(startPort: number): Promise<number> {
  let port = startPort;
  while (await isPortReachable(port, { host: "localhost" })) {
    port++;
  }
  return port;
}

const API_CONFIG: ApiConfig = {
  key: process.env.BITTE_API_KEY!,
  url: process.env.BITTE_API_URL!,
  serverPort: DEFAULT_PORTS.SERVER,
};

async function fetchAndValidateSpec(url: string): Promise<ValidationResult> {
  const pluginId = getHostname(url);
  const specUrl = getSpecUrl(url);

  const validation = await validateAndParseOpenApiSpec(specUrl);
  const { isValid, accountId } = validation;

  const specContent = await fetch(specUrl).then((res) => res.text());
  let spec = JSON.parse(specContent);

  if (!isValid) {
    spec = {
      ...spec,
      servers: [{ url }],
      "x-mb": {
        ...spec["x-mb"],
        "account-id": accountId || "anon",
      },
    };
  }

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
      port = await findAvailablePort(3000);
    }
  }

  const serverPort = await findAvailablePort(DEFAULT_PORTS.SERVER);

  return { port, serverPort };
}

export const devCommand = new Command()
  .name("dev")
  .description("Start a local playground for your AI agent")
  .option("-p, --port <port>", "Port to run playground on", "3000")
  .option("-t, --testnet", "Use Testnet instead of Mainnet", false)
  .action(async (options) => {
    try {
      const { port, serverPort } = await setupPorts(options);

      API_CONFIG.serverPort = serverPort;
      API_CONFIG.localAgentUrl = `http://localhost:${port}`;
      const server = await startUIServer(API_CONFIG);

      const deployedUrl = getDeployedUrl(port);
      if (!deployedUrl) {
        throw new Error("Deployed URL could not be determined.");
      }

      try {
        console.log(
          "[Dev] Fetching and validating OpenAPI spec from:",
          deployedUrl,
        );
        await fetchAndValidateSpec(deployedUrl);
        console.log("[Dev] OpenAPI spec validation successful");
      } catch (error) {
        console.error("[Dev] Error validating OpenAPI spec:", error);
        throw error;
      }

      process.on("SIGINT", async () => {
        server.close();
        process.exit(0);
      });
    } catch (error) {
      process.exit(1);
    }
  });
