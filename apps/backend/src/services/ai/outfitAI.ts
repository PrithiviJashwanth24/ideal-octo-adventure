import OpenAI from 'openai';
import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface RecommendationContext {
  occasion?: string;
  eventDate?: Date;
  weatherTemp?: number;
  weatherCondition?: string;
}

export class OutfitAIService {
  static async generateRecommendationSet(userId: string, ctx: RecommendationContext) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        wardrobeItems: {
          where: { deletedAt: null, isArchived: false, laundryStatus: 'CLEAN' },
          include: { images: true },
          take: 100,
          orderBy: { versatilityScore: 'desc' },
        },
        outfitLogs: {
          take: 30,
          orderBy: { wornAt: 'desc' },
          include: { outfit: { include: { outfitItems: true } } },
        },
      },
    });

    if (!user) throw new Error('User not found');

    const wardrobeContext = user.wardrobeItems.map((item) => ({
      id: item.id,
      name: item.name,
      brand: item.brand,
      category: item.category,
      color: item.colorPrimary,
      fit: item.fit,
      formality: item.formality,
      versatility: item.versatilityScore,
      confidence: item.confidenceBoost,
      occasions: item.occasionTags,
      seasons: item.seasonTags,
      wearCount: item.wearCount,
      lastWorn: item.lastWornAt?.toISOString(),
    }));

    const recentlyWorn = user.outfitLogs
      .slice(0, 7)
      .flatMap((log) => log.outfit?.outfitItems?.map((oi) => oi.wardrobeItemId) || []);

    const prompt = `You are FitCheck's AI Stylist — the world's most intelligent personal fashion AI.

User Profile:
- Body Type: ${user.profile?.bodyType || 'not specified'}
- Style Archetypes: ${user.profile?.styleArchetypes?.join(', ') || 'not set'}
- Budget Range: ${user.profile?.budgetRange || 'MID'}
- Luxury Affinity: ${user.profile?.luxuryAffinity || 0.5}

Context:
- Occasion: ${ctx.occasion || 'everyday'}
- Date: ${ctx.eventDate?.toISOString() || new Date().toISOString()}
- Weather: ${ctx.weatherTemp ? `${ctx.weatherTemp}°C, ${ctx.weatherCondition}` : 'not specified'}

Wardrobe (${wardrobeContext.length} clean items available):
${JSON.stringify(wardrobeContext.slice(0, 40), null, 2)}

Recently worn item IDs (avoid heavy repetition):
${JSON.stringify(recentlyWorn)}

Generate FIVE outfit archetypes using ONLY available wardrobe item IDs:
1. safe — reliable, proven, comfortable
2. statement — bold, attention-commanding
3. stealthLuxury — understated premium
4. dateNight — romantic, confident
5. boardroom — authoritative, professional

Return JSON:
{
  "safe": { "itemIds": ["id1", "id2"], "name": "...", "rationale": "..." },
  "statement": { "itemIds": [...], "name": "...", "rationale": "..." },
  "stealthLuxury": { "itemIds": [...], "name": "...", "rationale": "..." },
  "dateNight": { "itemIds": [...], "name": "...", "rationale": "..." },
  "boardroom": { "itemIds": [...], "name": "...", "rationale": "..." },
  "overallRationale": "2-3 sentence summary of today's recommendations",
  "contextUsed": { "weather": "...", "occasion": "...", "personalStyle": "..." }
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 2000,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    const toOutfit = async (archetypeKey: string) => {
      const archetypeData = result[archetypeKey];
      if (!archetypeData?.itemIds?.length) return null;

      const validItems = await prisma.wardrobeItem.findMany({
        where: { id: { in: archetypeData.itemIds }, userId, deletedAt: null },
        include: { images: true },
      });

      const outfit = await prisma.outfit.create({
        data: {
          userId,
          name: archetypeData.name,
          aiGenerated: true,
          aiRationale: archetypeData.rationale,
          occasionTag: ctx.occasion as any,
          confidenceScore: 0.85,
          outfitItems: {
            create: validItems.map((item, idx) => ({
              wardrobeItemId: item.id,
              layer: idx,
            })),
          },
        },
        include: { outfitItems: { include: { wardrobeItem: { include: { images: true } } } } },
      });

      return outfit;
    };

    const [safe, statement, stealthLuxury, dateNight, boardroom] = await Promise.all([
      toOutfit('safe'),
      toOutfit('statement'),
      toOutfit('stealthLuxury'),
      toOutfit('dateNight'),
      toOutfit('boardroom'),
    ]);

    return {
      safe,
      statement,
      stealthLuxury,
      dateNight,
      boardroom,
      rationale: result.overallRationale || '',
      contextUsed: result.contextUsed || {},
    };
  }
}
