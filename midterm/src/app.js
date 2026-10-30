import express from 'express';
import { isDbAlive } from './db/pool.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import { officesRouter } from './routes/offices.js';
import { departmentsRouter } from './routes/departments.js';
import { employeesRouter } from './routes/employees.js';
import { leaveRequestsRouter } from './routes/leaveRequests.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json({ limit: '100kb' }));

  app.get('/health', async (req, res) => {
    if (await isDbAlive()) {
      return res.json({ status: 'ok', db: 'up' });
    }
    res.status(503).json({
      status: 'error',
      db: 'down',
      error: { code: 'DB_UNAVAILABLE', message: 'База данных недоступна' },
    });
  });

  app.use('/api/offices', officesRouter);
  app.use('/api/departments', departmentsRouter);
  app.use('/api/employees', employeesRouter);
  app.use('/api/leave-requests', leaveRequestsRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
