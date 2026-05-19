export type ClothingCategory =
  | 'TOPS' | 'BOTTOMS' | 'OUTERWEAR' | 'DRESSES' | 'SUITS'
  | 'SHOES' | 'BAGS' | 'ACCESSORIES' | 'ACTIVEWEAR' | 'SWIMWEAR'
  | 'UNDERWEAR' | 'SLEEPWEAR' | 'FORMAL' | 'WORKWEAR' | 'CASUAL';

export type FormalityLevel = 'ULTRA_CASUAL' | 'CASUAL' | 'SMART_CASUAL' | 'BUSINESS_CASUAL' | 'BUSINESS' | 'FORMAL' | 'BLACK_TIE';

export type StyleArchetype =
  | 'QUIET_LUXURY' | 'STREETWEAR' | 'OLD_MONEY' | 'MINIMALIST'
  | 'CORPORATE_ELITE' | 'TECHWEAR' | 'CLEAN_FIT' | 'CREATIVE_DIRECTOR'
  | 'ATHLEISURE' | 'BOHEMIAN' | 'PREPPY' | 'EDGY' | 'COASTAL' | 'DARK_ACADEMIA';

export type Mood = 'CONFIDENT' | 'CALM' | 'CREATIVE' | 'POWERFUL' | 'PLAYFUL' | 'ROMANTIC' | 'FOCUSED' | 'REBELLIOUS' | 'ELEVATED';

export type Season = 'SPRING' | 'SUMMER' | 'FALL' | 'WINTER' | 'ALL_SEASON';

export type LaundryStatus = 'CLEAN' | 'WORN' | 'DIRTY' | 'IN_LAUNDRY' | 'DRY_CLEAN_NEEDED';

export type SubscriptionTier = 'FREE' | 'ESSENTIAL' | 'STYLE' | 'LUXE';

export interface WardrobeItemCore {
  id: string;
  name: string;
  category: ClothingCategory;
  brand?: string;
  colorPrimary: string;
  formality: FormalityLevel;
  season: Season[];
  imageUrls: string[];
  wearCount: number;
  versatilityScore: number;
  confidenceBoost: number;
  laundryStatus: LaundryStatus;
  isFavorite: boolean;
}

export interface OutfitCore {
  id: string;
  name: string;
  archetype: string;
  occasion: string[];
  season: string;
  items: Array<{ wardrobeItem: WardrobeItemCore; position: number }>;
  wearCount: number;
  rating?: number;
}

export interface UserStyleProfile {
  primaryArchetype: StyleArchetype;
  secondaryArchetypes: StyleArchetype[];
  colorPalette: string[];
  formalityRange: [FormalityLevel, FormalityLevel];
  strengths: string[];
  signature: string;
}

export interface AIRecommendationSet {
  safe: OutfitCore;
  statement: OutfitCore;
  stealthLuxury: OutfitCore;
  dateNight: OutfitCore;
  boardroom: OutfitCore;
}

export interface ConfidencePrediction {
  predictedScore: number;
  explanation: string;
  boosters: string[];
  detractors: string[];
  suggestions: string[];
}

export interface TrendPrediction {
  trend: string;
  momentum: 'rising' | 'peak' | 'declining';
  relevanceToUser: number;
  adoptionAdvice: string;
  keyPieces: string[];
  timeframe: string;
}
