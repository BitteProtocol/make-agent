import { type Express } from 'express';
import cors from 'cors';

/**
 * Sets up CORS middleware for the Express application
 * Allows requests from localhost development servers
 */
export function setupCorsMiddleware(app: Express) {
  app.use('/api/v1/chat', cors({
    origin: (origin, callback) => {
      if (!origin || /^http:\/\/localhost:\d+$/.test(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }));
}
