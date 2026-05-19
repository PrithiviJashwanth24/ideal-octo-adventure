import OpenAI from 'openai';
import { prisma } from '../../config/database';
import { CacheService, CACHE_TTL } from '../../config/redis';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface TrendPrediction {
  trend: string;
  momentum: 'rising' | 'peak' | 'declining';
  relevanceToUser: number;
  adoptionAdvice: string;
  keyPieces: string[];
  timeframe: string;
}

export interface WardrobeSimulation {
  currentScore: number;
  projectedScore: number;
  addedItem: string;
  impactAnalysis: string;
  outfitCombinationsUnlocked: number;
  recommendedBudget: number;
}

export class TrendEngine {
  /**
   * Predict fashion trends relevant to a specific user's style
   */
  static async predictPersonalizedTrends(userId: string): Promise<TrendPrediction[]> {
    const cacheKey = `user:${userId}:trends`;
    const cached = await CacheService.get<TrendPrediction[]>(cacheKey);
    if (cached) return cached;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    const prompt = `You are FitCheck's Trend Prediction Engine — a world-class fashion forecaster.

User style profile:
- Primary archetype: ${(user?.styleDna as any)?.primaryArchetype || 'general'}
- Budget: ${user?.profile?.budgetRange || 'MID'}
- Luxury affinity: ${user?.profile?.luxuryAffinity || 0.5}

Predict 5 fashion trends highly relevant to this user for the next 6 months.
Base predictions on current fashion week reports, street style data, and cultural signals.

Return JSON array:
[
  {
    "trend": "trend name",
    "momentum": "rising|peak|declining",
    "relevanceToUser": 0.0-1.0,
    "adoptionAdvice": "specific advice for this user to adopt this trend",
    "keyPieces": ["3-4 specific garments/accessories"],
    "timeframe": "when to adopt this"
  }
]`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 1200,
    });

    const result = JSON.parse(response.choices[0].message.content || '{"trends":[]}');
    const trends = Array.isArray(result) ? result : result.trends || [];

    await CacheService.set(cacheKey, trends, CACHE_TTL.DAY);
    return trends;
  }

  /**
   * Wardrobe simulation: "What happens if I add this item?"
   */
  static async simulateItemAddition(
    userId: string,
    itemDescription: string,
    itemPrice: number
  ): Promise<WardrobeSimulation> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        wardrobeItems: { where: { deletedAt: null }, take: 100 },
        profile: true,
      },
    });

    if (!user) throw new Error('User not found');

    const currentUtilization = user.wardrobeItems.filter((i) => i.wearCount > 0).length /
      Math.max(user.wardrobeItems.length, 1);

    const prompt = `You are FitCheck's Wardrobe Simulation Engine.

Current wardrobe: ${user.wardrobeItems.length} items, ${Math.round(currentUtilization * 100)}% utilization
Existing categories: ${[...new Set(user.wardrobeItems.map((i) => i.category))].join(', ')}
User style: ${user.profile?.styleArchetypes?.join(', ') || 'general'}

Item being considered: ${itemDescription}
Price: $${itemPrice}

Simulate the impact of adding this item:

Return JSON:
{
  "currentScore": current wardrobe score 0-100,
  "projectedScore": projected score after adding 0-100,
  "impactAnalysis": "detailed analysis of the impact",
  "outfitCombinationsUnlocked": estimated new outfit combinations,
  "recommendedBudget": whether this is a good use of budget (1-10),
  "verdict": "BUY|SKIP|WAIT",
  "verdictReason": "one sentence"
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 600,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      currentScore: result.currentScore || 65,
      projectedScore: result.projectedScore || 72,
      addedItem: itemDescription,
      impactAnalysis: result.impactAnalysis + ' ' + result.verdictReason,
      outfitCombinationsUnlocked: result.outfitCombinationsUnlocked || 12,
      recommendedBudget: result.recommendedBudget || 7,
    };
  }

  /**
   * "What successful people in [industry] wear" engine
   */
  static async getSuccessfulPeopleStyle(
    industry: string,
    role: string
  ): Promise<{ insights: string[]; essentialPieces: string[]; brandsToKnow: string[]; avoidList: string[] }> {
    const cacheKey = `style-guide:${industry}:${role}`;
    const cached = await CacheService.get<any>(cacheKey);
    if (cached) return cached;

    const prompt = `You are FitCheck's Professional Style Intelligence Engine.

Industry: ${industry}
Role: ${role}

Based on extensive research into what successful professionals in this field actually wear, provide a style guide.

Return JSON:
{
  "insights": ["5-6 nuanced observations about successful style in this field"],
  "essentialPieces": ["6-8 specific wardrobe essentials for this role"],
  "brandsToKnow": ["5-6 brands that signal credibility in this industry"],
  "avoidList": ["3-4 style mistakes that undermine credibility in this field"]
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 800,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    await CacheService.set(cacheKey, result, CACHE_TTL.WEEK);
    return result;
  }
}
