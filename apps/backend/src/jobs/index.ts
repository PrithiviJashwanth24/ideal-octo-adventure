import Bull from 'bull';
import cron from 'node-cron';
import { redis } from '../config/redis';
import { prisma } from '../config/database';
import { StyleAIService } from '../services/ai/styleAI';
import { AnalyticsService } from '../services/analytics';
import { logger } from '../utils/logger';

// Queues
export const wardrobeEnrichmentQueue = new Bull('wardrobe-enrichment', {
  redis: { host: process.env.REDIS_HOST || 'localhost', port: 6379 },
  defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 2000 } },
});

export const notificationQueue = new Bull('notifications', {
  redis: { host: process.env.REDIS_HOST || 'localhost', port: 6379 },
  defaultJobOptions: { attempts: 2 },
});

export const analyticsQueue = new Bull('analytics', {
  redis: { host: process.env.REDIS_HOST || 'localhost', port: 6379 },
});

wardrobeEnrichmentQueue.process(async (job) => {
  const { itemId, imageUrl } = job.data;
  const { WardrobeAIService } = await import('../services/ai/wardrobeAI');
  await WardrobeAIService.enrichItem(itemId, imageUrl);
});

analyticsQueue.process(async (job) => {
  const { userId } = job.data;
  await StyleAIService.analyzeStyleDNA(userId);
});

export function initializeJobs(): void {
  // Daily outfit suggestions at 7am
  cron.schedule('0 7 * * *', async () => {
    logger.info('Running daily outfit suggestion job');
    const users = await prisma.user.findMany({
      where: { isOnboarded: true, deletedAt: null },
      select: { id: true },
      take: 10000,
    });
    for (const user of users) {
      notificationQueue.add({ userId: user.id, type: 'OUTFIT_SUGGESTION' });
    }
  });

  // Weekly style report (Sundays at 9am)
  cron.schedule('0 9 * * 0', async () => {
    logger.info('Running weekly style report job');
    const premiumUsers = await prisma.user.findMany({
      where: { isPremium: true, isOnboarded: true, deletedAt: null },
      select: { id: true },
    });
    for (const user of premiumUsers) {
      analyticsQueue.add({ userId: user.id, type: 'WEEKLY_REPORT' });
    }
  });

  // Laundry reminders
  cron.schedule('0 20 * * *', async () => {
    const itemsNeedingWash = await prisma.wardrobeItem.findMany({
      where: { laundryStatus: 'DIRTY', deletedAt: null },
      select: { userId: true },
      distinct: ['userId'],
    });
    for (const { userId } of itemsNeedingWash) {
      notificationQueue.add({ userId, type: 'LAUNDRY_REMINDER' });
    }
  });

  logger.info('Background jobs initialized');
}
