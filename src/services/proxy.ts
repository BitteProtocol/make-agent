import express from "express";
import { promises as fs } from "fs";
import path from "path";

interface ApiConfig {
  key: string;
  url: string;
  serverPort: number;
}

export async function startApiServer(apiConfig: ApiConfig) {
  const app = express();

  // Serve static files from playground/dist
  const staticPath = path.resolve(process.cwd(), "dist", "playground");
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
      apiUrl: "https://wallet.bitte.ai/api/v1/chat",
      bitteApiKey: apiConfig.key,
      bitteApiUrl: apiConfig.url,
    };
    res.json(serverConfig);
  });

  // Serve index.html for all routes
  app.get("/", async (req, res) => {
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

  // Handle chat requests
  app.post("/api/v1/chat", async (req, res) => {
    try {
      const response = await fetch(apiConfig.url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiConfig.key}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(req.body),
      });

      const data = await response.text();

      res.status(response.status);
      response.headers.forEach((value, key) => {
        // Skip content-encoding to avoid compression issues
        if (key.toLowerCase() !== "content-encoding") {
          res.setHeader(key, value);
        }
      });
      res.send(data);
    } catch (error) {
      res.status(500).json({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
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
