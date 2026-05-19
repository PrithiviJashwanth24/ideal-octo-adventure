import OpenAI from 'openai';
import { prisma } from '../../config/database';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export type Mood =
  | 'CONFIDENT'
  | 'CALM'
  | 'CREATIVE'
  | 'POWERFUL'
  | 'PLAYFUL'
  | 'ROMANTIC'
  | 'FOCUSED'
  | 'REBELLIOUS'
  | 'ELEVATED';

export interface MoodOutfit {
  mood: Mood;
  itemIds: string[];
  colorStrategy: string;
  psychologicalEffect: string;
  rationale: string;
}

const MOOD_PSYCHOLOGY: Record<Mood, string> = {
  CONFIDENT: 'Dark, saturated colors; structured silhouettes; minimal accessories. Power dressing activates assertiveness.',
  CALM: 'Soft neutrals, flowing fabrics, natural materials. Reduces cortisol, promotes serenity.',
  CREATIVE: 'Unexpected color combinations, textural contrast, statement pieces. Signals open-minded cognition.',
  POWERFUL: 'Monochromatic dressing, sharp tailoring, luxury materials. Commands attention without seeking it.',
  PLAYFUL: 'Color blocking, pattern mixing, whimsical accessories. Signals approachability and spontaneity.',
  ROMANTIC: 'Softer silhouettes, warm tones, sensory fabrics. Creates emotional vulnerability and attraction.',
  FOCUSED: 'Streamlined, minimal, no distractions. Decision fatigue reduction — like Steve Jobs uniforms.',
  REBELLIOUS: 'Rule-breaking combinations, unexpected scale, anti-establishment signals. Disrupts social norms.',
  ELEVATED: 'Quiet luxury signals, understated quality, effortless polish. Old money energy without effort.',
};

export class MoodDressingAI {
  static async generateMoodOutfit(userId: string, mood: Mood): Promise<MoodOutfit> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        wardrobeItems: {
          where: { deletedAt: null, isArchived: false, laundryStatus: 'CLEAN' },
          take: 80,
          orderBy: { versatilityScore: 'desc' },
        },
      },
    });

    if (!user) throw new Error('User not found');

    const moodPsychology = MOOD_PSYCHOLOGY[mood];

    const prompt = `You are FitCheck's Mood Dressing Intelligence Engine.

Mood requested: ${mood}
Psychology of this mood in clothing: ${moodPsychology}

User's body type: ${user.profile?.bodyType || 'not specified'}
User's style archetype: ${(user.styleDna as any)?.primaryArchetype || 'general'}

Available wardrobe items:
${user.wardrobeItems.map((i) => `ID:${i.id} | ${i.name} | ${i.category} | color:${i.colorPrimary} | formality:${i.formality} | fit:${i.fit}`).join('\n')}

Select items that will create the most psychologically effective "${mood}" outfit.

Return JSON:
{
  "itemIds": ["id1", "id2", ...],
  "colorStrategy": "explanation of the color psychology being used",
  "psychologicalEffect": "what wearing this will do to how you feel and how others perceive you",
  "rationale": "detailed styling rationale with specific references to items chosen"
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 700,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      mood,
      itemIds: result.itemIds || [],
      colorStrategy: result.colorStrategy || '',
      psychologicalEffect: result.psychologicalEffect || '',
      rationale: result.rationale || '',
    };
  }

  static getMoodOptions(): Array<{ mood: Mood; label: string; emoji: string; description: string }> {
    return [
      { mood: 'CONFIDENT', label: 'Confident', emoji: '⚡', description: 'You own the room' },
      { mood: 'POWERFUL', label: 'Powerful', emoji: '🏛', description: 'Command respect silently' },
      { mood: 'CALM', label: 'Calm', emoji: '🌊', description: 'Peaceful, grounded energy' },
      { mood: 'CREATIVE', label: 'Creative', emoji: '🎨', description: 'Express your originality' },
      { mood: 'PLAYFUL', label: 'Playful', emoji: '✨', description: 'Light, fun, approachable' },
      { mood: 'ROMANTIC', label: 'Romantic', emoji: '🌙', description: 'Warm and emotionally open' },
      { mood: 'FOCUSED', label: 'Focused', emoji: '◎', description: 'Eliminate decision fatigue' },
      { mood: 'ELEVATED', label: 'Elevated', emoji: '💎', description: 'Quiet luxury, effortless' },
      { mood: 'REBELLIOUS', label: 'Rebellious', emoji: '🔥', description: 'Break the rules intentionally' },
    ];
  }
}
