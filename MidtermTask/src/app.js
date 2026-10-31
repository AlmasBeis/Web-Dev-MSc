import express from 'express';
import { isDbAlive } from './db/pool.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import { criminalsRouter } from './routes/criminals.js';
import { huntsRouter } from './routes/hunts.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json({ limit: '100kb' }));

  app.get('/health', async (req, res) => {
    if (await isDbAlive()) return res.json({ status: 'ok', db: 'up' });
    res.status(503).json({ status: 'error', db: 'down' });
  });

  app.use('/api/criminals', criminalsRouter);
  app.use('/api/hunts', huntsRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
