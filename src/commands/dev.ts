import { validateBittePluginSpec, type BitteOpenAPISpec } from "bitte-ai-spec";
import { Command } from "commander";
import dotenv from "dotenv";
import isPortReachable from "is-port-reachable";
import open from "open";

import { DEFAULT_PORT } from "../config/constants";
import { startUIServer } from "../services/server";
import { getDeployedUrl } from "../utils/deployed-url";
import { validateEnv } from "../utils/env";
import { detectPort } from "../utils/port-detector";
import { getHostname, getSpecUrl } from "../utils/url";

dotenv.config();
validateEnv();

export interface ApiConfig {
  key: string;
  url: string;
  localAgentUrl?: string;
  serverPort: number;
}

interface ValidationResult {
  spec?: BitteOpenAPISpec;
  errorMessage?: string;
}

// Muted error that only prints necessary text when thrown
class DevCommandError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DevCommandError";
  }
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
  url: process.env.BITTE_API_URL || "https://wallet.bitte.ai/api/v1",
  serverPort: DEFAULT_PORT,
};

async function fetchAndValidateSpec(url: string): Promise<ValidationResult> {
  const pluginId = getHostname(url);
  const specUrl = getSpecUrl(url);
  console.log(`[Dev] Plugin ID: ${pluginId}`);
  console.log(`[Dev] Spec URL: ${specUrl}`);

  console.log(`[Dev] Validating OpenAPI spec at ${specUrl}`);
  const { valid, schema, errorMessage, errors } =
    await validateBittePluginSpec(specUrl);
  if (!valid || !schema) {
    return {
      errorMessage:
        errorMessage || errors?.join("\n") || "Unknown error validating spec",
    };
  }
  const devAccountId = schema["x-mb"]["account-id"] || "anon";

  const devSpec = {
    ...schema,
    servers: [{ url }],
    "x-mb": {
      ...schema["x-mb"],
      "account-id": devAccountId,
    },
  };
  console.log("[Dev] Updated spec servers URL:", devSpec.servers[0]?.url);

  return {
    spec: devSpec,
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
        throw new DevCommandError("Deployed URL could not be determined.");
      }

      console.log(
        "[Dev] Fetching and validating OpenAPI spec from:",
        deployedUrl,
      );
      const { spec: validatedSpec, errorMessage } =
        await fetchAndValidateSpec(deployedUrl);

      if (!validatedSpec || errorMessage) {
        throw new DevCommandError(
          `[Dev] Spec validation failed: ❌ ${errorMessage || "Unknown validation error"}`,
        );
      }

      console.log("[Dev] Bitte OpenAPI spec validation successful ✅");

      const server = await startUIServer(API_CONFIG, validatedSpec);

      await open(`http://localhost:${serverPort}`);

      process.on("SIGINT", async () => {
        server.close();
        process.exit(0);
      });
    } catch (error) {
      if (error instanceof DevCommandError) {
        console.error("\x1b[31m%s\x1b[0m", `Error: ${error.message}`);
      } else {
        console.error("\x1b[31m%s\x1b[0m", `Unexpected error: ${error}`);
      }
      process.exit(1);
    }
  });
