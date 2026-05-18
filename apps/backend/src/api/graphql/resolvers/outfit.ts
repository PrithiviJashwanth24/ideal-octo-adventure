import { GraphQLContext, requireAuth } from '../context';
import { prisma } from '../../../config/database';
import { OutfitAIService } from '../../../services/ai/outfitAI';
import { CacheService, CACHE_TTL } from '../../../config/redis';

export const outfitResolvers = {
  Query: {
    outfit: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      requireAuth(ctx);
      return prisma.outfit.findFirst({
        where: { id, userId: ctx.user.id },
        include: { outfitItems: { include: { wardrobeItem: { include: { images: true } } } } },
      });
    },

    outfits: async (_: unknown, { limit = 20, offset = 0 }: any, ctx: GraphQLContext) => {
      requireAuth(ctx);
      return prisma.outfit.findMany({
        where: { userId: ctx.user.id },
        include: { outfitItems: { include: { wardrobeItem: { include: { images: true } } } } },
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      });
    },

    outfitRecommendations: async (_: unknown, args: any, ctx: GraphQLContext) => {
      requireAuth(ctx);
      const cacheKey = `user:${ctx.user.id}:outfit-recs:${JSON.stringify(args)}`;
      const cached = await CacheService.get(cacheKey);
      if (cached) return cached;

      const recs = await OutfitAIService.generateRecommendationSet(ctx.user.id, args);
      await CacheService.set(cacheKey, recs, CACHE_TTL.SHORT);
      return recs;
    },
  },

  Mutation: {
    saveOutfit: async (_: unknown, { input }: { input: any }, ctx: GraphQLContext) => {
      requireAuth(ctx);
      const outfit = await prisma.outfit.create({
        data: {
          userId: ctx.user.id,
          name: input.name,
          occasionTag: input.occasionTag,
          mood: input.mood,
          isPublic: input.isPublic || false,
          outfitItems: {
            create: input.wardrobeItemIds.map((id: string, idx: number) => ({
              wardrobeItemId: id,
              layer: idx,
            })),
          },
        },
        include: { outfitItems: { include: { wardrobeItem: { include: { images: true } } } } },
      });
      await CacheService.invalidateUser(ctx.user.id);
      return outfit;
    },

    logOutfit: async (_: unknown, { input }: { input: any }, ctx: GraphQLContext) => {
      requireAuth(ctx);
      const log = await prisma.outfitLog.create({
        data: {
          userId: ctx.user.id,
          outfitId: input.outfitId,
          wornAt: new Date(input.wornAt),
          eventName: input.eventName,
          eventType: input.eventType,
          location: input.location,
          photoUrl: input.photoUrl,
          socialPosted: input.socialPosted || false,
          confidenceRating: input.confidenceRating,
          notes: input.notes,
        },
        include: { outfit: true },
      });

      // Update wear counts for all items in the outfit
      if (input.outfitId) {
        const outfitItems = await prisma.outfitItem.findMany({ where: { outfitId: input.outfitId } });
        await prisma.wardrobeItem.updateMany({
          where: { id: { in: outfitItems.map((oi) => oi.wardrobeItemId) } },
          data: { wearCount: { increment: 1 }, lastWornAt: new Date(input.wornAt) },
        });
      }

      await CacheService.invalidateUser(ctx.user.id);
      return log;
    },

    deleteOutfit: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      requireAuth(ctx);
      await prisma.outfit.delete({ where: { id, userId: ctx.user.id } });
      await CacheService.invalidateUser(ctx.user.id);
      return true;
    },
  },

  Outfit: {
    items: async (outfit: any) => {
      if (outfit.outfitItems) {
        return outfit.outfitItems.map((oi: any) => oi.wardrobeItem).filter(Boolean);
      }
      const outfitItems = await prisma.outfitItem.findMany({
        where: { outfitId: outfit.id },
        include: { wardrobeItem: { include: { images: true } } },
      });
      return outfitItems.map((oi) => oi.wardrobeItem);
    },
  },
};
