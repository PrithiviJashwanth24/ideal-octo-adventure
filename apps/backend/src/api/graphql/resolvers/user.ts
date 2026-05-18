import { GraphQLContext, requireAuth } from '../context';
import { prisma } from '../../../config/database';
import { CacheService } from '../../../config/redis';

export const userResolvers = {
  Query: {
    me: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      requireAuth(ctx);
      return prisma.user.findUnique({
        where: { id: ctx.user.id, deletedAt: null },
        include: { profile: true },
      });
    },
    user: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      requireAuth(ctx);
      return prisma.user.findUnique({
        where: { id, deletedAt: null },
        include: { profile: true },
      });
    },
  },
  Mutation: {
    updateProfile: async (_: unknown, { input }: { input: any }, ctx: GraphQLContext) => {
      requireAuth(ctx);
      const { displayName, bio, avatarUrl, ...profileData } = input;

      const user = await prisma.user.update({
        where: { id: ctx.user.id },
        data: {
          ...(displayName && { displayName }),
          ...(bio !== undefined && { bio }),
          ...(avatarUrl && { avatarUrl }),
          profile: { update: { ...profileData } },
        },
        include: { profile: true },
      });

      await CacheService.invalidateUser(ctx.user.id);
      return user;
    },

    completeOnboarding: async (_: unknown, { input }: { input: any }, ctx: GraphQLContext) => {
      requireAuth(ctx);
      const user = await prisma.user.update({
        where: { id: ctx.user.id },
        data: {
          isOnboarded: true,
          profile: {
            update: {
              bodyType: input.bodyType,
              styleArchetypes: input.styleArchetypes,
              budgetRange: input.budgetRange,
              preferredColors: input.preferredColors,
            },
          },
        },
        include: { profile: true },
      });
      await CacheService.invalidateUser(ctx.user.id);
      return user;
    },
  },

  User: {
    wardrobeItems: async (user: any, args: any, ctx: GraphQLContext) => {
      return ctx.loaders.wardrobeItemsByUserId.load(user.id);
    },
    wardrobeStats: async (user: any, _: unknown, ctx: GraphQLContext) => {
      return ctx.loaders.wardrobeItemsByUserId.load(user.id).then((items) => {
        const totalItems = items.length;
        const wornItems = items.filter((i) => i.wearCount > 0);
        return {
          totalItems,
          totalValue: items.reduce((s, i) => s + ((i as any).estimatedCurrentValue || (i as any).purchasePrice || 0), 0),
          utilizationRate: totalItems > 0 ? wornItems.length / totalItems : 0,
          neglectedItemCount: items.filter((i) => i.wearCount === 0).length,
          totalWearEvents: items.reduce((s, i) => s + i.wearCount, 0),
          avgCostPerWear: 0,
          diversityScore: 0.5,
          sustainabilityScore: 0.5,
          closetHealthScore: 0.5,
          mostWornCategory: null,
          mostWornBrand: null,
        };
      });
    },
    outfits: async (user: any, { limit = 10, offset = 0 }: any) => {
      return prisma.outfit.findMany({
        where: { userId: user.id },
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: { outfitItems: { include: { wardrobeItem: { include: { images: true } } } } },
      });
    },
    recentOutfitLogs: async (user: any, { limit = 7 }: any) => {
      return prisma.outfitLog.findMany({
        where: { userId: user.id },
        take: limit,
        orderBy: { wornAt: 'desc' },
        include: { outfit: true },
      });
    },
    followerCount: async (user: any) => {
      return prisma.socialConnection.count({ where: { connectedUserId: user.id } });
    },
    followingCount: async (user: any) => {
      return prisma.socialConnection.count({ where: { userId: user.id } });
    },
  },
};
