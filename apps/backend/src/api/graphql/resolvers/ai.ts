import { GraphQLContext, requireAuth, requirePremium } from '../context';
import { StyleAIService } from '../../../services/ai/styleAI';
import { PackingAIService } from '../../../services/ai/packingAI';
import { prisma } from '../../../config/database';
import { CacheService, CACHE_TTL } from '../../../config/redis';

export const aiResolvers = {
  Query: {
    styleDNAAnalysis: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      requireAuth(ctx);
      const cacheKey = `user:${ctx.user.id}:style-dna`;
      const cached = await CacheService.get(cacheKey);
      if (cached) return cached;

      const analysis = await StyleAIService.analyzeStyleDNA(ctx.user.id);
      await CacheService.set(cacheKey, analysis, CACHE_TTL.DAY);
      return analysis;
    },
  },

  Mutation: {
    chatWithStylist: async (
      _: unknown,
      { message, sessionId }: { message: string; sessionId?: string },
      ctx: GraphQLContext
    ) => {
      requireAuth(ctx);
      return StyleAIService.chat(ctx.user.id, message, sessionId);
    },

    generatePackingList: async (
      _: unknown,
      { input }: { input: any },
      ctx: GraphQLContext
    ) => {
      requireAuth(ctx);
      return PackingAIService.generatePackingList(ctx.user.id, input);
    },

    computeStyleDNA: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      requireAuth(ctx);
      await CacheService.del(`user:${ctx.user.id}:style-dna`);
      const analysis = await StyleAIService.analyzeStyleDNA(ctx.user.id);
      await CacheService.set(`user:${ctx.user.id}:style-dna`, analysis, CACHE_TTL.DAY);
      return analysis;
    },
  },
};
