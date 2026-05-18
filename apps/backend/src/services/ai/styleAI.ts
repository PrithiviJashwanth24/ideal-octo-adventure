import OpenAI from 'openai';
import { prisma } from '../../config/database';
import { CacheService, CACHE_TTL } from '../../config/redis';
import { logger } from '../../utils/logger';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export class StyleAIService {
  static async analyzeStyleDNA(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        wardrobeItems: {
          where: { deletedAt: null },
          take: 200,
          orderBy: { wearCount: 'desc' },
        },
        outfitLogs: {
          take: 50,
          orderBy: { wornAt: 'desc' },
        },
      },
    });

    if (!user) throw new Error('User not found');

    const topBrands = Object.entries(
      user.wardrobeItems.reduce((acc: Record<string, number>, item) => {
        if (item.brand) acc[item.brand] = (acc[item.brand] || 0) + item.wearCount;
        return acc;
      }, {})
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([brand]) => brand);

    const colorFrequency = Object.entries(
      user.wardrobeItems.reduce((acc: Record<string, number>, item) => {
        if (item.colorPrimary) acc[item.colorPrimary] = (acc[item.colorPrimary] || 0) + item.wearCount;
        return acc;
      }, {})
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([color]) => color);

    const prompt = `You are FitCheck's Style DNA engine — the most sophisticated personal style analysis AI.

Analyze this user's wardrobe data and generate their Style DNA:

Wardrobe Summary:
- Total items: ${user.wardrobeItems.length}
- Top brands by wear: ${topBrands.join(', ')}
- Dominant colors: ${colorFrequency.join(', ')}
- Avg formality: ${(user.wardrobeItems.reduce((s, i) => s + i.formality, 0) / Math.max(user.wardrobeItems.length, 1)).toFixed(2)}
- Style archetypes present: ${[...new Set(user.wardrobeItems.flatMap((i) => i.styleArchetypes))].join(', ')}
- Outfit events logged: ${user.outfitLogs.length}
- Stated archetypes: ${user.profile?.styleArchetypes?.join(', ') || 'not stated'}

Generate Style DNA report as JSON:
{
  "primaryArchetype": "QUIET_LUXURY|STREETWEAR|OLD_MONEY|MINIMALIST|CORPORATE_ELITE|TECHWEAR|CLEAN_FIT|CREATIVE_DIRECTOR|ATHLEISURE|BOHEMIAN|PREPPY|EDGY|COASTAL|DARK_ACADEMIA",
  "secondaryArchetypes": ["..."],
  "confidenceProfile": {
    "casual": 0.0-1.0,
    "formal": 0.0-1.0,
    "social": 0.0-1.0,
    "professional": 0.0-1.0
  },
  "colorPersonality": "one sentence",
  "fashionAge": "e.g. 'Sophisticated 28-year-old creative' or 'Classic 35-year-old executive'",
  "strengths": ["3-5 specific style strengths"],
  "opportunities": ["3-5 growth areas"],
  "iconicComparisons": ["3 celebrity/character style comparisons"]
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 1000,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    // Persist style DNA to user record
    await prisma.user.update({
      where: { id: userId },
      data: {
        styleDna: result,
        profile: {
          update: {
            styleArchetypes: [result.primaryArchetype, ...(result.secondaryArchetypes || [])].filter(Boolean) as any[],
          },
        },
      },
    });

    // Update style embedding
    await StyleAIService.updateStyleEmbedding(userId, result);

    return result;
  }

  static async updateStyleEmbedding(userId: string, styleDna: object): Promise<void> {
    const text = JSON.stringify(styleDna);
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: text,
    });

    const embedding = response.data[0].embedding;
    await prisma.$executeRaw`
      INSERT INTO style_embeddings (id, user_id, embedding, version, last_computed_at)
      VALUES (uuid_generate_v4(), ${userId}::uuid, ${embedding}::vector, 1, now())
      ON CONFLICT (user_id) DO UPDATE
      SET embedding = ${embedding}::vector,
          version = style_embeddings.version + 1,
          last_computed_at = now()
    `;
  }

  static async chat(userId: string, message: string, sessionId?: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        wardrobeItems: { where: { deletedAt: null }, take: 50, orderBy: { wearCount: 'desc' } },
      },
    });

    const systemPrompt = `You are FitCheck AI — the world's most sophisticated personal style assistant.
You know fashion psychology, color theory, body morphology, luxury brands, streetwear culture, and personal branding.
You are empathetic, intelligent, and deeply personalized.

This user's style profile:
- Name: ${user?.displayName}
- Primary Archetype: ${user?.profile?.styleArchetypes?.[0] || 'discovering'}
- Budget: ${user?.profile?.budgetRange || 'mid-range'}
- Wardrobe: ${user?.wardrobeItems?.length || 0} items
- Style DNA: ${JSON.stringify(user?.styleDna || {})}

You have access to their wardrobe and can reference specific items.
Be conversational but expert. Give actionable, specific advice. Use fashion terminology naturally.
When suggesting outfits, reference their actual wardrobe items.`;

    let sessionMessages: any[] = [];
    if (sessionId) {
      const session = await prisma.aISession.findFirst({
        where: { id: sessionId, userId },
        select: { messages: true },
      });
      sessionMessages = (session?.messages as any[]) || [];
    }

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...sessionMessages.slice(-10),
      { role: 'user' as const, content: message },
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      max_tokens: 1000,
      temperature: 0.7,
    });

    const aiResponse = response.choices[0].message.content || '';

    const newMessages = [...sessionMessages, { role: 'user', content: message }, { role: 'assistant', content: aiResponse }];
    const session = await prisma.aISession.upsert({
      where: { id: sessionId || 'new' },
      create: {
        userId,
        sessionType: 'STYLE_COACH',
        messages: newMessages,
        tokensUsed: response.usage?.total_tokens || 0,
        costUsd: (response.usage?.total_tokens || 0) * 0.000005,
      },
      update: {
        messages: newMessages,
        tokensUsed: { increment: response.usage?.total_tokens || 0 },
      },
    });

    return {
      id: session.id,
      response: aiResponse,
      outfitSuggestions: null,
      actionItems: [],
      insights: null,
    };
  }
}
