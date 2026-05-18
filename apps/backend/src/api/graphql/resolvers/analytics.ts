import { GraphQLContext, requireAuth } from '../context';
import { prisma } from '../../../config/database';
import { CacheService, CACHE_TTL } from '../../../config/redis';
import { AnalyticsService } from '../../../services/analytics';

export const analyticsResolvers = {
  Query: {
    wardrobeReport: async (_: unknown, { period = 'monthly' }: any, ctx: GraphQLContext) => {
      requireAuth(ctx);
      const cacheKey = `user:${ctx.user.id}:report:${period}`;
      const cached = await CacheService.get(cacheKey);
      if (cached) return cached;

      const report = await AnalyticsService.generateWardrobeReport(ctx.user.id, period);
      await CacheService.set(cacheKey, report, CACHE_TTL.LONG);
      return report;
    },

    confidenceScore: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      requireAuth(ctx);
      return AnalyticsService.computeConfidenceScore(ctx.user.id);
    },
  },
};
