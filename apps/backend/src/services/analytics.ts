import { prisma } from '../config/database';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export class AnalyticsService {
  static async generateWardrobeReport(userId: string, period: string) {
    const now = new Date();
    let startDate = new Date();
    if (period === 'weekly') startDate.setDate(now.getDate() - 7);
    else if (period === 'monthly') startDate.setMonth(now.getMonth() - 1);
    else startDate.setFullYear(now.getFullYear() - 1);

    const [items, logs] = await Promise.all([
      prisma.wardrobeItem.findMany({
        where: { userId, deletedAt: null },
        include: { images: true },
        take: 200,
      }),
      prisma.outfitLog.findMany({
        where: { userId, wornAt: { gte: startDate } },
        include: { outfit: { include: { outfitItems: true } } },
      }),
    ]);

    const totalItems = items.filter((i) => !i.isArchived).length;
    const wornItems = items.filter((i) => i.lastWornAt && i.lastWornAt >= startDate);
    const utilizationRate = totalItems > 0 ? wornItems.length / totalItems : 0;
    const neglectedItems = items.filter((i) => !i.lastWornAt || i.wearCount === 0);
    const totalValue = items.reduce((s, i) => s + (i.purchasePrice || 0), 0);
    const totalWears = items.reduce((s, i) => s + i.wearCount, 0);
    const costPerWear = totalWears > 0 ? totalValue / totalWears : 0;

    const topItems = items.sort((a, b) => b.wearCount - a.wearCount).slice(0, 5);

    const catSet = new Set(wornItems.map((i) => i.category));
    const outfitDiversityScore = Math.min(catSet.size / 8, 1);
    const sustainabilityScore = items.reduce((s, i) => s + i.sustainabilityScore, 0) / Math.max(items.length, 1);

    const prompt = `Generate 5 personalized wardrobe insights and 5 recommendations for a user with:
- ${totalItems} items, ${(utilizationRate * 100).toFixed(0)}% utilization rate
- ${neglectedItems.length} neglected items
- Top worn items: ${topItems.map((i) => i.name).join(', ')}
- Cost per wear: $${costPerWear.toFixed(2)}
- Period: ${period}

Return JSON: { "insights": ["..."], "recommendations": ["..."] }`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 600,
    });

    const aiResult = JSON.parse(response.choices[0].message.content || '{}');

    return {
      period,
      utilizationRate,
      topItems,
      neglectedItems: neglectedItems.slice(0, 10),
      costPerWear,
      outfitDiversityScore,
      sustainabilityScore,
      insights: aiResult.insights || [],
      recommendations: aiResult.recommendations || [],
    };
  }

  static async computeConfidenceScore(userId: string) {
    const logs = await prisma.outfitLog.findMany({
      where: { userId, confidenceRating: { not: null } },
      include: { outfit: { include: { outfitItems: { include: { wardrobeItem: true } } } } },
      take: 50,
      orderBy: { wornAt: 'desc' },
    });

    const overall = logs.length > 0
      ? logs.reduce((s, l) => s + (l.confidenceRating || 0), 0) / logs.length / 10
      : 0.5;

    const byOccasion: Record<string, number[]> = {};
    for (const log of logs) {
      const occ = log.eventType || 'EVERYDAY';
      if (!byOccasion[occ]) byOccasion[occ] = [];
      byOccasion[occ].push(log.confidenceRating || 5);
    }
    const byOccasionAvg = Object.fromEntries(
      Object.entries(byOccasion).map(([k, v]) => [k, v.reduce((a, b) => a + b, 0) / v.length / 10])
    );

    const trend = logs.slice(0, 14).map((l) => (l.confidenceRating || 5) / 10);

    const boostScores: Record<string, number> = {};
    for (const log of logs) {
      const items = log.outfit?.outfitItems?.map((oi) => oi.wardrobeItem) || [];
      for (const item of items) {
        if (item) {
          boostScores[item.id] = (boostScores[item.id] || 0) + (log.confidenceRating || 5);
        }
      }
    }

    const topItemIds = Object.entries(boostScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id);

    const topBoostingItems = await prisma.wardrobeItem.findMany({
      where: { id: { in: topItemIds } },
      include: { images: true },
    });

    return { overall, byOccasion: byOccasionAvg, trend, topBoostingItems };
  }
}
