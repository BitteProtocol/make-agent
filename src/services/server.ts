import express from "express";
import { promises as fs } from "fs";
import path from "path";

import { type ApiConfig } from "../commands/dev";

export async function startUIServer(
  apiConfig: ApiConfig,
  agentSpec: unknown,
): Promise<ReturnType<typeof express.application.listen>> {
  const app = express();

  app.use(
    express.json({
      limit: "2mb",
    }),
  );

  // Try multiple possible paths for the static files
  const possiblePaths = [
    // When running in development mode
    path.resolve(process.cwd(), "dist", "playground"),
    // When installed as a node module
    path.resolve(
      process.cwd(),
      "node_modules",
      "make-agent",
      "dist",
      "playground",
    ),
    // When running from the node_modules/.bin directory
    path.resolve(process.cwd(), "..", "make-agent", "dist", "playground"),
  ];

  let staticPath: string | undefined;

  // Try each path until we find one that exists
  for (const testPath of possiblePaths) {
    try {
      await fs.access(testPath);
      const indexExists = await fs
        .access(path.join(testPath, "index.html"))
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
  app.get("/api/config", async (req, res) => {
    try {
      const serverConfig = {
        serverStartTime: new Date().toISOString(),
        environment: "make-agent",
        localAgent: {
          pluginId: req.hostname,
          accountId: "anon",
          spec: agentSpec,
        },
        bitteApiKey: apiConfig.key,
        bitteApiUrl: apiConfig.url,
      };
      res.json(serverConfig);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch AI plugin spec" });
    }
  });

  // Serve index.html for all routes
  app.get("*", async (req, res) => {
    console.log(req.path);
    const indexPath = path.join(staticPath, "index.html");

    try {
      const html = await fs.readFile(indexPath, "utf8");
      res.setHeader("Content-Type", "text/html");
      res.send(html);
    } catch (err) {
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
