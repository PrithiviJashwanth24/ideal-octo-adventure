import OpenAI from 'openai';
import { prisma } from '../../config/database';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ConfidencePrediction {
  predictedScore: number;
  explanation: string;
  boosters: string[];
  detractors: string[];
  suggestions: string[];
}

export class ConfidenceAIService {
  /**
   * Predict confidence score for a given outfit before wearing it.
   * Used to rank AI-generated recommendations.
   */
  static async predictOutfitConfidence(
    userId: string,
    outfitItemIds: string[]
  ): Promise<ConfidencePrediction> {
    const [user, items, recentLogs] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, include: { profile: true } }),
      prisma.wardrobeItem.findMany({ where: { id: { in: outfitItemIds } } }),
      prisma.outfitLog.findMany({
        where: { userId, confidenceRating: { not: null } },
        take: 20,
        orderBy: { wornAt: 'desc' },
      }),
    ]);

    if (!user || items.length === 0) {
      return { predictedScore: 0.7, explanation: '', boosters: [], detractors: [], suggestions: [] };
    }

    const avgHistoricalConfidence =
      recentLogs.reduce((s, l) => s + (l.confidenceRating || 5), 0) / Math.max(recentLogs.length, 1) / 10;

    const prompt = `You are FitCheck's Confidence Intelligence Engine.

User profile:
- Body type: ${user.profile?.bodyType || 'unknown'}
- Style archetypes: ${user.profile?.styleArchetypes?.join(', ') || 'general'}
- Historical average confidence: ${(avgHistoricalConfidence * 10).toFixed(1)}/10

Outfit being evaluated:
${items.map((i) => `- ${i.name} (${i.category}, formality: ${i.formality}, confidence boost: ${i.confidenceBoost})`).join('\n')}

Predict the confidence score for wearing this outfit.

Return JSON:
{
  "predictedScore": 0.0-1.0,
  "explanation": "2 sentence explanation",
  "boosters": ["why this works well (2-3 items)"],
  "detractors": ["any concerns (0-2 items)"],
  "suggestions": ["how to improve the outfit (1-2 tips)"]
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 500,
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  }

  /**
   * "Wear this to maximize attractiveness" — event-specific optimization
   */
  static async optimizeForEvent(
    userId: string,
    eventType: string,
    eventDescription: string
  ): Promise<{ outfit: string[]; rationale: string; confidenceScore: number }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        wardrobeItems: {
          where: { deletedAt: null, isArchived: false, laundryStatus: 'CLEAN' },
          orderBy: [{ confidenceBoost: 'desc' }, { versatilityScore: 'desc' }],
          take: 50,
        },
      },
    });

    if (!user) throw new Error('User not found');

    const prompt = `You are FitCheck's Event Optimization AI.

Event: ${eventType}
Description: ${eventDescription}
User style: ${user.profile?.styleArchetypes?.join(', ') || 'general'}
User body type: ${user.profile?.bodyType || 'not specified'}

Top wardrobe items by confidence score:
${user.wardrobeItems.slice(0, 25).map((i) => `- ID:${i.id} ${i.name} (${i.category}, formality:${i.formality}, conf:${i.confidenceBoost})`).join('\n')}

Select the outfit that will maximize confidence and appropriate attractiveness for this specific event.

Return JSON:
{
  "itemIds": ["id1", "id2", ...],
  "rationale": "detailed explanation of why this is perfect for this event",
  "confidenceScore": 0.0-1.0,
  "psychologicalEdge": "the psychological advantage this outfit gives you in this context"
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 600,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      outfit: result.itemIds || [],
      rationale: result.rationale + '\n\n' + (result.psychologicalEdge || ''),
      confidenceScore: result.confidenceScore || 0.8,
    };
  }
}
