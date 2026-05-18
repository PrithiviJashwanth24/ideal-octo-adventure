import OpenAI from 'openai';
import { prisma } from '../../config/database';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export class ShoppingAIService {
  static async detectWardrobeGaps(userId: string, limit = 5) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        wardrobeItems: { where: { deletedAt: null, isArchived: false }, take: 200 },
      },
    });
    if (!user) return [];

    const categoryCounts = user.wardrobeItems.reduce((acc: Record<string, number>, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {});

    const prompt = `You are FitCheck's shopping intelligence engine.

User's style: ${user.profile?.styleArchetypes?.join(', ') || 'general'}
Budget: ${user.profile?.budgetRange || 'MID'}
Category distribution: ${JSON.stringify(categoryCounts)}
Total items: ${user.wardrobeItems.length}

Identify the top ${limit} wardrobe gaps — missing essentials that would unlock the most outfit combinations.
For each gap, provide real-world product suggestions.

Return JSON array:
[
  {
    "gapType": "category name",
    "priority": 1-5,
    "reason": "why this gap hurts their style",
    "suggestions": [
      {
        "id": "unique_id",
        "name": "Product name",
        "brand": "Brand",
        "price": 0,
        "currency": "USD",
        "imageUrl": null,
        "productUrl": "https://example.com",
        "retailer": "Retailer name",
        "aiScore": 0.0-1.0,
        "aiReason": "why this specific product",
        "category": "ClothingCategory"
      }
    ]
  }
]`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 1500,
    });

    const result = JSON.parse(response.choices[0].message.content || '{"gaps":[]}');
    return Array.isArray(result) ? result : result.gaps || [];
  }
}
