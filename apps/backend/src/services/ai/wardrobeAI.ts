import OpenAI from 'openai';
import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';
import { pubsub, EVENTS } from '../../api/graphql/resolvers/subscriptions';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface AIEnrichmentResult {
  category: string;
  brand: string | null;
  colorPrimary: string;
  colorPalette: string[];
  material: string[];
  pattern: string | null;
  fit: string | null;
  styleArchetypes: string[];
  occasionTags: string[];
  seasonTags: string[];
  formality: number;
  versatilityScore: number;
  confidenceBoost: number;
  sustainabilityScore: number;
  estimatedValue: number | null;
  wearCondition: string;
}

export class WardrobeAIService {
  static async enrichItem(itemId: string, imageUrl: string): Promise<void> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are FitCheck's fashion intelligence engine. Analyze clothing images with expert precision.
              Return ONLY valid JSON matching the schema. Be extremely specific and accurate.
              Score all numeric fields 0.0-1.0 unless otherwise specified.`,
          },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: imageUrl, detail: 'high' },
              },
              {
                type: 'text',
                text: `Analyze this clothing item and return JSON:
{
  "category": "ClothingCategory enum value",
  "brand": "detected brand or null",
  "colorPrimary": "main hex color",
  "colorPalette": ["hex1", "hex2"],
  "material": ["material1"],
  "pattern": "solid|striped|plaid|floral|geometric|abstract|null",
  "fit": "SLIM|REGULAR|RELAXED|OVERSIZED|TAILORED|CROPPED|null",
  "styleArchetypes": ["QUIET_LUXURY", "MINIMALIST", etc],
  "occasionTags": ["CASUAL", "BUSINESS_CASUAL", etc],
  "seasonTags": ["SPRING", "SUMMER", etc],
  "formality": 0.0-1.0,
  "versatilityScore": 0.0-1.0,
  "confidenceBoost": 0.0-1.0,
  "sustainabilityScore": 0.0-1.0,
  "estimatedValue": number in USD or null,
  "wearCondition": "PRISTINE|GOOD|FAIR|WORN|DAMAGED"
}`,
              },
            ],
          },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 800,
      });

      const result: AIEnrichmentResult = JSON.parse(
        response.choices[0].message.content || '{}'
      );

      await prisma.wardrobeItem.update({
        where: { id: itemId },
        data: {
          colorPrimary: result.colorPrimary,
          colorPalette: result.colorPalette || [],
          material: result.material || [],
          pattern: result.pattern,
          fit: result.fit as any,
          styleArchetypes: result.styleArchetypes as any[],
          occasionTags: result.occasionTags as any[],
          seasonTags: result.seasonTags as any[],
          formality: result.formality,
          versatilityScore: result.versatilityScore,
          confidenceBoost: result.confidenceBoost,
          sustainabilityScore: result.sustainabilityScore,
          estimatedCurrentValue: result.estimatedValue,
          wearCondition: result.wearCondition as any,
        },
      });

      // Generate embedding for semantic search
      await WardrobeAIService.generateItemEmbedding(itemId);

      pubsub.publish(`${EVENTS.WARDROBE_ANALYZED}:${itemId}`, { wardrobeItemAnalyzed: { id: itemId } });
      logger.info(`AI enrichment complete for item ${itemId}`);
    } catch (err) {
      logger.error(`AI enrichment failed for item ${itemId}`, err);
    }
  }

  static async generateItemEmbedding(itemId: string): Promise<void> {
    const item = await prisma.wardrobeItem.findUnique({ where: { id: itemId } });
    if (!item) return;

    const text = [
      item.name,
      item.brand,
      item.category,
      item.colorPrimary,
      item.material.join(' '),
      item.styleArchetypes.join(' '),
      item.occasionTags.join(' '),
      `formality:${item.formality}`,
      `versatility:${item.versatilityScore}`,
    ]
      .filter(Boolean)
      .join(' ');

    const response = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: text,
    });

    const embedding = response.data[0].embedding;
    await prisma.$executeRaw`
      UPDATE wardrobe_items
      SET ai_embedding = ${embedding}::vector
      WHERE id = ${itemId}::uuid
    `;
  }

  static async findSimilarItems(itemId: string, userId: string, limit = 5) {
    const results = await prisma.$queryRaw<Array<{ id: string; similarity: number }>>`
      SELECT id, 1 - (ai_embedding <=> (
        SELECT ai_embedding FROM wardrobe_items WHERE id = ${itemId}::uuid
      )) AS similarity
      FROM wardrobe_items
      WHERE user_id = ${userId}::uuid
        AND id != ${itemId}::uuid
        AND deleted_at IS NULL
      ORDER BY ai_embedding <=> (
        SELECT ai_embedding FROM wardrobe_items WHERE id = ${itemId}::uuid
      )
      LIMIT ${limit}
    `;
    return results;
  }
}
