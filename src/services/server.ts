import express from "express";
import { promises as fs } from "fs";
import path from "path";

interface ApiConfig {
  key: string;
  url: string;
  serverPort: number;
}

export async function startUIServer(
  apiConfig: ApiConfig,
): Promise<ReturnType<typeof express.application.listen>> {
  const app = express();

  // Try multiple possible paths for the static files
  const possiblePaths = [
    // When running in development mode
    path.resolve(process.cwd(), "dist", "playground"),
    // When installed as a node module
    path.resolve(process.cwd(), "node_modules", "make-agent", "dist", "playground"),
    // When running from the node_modules/.bin directory
    path.resolve(process.cwd(), "..", "make-agent", "dist", "playground")
  ];

  let staticPath: string | undefined;
  
  // Try each path until we find one that exists
  for (const testPath of possiblePaths) {
    try {
      await fs.access(testPath);
      const indexExists = await fs.access(path.join(testPath, "index.html"))
        .then(() => true)
        .catch(() => false);
      
      if (indexExists) {
        staticPath = testPath;
        break;
      }
    } catch {
      continue;
    }
  }

  if (!staticPath) {
    throw new Error("Could not find static files directory with index.html");
  }

  console.log("[Server] Serving static files from:", staticPath);
  console.log("[Server] Current directory:", __dirname);
  console.log("[Server] Process working directory:", process.cwd());

  // Serve static files with correct MIME types
  app.use(
    express.static(staticPath, {
      setHeaders: (res, path) => {
        if (path.endsWith(".css")) {
          res.setHeader("Content-Type", "text/css");
        }
      },
    }),
  );

  // Serve config endpoint
  app.get("/api/config", (req, res) => {
    const serverConfig = {
      serverStartTime: new Date().toISOString(),
      environment: "make-agent",
      localAgent: {
        pluginId: req.hostname,
        accountId: "anon",
        spec: {},
      },
      apiUrl:
        "https://mintbase-wallet-git-local-agent-bitteprotocol.vercel.app/api/v1/chat", // TODO: change to "https://wallet.bitte.ai/api/v1/chat",
      bitteApiKey: apiConfig.key,
      bitteApiUrl: apiConfig.url,
    };
    res.json(serverConfig);
  });

  // Serve index.html for all routes
  app.get("*", async (req, res) => {
    console.log("[Server] Received route request:", req.path);
    const indexPath = path.join(staticPath, "index.html");

    try {
      const html = await fs.readFile(indexPath, "utf8");
      res.setHeader("Content-Type", "text/html");
      res.send(html);
      console.log("[Server] Successfully served index.html");
    } catch (err) {
      console.error("[Server] Error reading index.html:", err);
      res.status(404).send("Not found");
    }
  });

  return new Promise<ReturnType<typeof app.listen>>((resolve, reject) => {
    try {
      const server = app.listen(apiConfig.serverPort, () => {
        console.log(
          `[Server] UI server listening http://localhost:${apiConfig.serverPort}`,
        );
        console.log("[Server] Ready to handle requests");
        resolve(server);
      });
    } catch (error) {
      reject(error);
    }
  });
}
