import { Command } from "commander";
import dotenv from 'dotenv';
import path from "path";
import { startApiServer } from "../services/proxy";
import { createViteServer } from "../services/vite";
import { deployedUrl } from "../utils/deployed-url";
import { validateEnv } from "../utils/env";
import { validateAndParseOpenApiSpec } from "../utils/openapi";
import { getHostname, getSpecUrl } from "../utils/url-utils";

// Environment setup
dotenv.config();
validateEnv();

const API_CONFIG = {
  key: process.env.BITTE_API_KEY!,
  url: process.env.BITTE_API_URL!,
  serverPort: 3010
};

console.log('API Configuration:', {
  url: API_CONFIG.url,
  serverPort: API_CONFIG.serverPort
});

async function fetchAndValidateSpec(url: string) {
  const pluginId = getHostname(url);
  const specUrl = getSpecUrl(url);
  
  const { isValid, accountId } = await validateAndParseOpenApiSpec(specUrl);
  
  if (!isValid || !accountId) {
    throw new Error("Invalid OpenAPI specification or missing account ID");
  }
  
  const specContent = await fetch(specUrl).then(res => res.text());
  
  return {
    pluginId,
    accountId,
    spec: JSON.parse(specContent)
  };
}

export const playgroundCommand = new Command()
  .name("playground")
  .description("Start a local playground for your AI agent")
  .option("-p, --port <port>", "Port to run playground on", "3000")
  .action(async (options) => {
    try {
      console.log('Starting playground with configuration:');
      console.log('API_CONFIG:', {
        url: API_CONFIG.url,
        serverPort: API_CONFIG.serverPort,
        // Omit key for security
      });
      
      // Start API server
      const server = await startApiServer(API_CONFIG);
      console.log('API server started successfully');

      // Validate deployed URL
      if (!deployedUrl) {
        throw new Error("Deployed URL could not be determined.");
      }

      // Fetch and validate OpenAPI spec
      const localAgent = await fetchAndValidateSpec(deployedUrl);

      // Configure and start Vite server
      const viteConfig = {
        root: path.resolve(__dirname, "../playground"),
        port: 10000,
        configFile: path.resolve(__dirname, "../playground/vite.config.ts"),
        define: {
          __APP_DATA__: JSON.stringify({
            serverStartTime: new Date().toISOString(),
            environment: "make-agent",
            localAgent,
            apiUrl: `http://localhost:${API_CONFIG.serverPort}/api/v1/chat`,
            bitteApiKey: API_CONFIG.key,
            bitteApiUrl: `http://localhost:${API_CONFIG.serverPort}/api/v1/chat`
          })
        }
      };

      const viteServer = createViteServer(viteConfig);
      await viteServer.start();

      // Handle graceful shutdown
      process.on("SIGINT", async () => {
        await viteServer.close();
        server.close();
        process.exit();
      });

    } catch (error) {
      console.error("Failed to start playground:", error);
      process.exit(1);
    }
  });
