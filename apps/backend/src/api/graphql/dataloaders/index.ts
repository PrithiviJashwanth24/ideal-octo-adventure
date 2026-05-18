import DataLoader from 'dataloader';
import { prisma } from '../../../config/database';
import { WardrobeItem, User, Outfit } from '@prisma/client';

export function createLoaders() {
  return {
    userById: new DataLoader<string, User | null>(async (ids) => {
      const users = await prisma.user.findMany({ where: { id: { in: ids as string[] } } });
      const map = new Map(users.map((u) => [u.id, u]));
      return ids.map((id) => map.get(id) ?? null);
    }),

    wardrobeItemById: new DataLoader<string, WardrobeItem | null>(async (ids) => {
      const items = await prisma.wardrobeItem.findMany({
        where: { id: { in: ids as string[] } },
      });
      const map = new Map(items.map((i) => [i.id, i]));
      return ids.map((id) => map.get(id) ?? null);
    }),

    outfitById: new DataLoader<string, Outfit | null>(async (ids) => {
      const outfits = await prisma.outfit.findMany({
        where: { id: { in: ids as string[] } },
      });
      const map = new Map(outfits.map((o) => [o.id, o]));
      return ids.map((id) => map.get(id) ?? null);
    }),

    wardrobeItemsByUserId: new DataLoader<string, WardrobeItem[]>(async (userIds) => {
      const items = await prisma.wardrobeItem.findMany({
        where: { userId: { in: userIds as string[] }, deletedAt: null },
        orderBy: { createdAt: 'desc' },
      });
      const grouped = new Map<string, WardrobeItem[]>();
      for (const item of items) {
        const list = grouped.get(item.userId) || [];
        list.push(item);
        grouped.set(item.userId, list);
      }
      return userIds.map((id) => grouped.get(id) ?? []);
    }),
  };
}
