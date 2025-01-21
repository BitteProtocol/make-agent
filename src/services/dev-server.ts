import express from "express";
import { Server } from "http";
import { createProxyMiddleware } from "http-proxy-middleware";
import path from "path";
import { createServer } from "vite";

interface DevServerConfig {
  port: number;
  apiPort: number;
  define: Record<string, unknown>;
}

export async function startDevServer(config: DevServerConfig): Promise<Server> {
  const app = express();

  // API proxy setup
  app.use("/api", createProxyMiddleware({
    target: `http://localhost:${config.apiPort}`,
    changeOrigin: true,
    pathRewrite: {
      "^/api": ""
    }
  }));

  // Create Vite server
  const vite = await createServer({
    root: path.resolve(process.cwd(), "playground"),
    server: {
      middlewareMode: true,
      hmr: {
        port: config.port + 1
      }
    },
    define: config.define
  });

  // Use Vite's middleware
  app.use(vite.middlewares);

  return new Promise((resolve) => {
    const server = app.listen(config.port, () => {
      console.log(`Development server running at http://localhost:${config.port}`);
      resolve(server);
    });
  });
}