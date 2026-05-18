import bcrypt from 'bcryptjs';
import { GraphQLContext, requireAuth } from '../context';
import { createTokenPair, revokeRefreshToken, verifyRefreshToken, signAccessToken, signRefreshToken } from '../../../utils/jwt';
import { prisma } from '../../../config/database';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  displayName: z.string().min(1).max(50),
});

export const authResolvers = {
  Mutation: {
    register: async (_: unknown, { input }: { input: any }, ctx: GraphQLContext) => {
      const data = registerSchema.parse(input);

      const existing = await prisma.user.findFirst({
        where: { OR: [{ email: data.email }, { username: data.username }] },
      });
      if (existing) throw new Error('Email or username already taken');

      const passwordHash = await bcrypt.hash(data.password, 12);
      const user = await prisma.user.create({
        data: {
          email: data.email,
          username: data.username,
          displayName: data.displayName,
          passwordHash,
          profile: { create: {} },
        },
        include: { profile: true },
      });

      const tokens = await createTokenPair(user.id, user.email, user.premiumTier);
      return { ...tokens, user };
    },

    login: async (_: unknown, { input }: { input: any }, ctx: GraphQLContext) => {
      const user = await prisma.user.findUnique({
        where: { email: input.email, deletedAt: null },
        include: { profile: true },
      });
      if (!user) throw new Error('Invalid credentials');

      const valid = await bcrypt.compare(input.password, user.passwordHash);
      if (!valid) throw new Error('Invalid credentials');

      const tokens = await createTokenPair(user.id, user.email, user.premiumTier, input.deviceId);
      return { ...tokens, user };
    },

    refreshToken: async (_: unknown, { token }: { token: string }) => {
      const payload = verifyRefreshToken(token);
      const record = await prisma.refreshToken.findUnique({ where: { token } });
      if (!record || record.revokedAt || record.expiresAt < new Date()) {
        throw new Error('Invalid refresh token');
      }

      const user = await prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) throw new Error('User not found');

      await prisma.refreshToken.update({ where: { token }, data: { revokedAt: new Date() } });
      const tokens = await createTokenPair(user.id, user.email, user.premiumTier);
      return { ...tokens, user };
    },

    logout: async (_: unknown, { refreshToken }: { refreshToken: string }) => {
      await revokeRefreshToken(refreshToken);
      return true;
    },
  },
};
