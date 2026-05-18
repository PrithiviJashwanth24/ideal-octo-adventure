import { GraphQLContext, requireAuth } from '../context';
import { prisma } from '../../../config/database';
import { CacheService, CACHE_TTL } from '../../../config/redis';
import { WardrobeAIService } from '../../../services/ai/wardrobeAI';
import { S3Service } from '../../../services/s3';

export const wardrobeResolvers = {
  Query: {
    wardrobeItems: async (
      _: unknown,
      args: { category?: string; brand?: string; occasion?: string; season?: string; isFavorite?: boolean; isArchived?: boolean; limit?: number; offset?: number },
      ctx: GraphQLContext
    ) => {
      requireAuth(ctx);
      const cacheKey = `user:${ctx.user.id}:wardrobe:${JSON.stringify(args)}`;
      const cached = await CacheService.get(cacheKey);
      if (cached) return cached;

      const items = await prisma.wardrobeItem.findMany({
        where: {
          userId: ctx.user.id,
          deletedAt: null,
          ...(args.category && { category: args.category as any }),
          ...(args.brand && { brand: { contains: args.brand, mode: 'insensitive' } }),
          ...(args.occasion && { occasionTags: { has: args.occasion as any } }),
          ...(args.season && { seasonTags: { has: args.season as any } }),
          ...(args.isFavorite !== undefined && { isFavorite: args.isFavorite }),
          ...(args.isArchived !== undefined && { isArchived: args.isArchived }),
        },
        include: { images: true },
        take: args.limit || 50,
        skip: args.offset || 0,
        orderBy: { wearCount: 'desc' },
      });

      await CacheService.set(cacheKey, items, CACHE_TTL.SHORT);
      return items;
    },

    wardrobeItem: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      requireAuth(ctx);
      return prisma.wardrobeItem.findFirst({
        where: { id, userId: ctx.user.id, deletedAt: null },
        include: { images: true },
      });
    },

    wardrobeStats: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      requireAuth(ctx);
      const cacheKey = `user:${ctx.user.id}:wardrobe:stats`;
      const cached = await CacheService.get(cacheKey);
      if (cached) return cached;

      const items = await prisma.wardrobeItem.findMany({
        where: { userId: ctx.user.id, deletedAt: null, isArchived: false },
        include: { images: false },
      });

      const totalItems = items.length;
      const totalValue = items.reduce((s, i) => s + (i.estimatedCurrentValue || i.purchasePrice || 0), 0);
      const wornItems = items.filter((i) => i.wearCount > 0);
      const utilizationRate = totalItems > 0 ? wornItems.length / totalItems : 0;
      const totalWearEvents = items.reduce((s, i) => s + i.wearCount, 0);
      const neglectedItems = items.filter((i) => i.wearCount === 0);
      const avgCostPerWear = totalWearEvents > 0
        ? items.reduce((s, i) => s + (i.purchasePrice || 0) / Math.max(i.wearCount, 1), 0) / totalItems
        : 0;

      // Category distribution for diversity
      const catSet = new Set(items.map((i) => i.category));
      const diversityScore = Math.min(catSet.size / 10, 1);

      const sustainabilityScore =
        items.reduce((s, i) => s + i.sustainabilityScore, 0) / Math.max(totalItems, 1);

      const closetHealthScore =
        utilizationRate * 0.4 + diversityScore * 0.3 + sustainabilityScore * 0.3;

      const stats = {
        totalItems,
        totalValue,
        utilizationRate,
        neglectedItemCount: neglectedItems.length,
        totalWearEvents,
        avgCostPerWear,
        diversityScore,
        sustainabilityScore,
        closetHealthScore,
        mostWornCategory: null,
        mostWornBrand: null,
      };

      await CacheService.set(cacheKey, stats, CACHE_TTL.MEDIUM);
      return stats;
    },
  },

  Mutation: {
    addWardrobeItem: async (
      _: unknown,
      { input }: { input: any },
      ctx: GraphQLContext
    ) => {
      requireAuth(ctx);

      // Create item with placeholder AI data (job will enrich)
      const item = await prisma.wardrobeItem.create({
        data: {
          userId: ctx.user.id,
          name: input.name,
          brand: input.brand,
          category: input.category,
          subcategory: input.subcategory,
          colorPrimary: input.colorPrimary,
          material: input.material || [],
          fit: input.fit,
          purchasePrice: input.purchasePrice,
          currency: input.currency || 'USD',
          purchasedAt: input.purchasedAt ? new Date(input.purchasedAt) : null,
          purchasedFrom: input.purchasedFrom,
          notes: input.notes,
          images: {
            create: input.imageUrls.map((url: string, idx: number) => ({
              url,
              s3Key: url,
              isPrimary: idx === 0,
            })),
          },
        },
        include: { images: true },
      });

      // Async AI enrichment
      WardrobeAIService.enrichItem(item.id, input.imageUrls[0]).catch(console.error);

      await CacheService.invalidateUser(ctx.user.id);
      return item;
    },

    updateWardrobeItem: async (_: unknown, { id, input }: { id: string; input: any }, ctx: GraphQLContext) => {
      requireAuth(ctx);
      const item = await prisma.wardrobeItem.update({
        where: { id, userId: ctx.user.id },
        data: { ...input, updatedAt: new Date() },
        include: { images: true },
      });
      await CacheService.invalidateUser(ctx.user.id);
      return item;
    },

    deleteWardrobeItem: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      requireAuth(ctx);
      await prisma.wardrobeItem.update({
        where: { id, userId: ctx.user.id },
        data: { deletedAt: new Date() },
      });
      await CacheService.invalidateUser(ctx.user.id);
      return true;
    },

    archiveWardrobeItem: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      requireAuth(ctx);
      const item = await prisma.wardrobeItem.update({
        where: { id, userId: ctx.user.id },
        data: { isArchived: true },
        include: { images: true },
      });
      await CacheService.invalidateUser(ctx.user.id);
      return item;
    },

    toggleFavorite: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      requireAuth(ctx);
      const current = await prisma.wardrobeItem.findFirst({ where: { id, userId: ctx.user.id } });
      if (!current) throw new Error('Item not found');
      const item = await prisma.wardrobeItem.update({
        where: { id },
        data: { isFavorite: !current.isFavorite },
        include: { images: true },
      });
      await CacheService.invalidateUser(ctx.user.id);
      return item;
    },

    updateLaundryStatus: async (
      _: unknown,
      { id, status }: { id: string; status: string },
      ctx: GraphQLContext
    ) => {
      requireAuth(ctx);
      return prisma.wardrobeItem.update({
        where: { id, userId: ctx.user.id },
        data: { laundryStatus: status as any },
        include: { images: true },
      });
    },
  },

  WardrobeItem: {
    costPerWear: (item: any) => {
      if (!item.purchasePrice || item.wearCount === 0) return null;
      return item.purchasePrice / item.wearCount;
    },
  },
};
