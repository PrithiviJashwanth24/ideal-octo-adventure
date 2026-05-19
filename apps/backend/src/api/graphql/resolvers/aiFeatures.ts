import { MoodDressingAI, Mood } from '../../../services/ai/moodDressingAI';
import { SocialPerceptionAI } from '../../../services/ai/socialPerceptionAI';
import { TrendEngine } from '../../../services/ai/trendEngine';
import { ConfidenceAIService } from '../../../services/ai/confidenceAI';
import { prisma } from '../../../config/database';
import { GraphQLContext, requireAuth } from '../context';

export const aiFeaturesResolvers = {
  Query: {
    moodOptions: () => MoodDressingAI.getMoodOptions(),

    moodOutfit: async (_: any, { mood }: { mood: Mood }, ctx: GraphQLContext) => {
      requireAuth(ctx);
      return MoodDressingAI.generateMoodOutfit(ctx.user!.id, mood);
    },

    personalizedTrends: async (_: any, __: any, ctx: GraphQLContext) => {
      requireAuth(ctx);
      return TrendEngine.predictPersonalizedTrends(ctx.user!.id);
    },

    wardrobeSimulation: async (
      _: any,
      { itemDescription, itemPrice }: { itemDescription: string; itemPrice: number },
      ctx: GraphQLContext
    ) => {
      requireAuth(ctx);
      return TrendEngine.simulateItemAddition(ctx.user!.id, itemDescription, itemPrice);
    },

    successfulPeopleStyle: async (
      _: any,
      { industry, role }: { industry: string; role: string }
    ) => {
      return TrendEngine.getSuccessfulPeopleStyle(industry, role);
    },

    socialPerception: async (
      _: any,
      { outfitItemIds, socialContext }: { outfitItemIds: string[]; socialContext: string },
      ctx: GraphQLContext
    ) => {
      requireAuth(ctx);
      return SocialPerceptionAI.analyzePerception(outfitItemIds, socialContext, ctx.user!.id);
    },

    outfitConfidence: async (
      _: any,
      { outfitItemIds }: { outfitItemIds: string[] },
      ctx: GraphQLContext
    ) => {
      requireAuth(ctx);
      return ConfidenceAIService.predictOutfitConfidence(ctx.user!.id, outfitItemIds);
    },

    eventOptimization: async (
      _: any,
      { eventType, eventDescription }: { eventType: string; eventDescription: string },
      ctx: GraphQLContext
    ) => {
      requireAuth(ctx);
      return ConfidenceAIService.optimizeForEvent(ctx.user!.id, eventType, eventDescription);
    },

    wardrobeWrapped: async (_: any, { year }: { year: number }, ctx: GraphQLContext) => {
      requireAuth(ctx);
      const userId = ctx.user!.id;

      const startDate = new Date(`${year}-01-01`);
      const endDate = new Date(`${year}-12-31`);

      const [logs, items] = await Promise.all([
        prisma.outfitLog.findMany({
          where: { userId, wornAt: { gte: startDate, lte: endDate } },
          include: { outfit: { include: { items: { include: { wardrobeItem: true } } } } },
          orderBy: { wornAt: 'asc' },
        }),
        prisma.wardrobeItem.findMany({
          where: { userId, deletedAt: null },
          orderBy: { wearCount: 'desc' },
        }),
      ]);

      const totalOutfits = logs.length;
      const avgConfidence =
        logs.reduce((s, l) => s + (l.confidenceRating || 7), 0) / Math.max(logs.length, 1);

      const categoryBreakdown: Record<string, number> = {};
      items.forEach((i) => {
        categoryBreakdown[i.category] = (categoryBreakdown[i.category] || 0) + i.wearCount;
      });

      const topItem = items[0];
      const mostWornCategory = Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1])[0];

      const monthlyActivity: number[] = Array(12).fill(0);
      logs.forEach((l) => {
        monthlyActivity[new Date(l.wornAt).getMonth()]++;
      });
      const peakMonth = monthlyActivity.indexOf(Math.max(...monthlyActivity));
      const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

      return {
        year,
        totalOutfitsWorn: totalOutfits,
        totalItemsInWardrobe: items.length,
        avgConfidenceRating: Math.round(avgConfidence * 10) / 10,
        topItem: topItem ? { id: topItem.id, name: topItem.name, wearCount: topItem.wearCount } : null,
        mostWornCategory: mostWornCategory ? mostWornCategory[0] : 'TOPS',
        peakMonth: monthNames[peakMonth],
        monthlyActivity,
        stylePersonality: 'The Elevated Curator',
        headline: `${totalOutfits} outfits. ${Math.round(avgConfidence * 10)}/10 avg confidence. That's your ${year}.`,
        insight: `You wore your wardrobe with intention this year. Your most-reached-for category was ${mostWornCategory?.[0] || 'TOPS'}, and your confidence peaked in ${monthNames[peakMonth]}.`,
      };
    },
  },

  Mutation: {
    personalBrandOptimize: async (
      _: any,
      { brandStatement, targetAudience }: { brandStatement: string; targetAudience: string },
      ctx: GraphQLContext
    ) => {
      requireAuth(ctx);
      return SocialPerceptionAI.optimizePersonalBrand(ctx.user!.id, brandStatement, targetAudience);
    },
  },
};
