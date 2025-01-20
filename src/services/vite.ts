import { createServer, type ViteDevServer, type Logger } from 'vite';

interface ViteConfig {
  root: string;
  port: number;
  configFile: string;
  define: {
    __APP_DATA__: string;
  };
}

export class ViteServer {
  private server: ViteDevServer | null = null;
  private config: ViteConfig;

  constructor(config: ViteConfig) {
    this.config = config;
  }

  async start() {
    try {
      this.server = await createServer({
        root: this.config.root,
        server: {
          port: this.config.port
        },
        configFile: this.config.configFile,
        appType: 'spa',
        define: this.config.define,
        customLogger: {
          info: (msg: string) => console.log(msg),
          warn: (msg: string) => console.warn(msg),
          error: (msg: string) => console.error(msg),
          warnOnce: (msg: string) => console.warn(msg),
          clearScreen: () => {},
          hasErrorLogged: (error: Error) => false,
          hasWarned: false
        } satisfies Logger
      });

      await this.server.listen();
      console.log(`Playground running at http://localhost:${this.config.port}`);

    } catch (error) {
      console.error('Failed to start Vite server:', error);
      throw error;
    }
  }

  async close() {
    if (this.server) {
      await this.server.close();
      this.server = null;
    }
  }
}

export function createViteServer(config: ViteConfig): ViteServer {
  return new ViteServer(config);
}
