import { Router } from 'express';
import { prisma } from '../../config/database';
import { redis } from '../../config/redis';

export const healthRouter = Router();

healthRouter.get('/', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    await redis.ping();
    res.json({ status: 'healthy', timestamp: new Date().toISOString(), service: 'fitcheck-api' });
  } catch (err) {
    res.status(503).json({ status: 'unhealthy', error: (err as Error).message });
  }
});
