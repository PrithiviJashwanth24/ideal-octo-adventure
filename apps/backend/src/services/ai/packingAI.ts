import OpenAI from 'openai';
import { prisma } from '../../config/database';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export class PackingAIService {
  static async generatePackingList(userId: string, input: {
    tripName: string;
    destination: string;
    startDate: string;
    endDate: string;
    tripType?: string;
    activities?: string[];
  }) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        wardrobeItems: {
          where: { deletedAt: null, isArchived: false, laundryStatus: 'CLEAN' },
          include: { images: true },
          take: 100,
        },
      },
    });
    if (!user) throw new Error('User not found');

    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const wardrobeSummary = user.wardrobeItems.map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      brand: item.brand,
      occasions: item.occasionTags,
      seasons: item.seasonTags,
      versatility: item.versatilityScore,
    }));

    const prompt = `You are FitCheck's Packing Intelligence system. Create the perfect capsule wardrobe for this trip.

Trip: ${input.tripName}
Destination: ${input.destination}
Duration: ${days} days (${startDate.toDateString()} to ${endDate.toDateString()})
Trip Type: ${input.tripType || 'general'}
Activities: ${input.activities?.join(', ') || 'general travel'}

User Style: ${user.profile?.styleArchetypes?.join(', ') || 'general'}
Available wardrobe items:
${JSON.stringify(wardrobeSummary.slice(0, 50), null, 2)}

Create a minimal, versatile packing list that:
1. Uses ONLY available wardrobe items (by ID)
2. Maximizes outfit combinations
3. Considers the destination climate and activities
4. Follows the capsule wardrobe principle (every item pairs with 3+ others)

Return JSON:
{
  "items": [
    {
      "wardrobeItemId": "uuid or null if generic",
      "name": "item name",
      "category": "ClothingCategory",
      "packed": false,
      "dayNumbers": [1, 2, 3]
    }
  ],
  "rationale": "Why this selection works for your trip"
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 1500,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    const packingList = await prisma.packingList.create({
      data: {
        userId,
        tripName: input.tripName,
        destination: input.destination,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        tripType: input.tripType as any,
        items: result.items || [],
        aiGenerated: true,
        aiRationale: result.rationale,
      },
    });

    return {
      ...packingList,
      items: (result.items || []).map((item: any) => ({
        wardrobeItem: user.wardrobeItems.find((w) => w.id === item.wardrobeItemId) || null,
        name: item.name,
        category: item.category,
        packed: false,
        dayNumbers: item.dayNumbers || [],
      })),
    };
  }
}
