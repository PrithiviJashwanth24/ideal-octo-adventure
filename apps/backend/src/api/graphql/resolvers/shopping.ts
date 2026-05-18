import { GraphQLContext, requireAuth } from '../context';
import { prisma } from '../../../config/database';
import { ShoppingAIService } from '../../../services/ai/shoppingAI';
import { CacheService, CACHE_TTL } from '../../../config/redis';

export const shoppingResolvers = {
  Query: {
    shoppingRecommendations: async (_: unknown, { limit = 5 }: any, ctx: GraphQLContext) => {
      requireAuth(ctx);
      const cacheKey = `user:${ctx.user.id}:shopping-recs`;
      const cached = await CacheService.get(cacheKey);
      if (cached) return cached;

      const recs = await ShoppingAIService.detectWardrobeGaps(ctx.user.id, limit);
      await CacheService.set(cacheKey, recs, CACHE_TTL.LONG);
      return recs;
    },
  },

  Mutation: {
    createWishlist: async (_: unknown, { name }: { name: string }, ctx: GraphQLContext) => {
      requireAuth(ctx);
      return prisma.shoppingWishlist.create({
        data: { userId: ctx.user.id, name },
      });
    },

    addToWishlist: async (_: unknown, { wishlistId, input }: any, ctx: GraphQLContext) => {
      requireAuth(ctx);
      const wishlist = await prisma.shoppingWishlist.findFirst({
        where: { id: wishlistId, userId: ctx.user.id },
      });
      if (!wishlist) throw new Error('Wishlist not found');
      await prisma.wishlistItem.create({
        data: {
          wishlistId,
          productName: input.productName,
          productBrand: input.productBrand,
          productUrl: input.productUrl,
          productImageUrl: input.productImageUrl,
          price: input.price,
          currency: input.currency || 'USD',
          aiReason: input.aiReason,
          priority: input.priority || 0,
        },
      });
      return true;
    },
  },
};
