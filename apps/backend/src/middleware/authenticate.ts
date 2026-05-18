import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { prisma } from '../config/database';
import { redis } from '../config/redis';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    tier: string;
  };
}

export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = verifyAccessToken(token);

    const cached = await redis.get(`user:${payload.sub}:profile`);
    if (cached) {
      req.user = { id: payload.sub, email: payload.email, tier: payload.tier };
      return next();
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub, deletedAt: null },
      select: { id: true, email: true, premiumTier: true },
    });

    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    req.user = { id: user.id, email: user.email, tier: user.premiumTier };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
