import { Request } from 'express';
import { verifyAccessToken } from '../../utils/jwt';
import { prisma } from '../../config/database';
import { redis } from '../../config/redis';
import { createLoaders } from './dataloaders';

export interface GraphQLContext {
  user: { id: string; email: string; tier: string } | null;
  prisma: typeof prisma;
  redis: typeof redis;
  loaders: ReturnType<typeof createLoaders>;
}

export async function createContext({ req }: { req: Request }): Promise<GraphQLContext> {
  const loaders = createLoaders();
  let user: GraphQLContext['user'] = null;

  const authHeader = req?.headers?.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const payload = verifyAccessToken(authHeader.slice(7));
      user = { id: payload.sub, email: payload.email, tier: payload.tier };
    } catch {
      // unauthenticated — public resolvers still work
    }
  }

  return { user, prisma, redis, loaders };
}

export function requireAuth(context: GraphQLContext): asserts context is GraphQLContext & { user: NonNullable<GraphQLContext['user']> } {
  if (!context.user) {
    throw new Error('UNAUTHENTICATED');
  }
}

export function requirePremium(context: GraphQLContext, minTier: string = 'ESSENTIAL'): void {
  requireAuth(context);
  const tierOrder = ['FREE', 'ESSENTIAL', 'STYLE', 'LUXE'];
  const userTierIdx = tierOrder.indexOf(context.user.tier);
  const requiredIdx = tierOrder.indexOf(minTier);
  if (userTierIdx < requiredIdx) {
    throw new Error('PREMIUM_REQUIRED');
  }
}
