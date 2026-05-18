import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database…');

  // Demo admin user
  const adminHash = await bcrypt.hash('FitCheck2025!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@fitcheck.ai' },
    update: {},
    create: {
      email: 'admin@fitcheck.ai',
      username: 'fitcheck_admin',
      displayName: 'FitCheck Admin',
      passwordHash: adminHash,
      emailVerified: true,
      isOnboarded: true,
      isPremium: true,
      premiumTier: 'LUXE',
      profile: {
        create: {
          styleArchetypes: ['QUIET_LUXURY', 'MINIMALIST'],
          budgetRange: 'LUXURY',
          luxuryAffinity: 0.9,
          preferredColors: ['#000000', '#FFFFFF', '#8B7355'],
          isPublic: true,
        },
      },
    },
  });

  // Demo test user
  const testHash = await bcrypt.hash('TestUser123!', 12);
  const testUser = await prisma.user.upsert({
    where: { email: 'demo@fitcheck.ai' },
    update: {},
    create: {
      email: 'demo@fitcheck.ai',
      username: 'styleseeker',
      displayName: 'Alex Rivera',
      passwordHash: testHash,
      emailVerified: true,
      isOnboarded: true,
      isPremium: true,
      premiumTier: 'STYLE',
      styleDna: {
        primaryArchetype: 'CLEAN_FIT',
        secondaryArchetypes: ['CORPORATE_ELITE', 'STREETWEAR'],
        colorPersonality: 'Neutral with bold accent moments',
        fashionAge: 'Sophisticated 27-year-old creative professional',
        strengths: ['Excellent at layering', 'Strong neutral palette', 'Good fit awareness'],
        opportunities: ['Incorporate more texture', 'Experiment with tailored pieces', 'Add statement accessories'],
        iconicComparisons: ['Ryan Gosling in Drive', 'David Beckham casual', 'Pharrell Williams'],
      },
      profile: {
        create: {
          heightCm: 180,
          bodyType: 'MESOMORPH',
          shirtSize: 'M',
          pantsSize: '32x32',
          shoeSize: 10,
          styleArchetypes: ['CLEAN_FIT', 'CORPORATE_ELITE'],
          budgetRange: 'PREMIUM',
          luxuryAffinity: 0.65,
          preferredColors: ['#1A1A1A', '#F5F5F0', '#8B7355'],
          isPublic: true,
          allowFeedback: true,
        },
      },
    },
  });

  // Seed sample wardrobe items
  const sampleItems = [
    {
      name: 'Classic White Oxford',
      brand: 'Ralph Lauren',
      category: 'TOPS' as const,
      colorPrimary: '#FFFFFF',
      colorPalette: ['#FFFFFF', '#F5F5F0'],
      material: ['Cotton', '100% Pima Cotton'],
      fit: 'TAILORED' as const,
      styleArchetypes: ['OLD_MONEY', 'CORPORATE_ELITE', 'CLEAN_FIT'] as any[],
      occasionTags: ['BUSINESS_CASUAL', 'FORMAL', 'EVERYDAY', 'DATE_NIGHT'] as any[],
      seasonTags: ['SPRING', 'SUMMER', 'FALL'] as any[],
      formality: 0.7,
      versatilityScore: 0.95,
      confidenceBoost: 0.82,
      sustainabilityScore: 0.6,
      purchasePrice: 185,
      estimatedCurrentValue: 150,
      wearCount: 47,
      laundryStatus: 'CLEAN' as const,
    },
    {
      name: 'Navy Slim Chinos',
      brand: 'Incotex',
      category: 'BOTTOMS' as const,
      colorPrimary: '#1B2A4A',
      colorPalette: ['#1B2A4A', '#243756'],
      material: ['Cotton', 'Stretch'],
      fit: 'SLIM' as const,
      styleArchetypes: ['CORPORATE_ELITE', 'CLEAN_FIT', 'PREPPY'] as any[],
      occasionTags: ['BUSINESS_CASUAL', 'CASUAL', 'DATE_NIGHT'] as any[],
      seasonTags: ['SPRING', 'FALL'] as any[],
      formality: 0.55,
      versatilityScore: 0.88,
      confidenceBoost: 0.75,
      sustainabilityScore: 0.55,
      purchasePrice: 280,
      estimatedCurrentValue: 200,
      wearCount: 38,
      laundryStatus: 'CLEAN' as const,
    },
    {
      name: 'White Leather Sneakers',
      brand: 'Common Projects',
      category: 'SNEAKERS' as const,
      colorPrimary: '#FAFAFA',
      colorPalette: ['#FAFAFA', '#E8E8E8'],
      material: ['Leather'],
      styleArchetypes: ['MINIMALIST', 'CLEAN_FIT', 'OLD_MONEY'] as any[],
      occasionTags: ['CASUAL', 'BUSINESS_CASUAL', 'DATE_NIGHT', 'EVERYDAY'] as any[],
      seasonTags: ['SPRING', 'SUMMER', 'FALL'] as any[],
      formality: 0.3,
      versatilityScore: 0.92,
      confidenceBoost: 0.88,
      sustainabilityScore: 0.4,
      purchasePrice: 490,
      estimatedCurrentValue: 380,
      wearCount: 89,
      laundryStatus: 'CLEAN' as const,
    },
    {
      name: 'Camel Overcoat',
      brand: 'Loro Piana',
      category: 'OUTERWEAR' as const,
      colorPrimary: '#C19A6B',
      colorPalette: ['#C19A6B', '#A0784A'],
      material: ['Cashmere', 'Wool'],
      fit: 'REGULAR' as const,
      styleArchetypes: ['QUIET_LUXURY', 'OLD_MONEY', 'MINIMALIST'] as any[],
      occasionTags: ['BUSINESS_CASUAL', 'FORMAL', 'CASUAL', 'DATE_NIGHT'] as any[],
      seasonTags: ['FALL', 'WINTER'] as any[],
      formality: 0.75,
      versatilityScore: 0.85,
      confidenceBoost: 0.92,
      sustainabilityScore: 0.7,
      purchasePrice: 3800,
      estimatedCurrentValue: 3200,
      wearCount: 22,
      laundryStatus: 'CLEAN' as const,
      isFavorite: true,
    },
  ];

  for (const item of sampleItems) {
    await prisma.wardrobeItem.create({
      data: {
        ...item,
        userId: testUser.id,
        images: {
          create: [{ url: `https://picsum.photos/seed/${item.name.replace(/\s/g, '')}/400/600`, s3Key: 'placeholder', isPrimary: true }],
        },
      },
    });
  }

  console.log(`✅ Seeded admin user: ${admin.email}`);
  console.log(`✅ Seeded demo user: ${testUser.email} with ${sampleItems.length} wardrobe items`);
  console.log('🚀 Database ready for FitCheck!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
