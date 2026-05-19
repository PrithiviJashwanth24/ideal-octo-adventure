import OpenAI from 'openai';
import { prisma } from '../../config/database';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface SocialPerceptionReport {
  overallImpression: string;
  perceivedTraits: Array<{ trait: string; strength: number; explanation: string }>;
  socialContextFit: Record<string, number>;
  firstImpressionScore: number;
  memorabilityScore: number;
  approachabilityScore: number;
  authorityScore: number;
  attractivenessScore: number;
  suggestions: string[];
}

export class SocialPerceptionAI {
  /**
   * Analyze how others will perceive an outfit in a social context.
   * The "social perception analytics" secret sauce feature.
   */
  static async analyzePerception(
    outfitItemIds: string[],
    socialContext: string,
    userId: string
  ): Promise<SocialPerceptionReport> {
    const [items, user] = await Promise.all([
      prisma.wardrobeItem.findMany({ where: { id: { in: outfitItemIds } } }),
      prisma.user.findUnique({ where: { id: userId }, include: { profile: true } }),
    ]);

    const prompt = `You are FitCheck's Social Perception Intelligence Engine. You understand social psychology, first impressions, and nonverbal communication through clothing.

Social context: ${socialContext}

User:
- Body type: ${user?.profile?.bodyType || 'not specified'}
- Gender signal: based on items

Outfit:
${items.map((i) => `- ${i.name} (${i.category}, color: ${i.colorPrimary}, formality: ${i.formality}, fit: ${i.fit})`).join('\n')}

Analyze how this outfit will be perceived by others in the given social context.
Base analysis on social psychology research: color theory, formality signaling, status markers, gender norms, cultural codes.

Return JSON:
{
  "overallImpression": "one powerful sentence",
  "perceivedTraits": [
    {"trait": "trait name", "strength": 0.0-1.0, "explanation": "why this outfit signals this trait"}
  ],
  "socialContextFit": {
    "${socialContext}": 0.0-1.0
  },
  "firstImpressionScore": 0.0-1.0,
  "memorabilityScore": 0.0-1.0,
  "approachabilityScore": 0.0-1.0,
  "authorityScore": 0.0-1.0,
  "attractivenessScore": 0.0-1.0,
  "suggestions": ["2-3 specific tweaks to improve perception in this context"]
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 900,
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  }

  /**
   * Personal brand optimization: align outfit with the brand you're building
   */
  static async optimizePersonalBrand(
    userId: string,
    brandStatement: string,
    targetAudience: string
  ): Promise<{ recommendations: string[]; outfitPrinciples: string[]; avoidList: string[]; brandScore: number }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        wardrobeItems: { where: { deletedAt: null }, take: 50, orderBy: { wearCount: 'desc' } },
      },
    });

    if (!user) throw new Error('User not found');

    const prompt = `You are FitCheck's Personal Brand Optimization Engine.

The user wants to be known as: "${brandStatement}"
Their target audience: ${targetAudience}
Current style archetype: ${(user.styleDna as any)?.primaryArchetype || 'not set'}
Most worn items: ${user.wardrobeItems.slice(0, 10).map((i) => i.name).join(', ')}

Analyze alignment between their current wardrobe and personal brand, then provide optimization advice.

Return JSON:
{
  "brandScore": 0-100 alignment score,
  "recommendations": ["5-6 specific ways to make their wardrobe align with their brand"],
  "outfitPrinciples": ["3-4 rules they should always follow for brand consistency"],
  "avoidList": ["2-3 specific things that undermine their brand"],
  "signatureElement": "one signature element they should own and repeat"
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 700,
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  }
}
