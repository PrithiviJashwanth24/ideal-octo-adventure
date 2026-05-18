import { GraphQLContext, requireAuth } from '../context';
import { prisma } from '../../../config/database';

export const socialResolvers = {
  Query: {
    socialFeed: async (_: unknown, { limit = 20, offset = 0 }: any, ctx: GraphQLContext) => {
      requireAuth(ctx);
      const following = await prisma.socialConnection.findMany({
        where: { userId: ctx.user.id },
        select: { connectedUserId: true },
      });
      const followingIds = following.map((f) => f.connectedUserId);

      const logs = await prisma.outfitLog.findMany({
        where: {
          userId: { in: followingIds },
          photoUrl: { not: null },
        },
        include: { user: true, outfit: true },
        take: limit,
        skip: offset,
        orderBy: { wornAt: 'desc' },
      });

      return logs.map((log) => ({
        id: log.id,
        user: log.user,
        outfit: log.outfit,
        log,
        imageUrl: log.photoUrl,
        likeCount: 0,
        commentCount: 0,
        createdAt: log.wornAt,
      }));
    },
  },

  Mutation: {
    followUser: async (_: unknown, { userId }: { userId: string }, ctx: GraphQLContext) => {
      requireAuth(ctx);
      if (userId === ctx.user.id) throw new Error('Cannot follow yourself');
      await prisma.socialConnection.upsert({
        where: { userId_connectedUserId: { userId: ctx.user.id, connectedUserId: userId } },
        create: { userId: ctx.user.id, connectedUserId: userId },
        update: {},
      });
      return true;
    },

    unfollowUser: async (_: unknown, { userId }: { userId: string }, ctx: GraphQLContext) => {
      requireAuth(ctx);
      await prisma.socialConnection.deleteMany({
        where: { userId: ctx.user.id, connectedUserId: userId },
      });
      return true;
    },

    rateOutfit: async (
      _: unknown,
      { outfitId, rating, tags, comment }: any,
      ctx: GraphQLContext
    ) => {
      requireAuth(ctx);
      const outfit = await prisma.outfit.findUnique({ where: { id: outfitId } });
      if (!outfit) throw new Error('Outfit not found');

      const review = await prisma.outfitReview.create({
        data: {
          outfitId,
          giverId: ctx.user.id,
          receiverId: outfit.userId,
          rating,
          tags: tags || [],
          comment,
        },
      });
      return review;
    },
  },
};
