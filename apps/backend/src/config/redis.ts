import IORedis from 'ioredis';
import { logger } from '../utils/logger';

export const redis = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 100, 3000),
  enableReadyCheck: true,
  lazyConnect: false,
});

redis.on('connect', () => logger.info('Redis connected'));
redis.on('error', (err) => logger.error('Redis error', err));

export const CACHE_TTL = {
  SHORT: 60,
  MEDIUM: 300,
  LONG: 3600,
  DAY: 86400,
  WEEK: 604800,
} as const;

export class CacheService {
  static async get<T>(key: string): Promise<T | null> {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  static async set(key: string, value: unknown, ttl = CACHE_TTL.MEDIUM): Promise<void> {
    await redis.set(key, JSON.stringify(value), 'EX', ttl);
  }

  static async del(key: string): Promise<void> {
    await redis.del(key);
  }

  static async delPattern(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) await redis.del(...keys);
  }

  static async invalidateUser(userId: string): Promise<void> {
    await this.delPattern(`user:${userId}:*`);
  }
}
