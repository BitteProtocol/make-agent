import { Command } from "commander";
import dotenv from 'dotenv';
import isPortReachable from 'is-port-reachable';
import path from "path";
import { startApiServer } from "../services/proxy";
import { createViteServer } from "../services/vite";
import { getDeployedUrl } from "../utils/deployed-url";
import { validateEnv } from "../utils/env";
import { validateAndParseOpenApiSpec } from "../utils/openapi";
import { detectPort } from "../utils/port-detector";
import { getHostname, getSpecUrl } from "../utils/url-utils";

dotenv.config();
validateEnv();

interface ApiConfig {
  key: string;
  url: string; 
  serverPort: number;
}

interface ValidationResult {
  pluginId: string;
  accountId: string;
  spec: any;
}

const DEFAULT_PORTS = {
  SERVER: 3010,
  UI: 5000
} as const;

async function findAvailablePort(startPort: number): Promise<number> {
  let port = startPort;
  while (await isPortReachable(port, {host: 'localhost'})) {
    port++;
  }
  return port;
}

const API_CONFIG: ApiConfig = {
  key: process.env.BITTE_API_KEY!,
  url: process.env.BITTE_API_URL!,
  serverPort: DEFAULT_PORTS.SERVER
};

async function fetchAndValidateSpec(url: string): Promise<ValidationResult> {
  const pluginId = getHostname(url);
  const specUrl = getSpecUrl(url);
  
  const validation = await validateAndParseOpenApiSpec(specUrl);
  const { isValid, accountId } = validation;
  
  const specContent = await fetch(specUrl).then(res => res.text());
  let spec = JSON.parse(specContent);

  if (!isValid) {
    spec = {
      ...spec,
      servers: [{ url }],
      "x-mb": {
        ...spec["x-mb"],
        "account-id": accountId || "anon",
      }
    };
  }

  return {
    pluginId,
    accountId: accountId || "anon",
    spec
  };
}

async function setupPorts(options: { port?: string }) {
  let port = parseInt(options.port || '') || 0;

  if (port === 0) {
    const detectedPort = await detectPort();
    if (detectedPort) {
      port = detectedPort;
    } else {
      port = await findAvailablePort(3000);
    }
  }

  const uiPort = await findAvailablePort(DEFAULT_PORTS.UI);
  const serverPort = await findAvailablePort(DEFAULT_PORTS.SERVER);

  return { port, uiPort, serverPort };
}

async function createViteConfiguration(uiPort: number, serverPort: number, localAgent: ValidationResult) {
  return {
    root: path.resolve(__dirname, "../playground"),
    port: uiPort,
    configFile: path.resolve(__dirname, "../playground/vite.config.ts"),
    define: {
      __APP_DATA__: JSON.stringify({
        serverStartTime: new Date().toISOString(),
        environment: "make-agent",
        localAgent,
        apiUrl: `http://localhost:${serverPort}/api/v1/chat`,
        bitteApiKey: API_CONFIG.key,
        bitteApiUrl: `http://localhost:${serverPort}/api/v1/chat`
      })
    }
  };
}

export const devCommand = new Command()
  .name("dev")
  .description("Start a local playground for your AI agent")
  .option("-p, --port <port>", "Port to run playground on", "3000")
  .option("-t, --testnet", "Use Testnet instead of Mainnet", false)
  .action(async (options) => {
    try {
      const { port, uiPort, serverPort } = await setupPorts(options);
      
      API_CONFIG.serverPort = serverPort;
      const server = await startApiServer(API_CONFIG);

      const deployedUrl = getDeployedUrl(port);
      if (!deployedUrl) {
        throw new Error("Deployed URL could not be determined.");
      }

      const localAgent = await fetchAndValidateSpec(deployedUrl);
      const viteConfig = await createViteConfiguration(uiPort, serverPort, localAgent);
      const viteServer = createViteServer(viteConfig);
      await viteServer.start();

      process.on("SIGINT", async () => {
        await viteServer.close();
        server.close();
        process.exit(0);
      });

    } catch (error) {
      process.exit(1);
    }
  });
