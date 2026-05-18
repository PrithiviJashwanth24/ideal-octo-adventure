import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  scalar DateTime
  scalar JSON
  scalar Upload

  # ─── AUTH ───────────────────────────────────────────────
  type AuthPayload {
    accessToken: String!
    refreshToken: String!
    user: User!
  }

  input RegisterInput {
    email: String!
    password: String!
    username: String!
    displayName: String!
  }

  input LoginInput {
    email: String!
    password: String!
    deviceId: String
  }

  # ─── USER ───────────────────────────────────────────────
  type User {
    id: ID!
    email: String!
    username: String!
    displayName: String!
    avatarUrl: String
    bio: String
    isPremium: Boolean!
    premiumTier: PremiumTier!
    isOnboarded: Boolean!
    styleDna: JSON
    bodyProfile: JSON
    profile: UserProfile
    styleEmbedding: StyleEmbedding
    wardrobeItems(
      category: ClothingCategory
      limit: Int
      offset: Int
    ): [WardrobeItem!]!
    wardrobeStats: WardrobeStats!
    outfits(limit: Int, offset: Int): [Outfit!]!
    recentOutfitLogs(limit: Int): [OutfitLog!]!
    followerCount: Int!
    followingCount: Int!
    createdAt: DateTime!
  }

  type UserProfile {
    id: ID!
    heightCm: Float
    weightKg: Float
    bodyType: BodyType
    skinTone: String
    shirtSize: String
    pantsSize: String
    shoeSize: Float
    styleArchetypes: [StyleArchetype!]!
    preferredColors: [String!]!
    avoidedColors: [String!]!
    preferredFits: [FitType!]!
    budgetRange: BudgetRange!
    luxuryAffinity: Float!
    isPublic: Boolean!
    allowFeedback: Boolean!
  }

  type StyleEmbedding {
    id: ID!
    version: Int!
    lastComputedAt: DateTime!
    metadata: JSON
  }

  # ─── WARDROBE ───────────────────────────────────────────
  type WardrobeItem {
    id: ID!
    name: String!
    brand: String
    category: ClothingCategory!
    subcategory: String
    colorPrimary: String
    colorPalette: [String!]!
    pattern: String
    material: [String!]!
    fit: FitType
    styleArchetypes: [StyleArchetype!]!
    occasionTags: [OccasionTag!]!
    seasonTags: [SeasonTag!]!
    formality: Float!
    versatilityScore: Float!
    confidenceBoost: Float!
    sustainabilityScore: Float!
    purchasePrice: Float
    estimatedCurrentValue: Float
    currency: String!
    purchasedAt: DateTime
    purchasedFrom: String
    images: [WardrobeItemImage!]!
    thumbnailUrl: String
    wearCount: Int!
    lastWornAt: DateTime
    emotionalAttachment: Float!
    resaleScore: Float!
    wearCondition: WearCondition!
    replacementUrgency: Float!
    socialFreshnessScore: Float!
    isFavorite: Boolean!
    isArchived: Boolean!
    laundryStatus: LaundryStatus!
    storageLocation: String
    notes: String
    costPerWear: Float
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type WardrobeItemImage {
    id: ID!
    url: String!
    isPrimary: Boolean!
    angle: ImageAngle!
  }

  type WardrobeStats {
    totalItems: Int!
    totalValue: Float!
    utilizationRate: Float!
    mostWornCategory: String
    mostWornBrand: String
    neglectedItemCount: Int!
    totalWearEvents: Int!
    avgCostPerWear: Float!
    diversityScore: Float!
    sustainabilityScore: Float!
    closetHealthScore: Float!
  }

  # ─── OUTFIT ─────────────────────────────────────────────
  type Outfit {
    id: ID!
    name: String
    description: String
    items: [WardrobeItem!]!
    occasionTag: OccasionTag
    seasonTag: SeasonTag
    mood: String
    aiGenerated: Boolean!
    aiRationale: String
    confidenceScore: Float
    attractivenessScore: Float
    formalityScore: Float
    thumbnailUrl: String
    isSaved: Boolean!
    isPublic: Boolean!
    viewCount: Int!
    likeCount: Int!
    createdAt: DateTime!
  }

  type OutfitLog {
    id: ID!
    outfit: Outfit
    wornAt: DateTime!
    eventName: String
    eventType: OccasionTag
    location: String
    photoUrl: String
    socialPosted: Boolean!
    confidenceRating: Int
    complimentsReceived: Int!
    weatherTemp: Float
    weatherCondition: String
    notes: String
  }

  type OutfitRecommendationSet {
    safe: Outfit
    statement: Outfit
    stealthLuxury: Outfit
    dateNight: Outfit
    boardroom: Outfit
    airport: Outfit
    rationale: String!
    contextUsed: JSON!
  }

  # ─── AI STYLIST ─────────────────────────────────────────
  type AIStyleChat {
    id: ID!
    response: String!
    outfitSuggestions: [Outfit!]
    actionItems: [String!]
    insights: JSON
  }

  type StyleDNAAnalysis {
    primaryArchetype: StyleArchetype!
    secondaryArchetypes: [StyleArchetype!]!
    confidenceProfile: JSON!
    colorPersonality: String!
    fashionAge: String!
    strengths: [String!]!
    opportunities: [String!]!
    iconicComparisons: [String!]!
  }

  # ─── ANALYTICS ──────────────────────────────────────────
  type WardrobeReport {
    period: String!
    utilizationRate: Float!
    topItems: [WardrobeItem!]!
    neglectedItems: [WardrobeItem!]!
    costPerWear: Float!
    outfitDiversityScore: Float!
    sustainabilityScore: Float!
    insights: [String!]!
    recommendations: [String!]!
  }

  type ConfidenceScore {
    overall: Float!
    byOccasion: JSON!
    trend: [Float!]!
    topBoostingItems: [WardrobeItem!]!
  }

  # ─── SHOPPING ───────────────────────────────────────────
  type ShoppingRecommendation {
    gapType: String!
    priority: Int!
    reason: String!
    suggestions: [ProductSuggestion!]!
  }

  type ProductSuggestion {
    id: ID!
    name: String!
    brand: String
    price: Float
    currency: String!
    imageUrl: String
    productUrl: String!
    retailer: String!
    aiScore: Float!
    aiReason: String!
    category: ClothingCategory!
  }

  # ─── SOCIAL ─────────────────────────────────────────────
  type FeedItem {
    id: ID!
    user: User!
    outfit: Outfit
    log: OutfitLog
    imageUrl: String
    caption: String
    likeCount: Int!
    commentCount: Int!
    createdAt: DateTime!
  }

  # ─── PACKING ────────────────────────────────────────────
  type PackingList {
    id: ID!
    tripName: String!
    destination: String
    startDate: DateTime!
    endDate: DateTime!
    tripType: OccasionTag
    items: [PackingItem!]!
    aiGenerated: Boolean!
    aiRationale: String
    createdAt: DateTime!
  }

  type PackingItem {
    wardrobeItem: WardrobeItem
    name: String!
    category: ClothingCategory!
    packed: Boolean!
    dayNumbers: [Int!]!
  }

  # ─── ENUMS ──────────────────────────────────────────────
  enum PremiumTier { FREE ESSENTIAL STYLE LUXE }
  enum BodyType { ECTOMORPH MESOMORPH ENDOMORPH PEAR APPLE HOURGLASS RECTANGLE INVERTED_TRIANGLE }
  enum StyleArchetype { QUIET_LUXURY STREETWEAR OLD_MONEY MINIMALIST CORPORATE_ELITE TECHWEAR CLEAN_FIT CREATIVE_DIRECTOR ATHLEISURE BOHEMIAN PREPPY EDGY COASTAL DARK_ACADEMIA }
  enum FitType { SLIM REGULAR RELAXED OVERSIZED TAILORED CROPPED }
  enum BudgetRange { BUDGET MID PREMIUM LUXURY ULTRA_LUXURY }
  enum ClothingCategory { TOPS BOTTOMS OUTERWEAR DRESSES_SKIRTS SUITS_BLAZERS ACTIVEWEAR SHOES BOOTS SNEAKERS SANDALS ACCESSORIES WATCHES JEWELRY CHAINS BAGS WALLETS BELTS HATS_CAPS SCARVES_TIES SUNGLASSES SOCKS_HOSIERY UNDERWEAR SWIMWEAR SLEEPWEAR ETHNIC_WEAR PERFUMES_FRAGRANCES }
  enum OccasionTag { CASUAL BUSINESS_CASUAL FORMAL BUSINESS_FORMAL DATE_NIGHT WEDDING PARTY BEACH TRAVEL GYM OUTDOOR FESTIVE COCKTAIL GALA EVERYDAY }
  enum SeasonTag { SPRING SUMMER FALL WINTER ALL_SEASON }
  enum WearCondition { PRISTINE GOOD FAIR WORN DAMAGED }
  enum LaundryStatus { CLEAN DIRTY IN_WASH DRYING }
  enum ImageAngle { FRONT BACK SIDE DETAIL FLAT_LAY ON_BODY }

  # ─── QUERIES ────────────────────────────────────────────
  type Query {
    me: User
    user(id: ID!): User
    wardrobeItem(id: ID!): WardrobeItem
    wardrobeItems(
      category: ClothingCategory
      brand: String
      occasion: OccasionTag
      season: SeasonTag
      isFavorite: Boolean
      isArchived: Boolean
      limit: Int
      offset: Int
    ): [WardrobeItem!]!
    outfit(id: ID!): Outfit
    outfits(limit: Int, offset: Int): [Outfit!]!
    outfitRecommendations(
      occasion: OccasionTag
      eventDate: DateTime
      weatherTemp: Float
      weatherCondition: String
    ): OutfitRecommendationSet!
    wardrobeReport(period: String): WardrobeReport!
    wardrobeStats: WardrobeStats!
    styleDNAAnalysis: StyleDNAAnalysis!
    shoppingRecommendations(limit: Int): [ShoppingRecommendation!]!
    confidenceScore: ConfidenceScore!
    socialFeed(limit: Int, offset: Int): [FeedItem!]!
    packingLists: [PackingList!]!
    packingList(id: ID!): PackingList
  }

  # ─── MUTATIONS ──────────────────────────────────────────
  type Mutation {
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    refreshToken(token: String!): AuthPayload!
    logout(refreshToken: String!): Boolean!

    updateProfile(input: UpdateProfileInput!): User!
    completeOnboarding(input: OnboardingInput!): User!

    addWardrobeItem(input: AddWardrobeItemInput!): WardrobeItem!
    updateWardrobeItem(id: ID!, input: UpdateWardrobeItemInput!): WardrobeItem!
    deleteWardrobeItem(id: ID!): Boolean!
    archiveWardrobeItem(id: ID!): WardrobeItem!
    toggleFavorite(id: ID!): WardrobeItem!
    updateLaundryStatus(id: ID!, status: LaundryStatus!): WardrobeItem!

    logOutfit(input: LogOutfitInput!): OutfitLog!
    saveOutfit(input: SaveOutfitInput!): Outfit!
    deleteOutfit(id: ID!): Boolean!

    chatWithStylist(message: String!, sessionId: String): AIStyleChat!
    generatePackingList(input: PackingListInput!): PackingList!
    computeStyleDNA: StyleDNAAnalysis!

    followUser(userId: ID!): Boolean!
    unfollowUser(userId: ID!): Boolean!
    rateOutfit(outfitId: ID!, rating: Int!, tags: [String!], comment: String): OutfitReview!

    addToWishlist(wishlistId: ID!, input: WishlistItemInput!): Boolean!
    createWishlist(name: String!): ShoppingWishlist!
  }

  type ShoppingWishlist {
    id: ID!
    name: String!
    isPublic: Boolean!
    createdAt: DateTime!
  }

  type OutfitReview {
    id: ID!
    rating: Int!
    tags: [String!]!
    comment: String
    createdAt: DateTime!
  }

  # ─── SUBSCRIPTIONS ──────────────────────────────────────
  type Subscription {
    outfitRecommendationReady(userId: ID!): Outfit
    notificationReceived(userId: ID!): Notification
    wardrobeItemAnalyzed(itemId: ID!): WardrobeItem
  }

  type Notification {
    id: ID!
    type: String!
    title: String!
    body: String!
    data: JSON
    createdAt: DateTime!
  }

  # ─── INPUTS ─────────────────────────────────────────────
  input UpdateProfileInput {
    displayName: String
    bio: String
    avatarUrl: String
    heightCm: Float
    weightKg: Float
    bodyType: BodyType
    shirtSize: String
    pantsSize: String
    shoeSize: Float
    styleArchetypes: [StyleArchetype!]
    preferredColors: [String!]
    budgetRange: BudgetRange
    isPublic: Boolean
  }

  input OnboardingInput {
    bodyType: BodyType!
    styleArchetypes: [StyleArchetype!]!
    budgetRange: BudgetRange!
    preferredColors: [String!]!
    occasions: [OccasionTag!]!
    importFromInstagram: Boolean
  }

  input AddWardrobeItemInput {
    name: String!
    brand: String
    category: ClothingCategory!
    subcategory: String
    colorPrimary: String
    material: [String!]
    fit: FitType
    purchasePrice: Float
    currency: String
    purchasedAt: DateTime
    purchasedFrom: String
    notes: String
    imageUrls: [String!]!
  }

  input UpdateWardrobeItemInput {
    name: String
    brand: String
    category: ClothingCategory
    colorPrimary: String
    fit: FitType
    purchasePrice: Float
    notes: String
    isFavorite: Boolean
    storageLocation: String
  }

  input LogOutfitInput {
    outfitId: ID
    wornAt: DateTime!
    eventName: String
    eventType: OccasionTag
    location: String
    photoUrl: String
    socialPosted: Boolean
    confidenceRating: Int
    notes: String
  }

  input SaveOutfitInput {
    wardrobeItemIds: [ID!]!
    name: String
    occasionTag: OccasionTag
    mood: String
    isPublic: Boolean
  }

  input PackingListInput {
    tripName: String!
    destination: String!
    startDate: DateTime!
    endDate: DateTime!
    tripType: OccasionTag
    activities: [String!]
  }

  input WishlistItemInput {
    productName: String!
    productBrand: String
    productUrl: String
    productImageUrl: String
    price: Float
    currency: String
    aiReason: String
    priority: Int
  }
`;
