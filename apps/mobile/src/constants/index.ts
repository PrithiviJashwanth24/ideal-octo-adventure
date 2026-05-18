export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';
export const GRAPHQL_URL = `${API_URL}/graphql`;
export const WS_URL = (process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:4000') + '/graphql';

export const APP_VERSION = '1.0.0';
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'fitcheck:access_token',
  REFRESH_TOKEN: 'fitcheck:refresh_token',
  USER_ID: 'fitcheck:user_id',
  ONBOARDING_COMPLETE: 'fitcheck:onboarding_complete',
  THEME: 'fitcheck:theme',
} as const;

export const OCCASION_LABELS: Record<string, string> = {
  CASUAL: 'Casual',
  BUSINESS_CASUAL: 'Business Casual',
  FORMAL: 'Formal',
  BUSINESS_FORMAL: 'Business Formal',
  DATE_NIGHT: 'Date Night',
  WEDDING: 'Wedding',
  PARTY: 'Party',
  BEACH: 'Beach',
  TRAVEL: 'Travel',
  GYM: 'Gym',
  OUTDOOR: 'Outdoor',
  FESTIVE: 'Festive',
  COCKTAIL: 'Cocktail',
  GALA: 'Gala',
  EVERYDAY: 'Everyday',
};

export const ARCHETYPE_LABELS: Record<string, string> = {
  QUIET_LUXURY: 'Quiet Luxury',
  STREETWEAR: 'Streetwear',
  OLD_MONEY: 'Old Money',
  MINIMALIST: 'Minimalist',
  CORPORATE_ELITE: 'Corporate Elite',
  TECHWEAR: 'Techwear',
  CLEAN_FIT: 'Clean Fit',
  CREATIVE_DIRECTOR: 'Creative Director',
  ATHLEISURE: 'Athleisure',
  BOHEMIAN: 'Bohemian',
  PREPPY: 'Preppy',
  EDGY: 'Edgy',
  COASTAL: 'Coastal',
  DARK_ACADEMIA: 'Dark Academia',
};

export const CATEGORY_LABELS: Record<string, string> = {
  TOPS: 'Tops',
  BOTTOMS: 'Bottoms',
  OUTERWEAR: 'Outerwear',
  DRESSES_SKIRTS: 'Dresses & Skirts',
  SUITS_BLAZERS: 'Suits & Blazers',
  ACTIVEWEAR: 'Activewear',
  SHOES: 'Shoes',
  BOOTS: 'Boots',
  SNEAKERS: 'Sneakers',
  SANDALS: 'Sandals',
  ACCESSORIES: 'Accessories',
  WATCHES: 'Watches',
  JEWELRY: 'Jewelry',
  CHAINS: 'Chains',
  BAGS: 'Bags',
  WALLETS: 'Wallets',
  BELTS: 'Belts',
  HATS_CAPS: 'Hats & Caps',
  SCARVES_TIES: 'Scarves & Ties',
  SUNGLASSES: 'Sunglasses',
  SOCKS_HOSIERY: 'Socks & Hosiery',
  UNDERWEAR: 'Underwear',
  SWIMWEAR: 'Swimwear',
  SLEEPWEAR: 'Sleepwear',
  ETHNIC_WEAR: 'Ethnic Wear',
  PERFUMES_FRAGRANCES: 'Fragrances',
};
