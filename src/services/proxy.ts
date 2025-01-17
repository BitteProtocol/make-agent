import express from 'express';
import { setupCorsMiddleware } from '../middleware/cors';

interface ApiConfig {
  key: string;
  url: string;
  serverPort: number;
}

export async function startApiServer(config: ApiConfig) {
  const app = express();
  app.use(express.json());
  
  // Setup CORS middleware
  setupCorsMiddleware(app);
  
  // Add request logging middleware
  app.use((req, res, next) => {
    console.log(`[Express] Incoming request: ${req.method} ${req.url}`);
    next();
  });

  // Handle chat requests
  app.post('/api/v1/chat', async (req, res) => {
    try {
      console.log('[Server] Forwarding chat request to Bitte API');
      
      const response = await fetch(config.url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.key}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(req.body)
      });

      const data = await response.text();
      console.log('[Server] Response received:', data);

      res.status(response.status);
      response.headers.forEach((value, key) => {
        // Skip content-encoding to avoid compression issues
        if (key.toLowerCase() !== 'content-encoding') {
          res.setHeader(key, value);
        }
      });
      res.send(data);

    } catch (error) {
      console.error('[Server] Error handling chat request:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  return new Promise<ReturnType<typeof app.listen>>((resolve, reject) => {
    try {
      const server = app.listen(config.serverPort, () => {
        console.log(`API server running on port ${config.serverPort}`);
        resolve(server);
      });
    } catch (error) {
      console.error('Failed to start API server:', error);
      reject(error);
    }
  });
}
