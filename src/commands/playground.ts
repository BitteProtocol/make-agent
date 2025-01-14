import { Command } from "commander";
import path from "path";
import { createServer } from 'vite';

export const playgroundCommand = new Command()
  .name("playground")
  .description("Start a local playground for your AI agent")
  .option("-p, --port <port>", "Port to run playground on", "3000")
  .action(async (options) => {
    const port = parseInt(options.port);
    const dir = path.resolve(__dirname, "../playground");

    try {
      const server = await createServer({
        root: dir,
        server: {
          port: port
        },
        configFile: path.resolve(dir, 'vite.config.ts'),
      });

      await server.listen();

      server.printUrls();

      // Handle process termination
      process.on('SIGINT', async () => {
        await server.close();
        process.exit();
      });

    } catch (error) {
      console.error("Failed to start playground:", error);
      process.exit(1);
    }
  });
