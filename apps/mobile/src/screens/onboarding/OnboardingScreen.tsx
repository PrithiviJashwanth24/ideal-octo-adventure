import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { GoldButton } from '../../components/common/GoldButton';
import { GlassCard } from '../../components/common/GlassCard';
import { gqlRequest } from '../../services/graphql';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { updateUser } from '../../store/slices/authSlice';

const { width } = Dimensions.get('window');

const ARCHETYPE_DATA = [
  { key: 'QUIET_LUXURY', label: 'Quiet Luxury', icon: '🤍', desc: 'Understated. Timeless. Premium.' },
  { key: 'OLD_MONEY', label: 'Old Money', icon: '🏛', desc: 'Heritage. Classic. Inherited taste.' },
  { key: 'STREETWEAR', label: 'Streetwear', icon: '🔥', desc: 'Cultural. Bold. Unapologetic.' },
  { key: 'MINIMALIST', label: 'Minimalist', icon: '◻', desc: 'Clean. Intentional. Essential.' },
  { key: 'CORPORATE_ELITE', label: 'Corporate Elite', icon: '💼', desc: 'Powerful. Authoritative. Sharp.' },
  { key: 'CREATIVE_DIRECTOR', label: 'Creative', icon: '🎨', desc: 'Original. Expressive. Fearless.' },
  { key: 'ATHLEISURE', label: 'Athleisure', icon: '⚡', desc: 'Active. Functional. Confident.' },
  { key: 'DARK_ACADEMIA', label: 'Dark Academia', icon: '📚', desc: 'Intellectual. Moody. Aesthetic.' },
];

const BUDGET_DATA = [
  { key: 'BUDGET', label: 'Budget-Friendly', desc: 'Under $100 per item' },
  { key: 'MID', label: 'Mid-Range', desc: '$100–$500 per item' },
  { key: 'PREMIUM', label: 'Premium', desc: '$500–$2,000 per item' },
  { key: 'LUXURY', label: 'Luxury', desc: '$2,000+ per item' },
];

const OCCASION_DATA = ['CASUAL', 'BUSINESS_CASUAL', 'FORMAL', 'DATE_NIGHT', 'GYM', 'TRAVEL', 'WEDDING', 'PARTY'];

const COMPLETE_ONBOARDING = `
  mutation CompleteOnboarding($input: OnboardingInput!) {
    completeOnboarding(input: $input) {
      id isOnboarded styleDna
      profile { styleArchetypes budgetRange }
    }
  }
`;

export function OnboardingScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const [step, setStep] = useState(0);
  const [selectedArchetypes, setSelectedArchetypes] = useState<string[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<string>('MID');
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>(['CASUAL', 'EVERYDAY']);
  const [isLoading, setIsLoading] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const STEPS = ['Welcome', 'Style Archetypes', 'Budget', 'Occasions', 'Done'];

  const animateProgress = (nextStep: number) => {
    Animated.spring(progressAnim, {
      toValue: nextStep / (STEPS.length - 1),
      useNativeDriver: false,
      tension: 100,
    }).start();
  };

  const nextStep = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = step + 1;
    setStep(next);
    animateProgress(next);
  };

  const toggleArchetype = (key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedArchetypes((prev) =>
      prev.includes(key) ? prev.filter((a) => a !== key) : [...prev.slice(0, 2), key]
    );
  };

  const toggleOccasion = (key: string) => {
    setSelectedOccasions((prev) =>
      prev.includes(key) ? prev.filter((o) => o !== key) : [...prev, key]
    );
  };

  const completeOnboarding = async () => {
    setIsLoading(true);
    try {
      const data = await gqlRequest<{ completeOnboarding: any }>(COMPLETE_ONBOARDING, {
        input: {
          bodyType: 'MESOMORPH',
          styleArchetypes: selectedArchetypes.length ? selectedArchetypes : ['MINIMALIST'],
          budgetRange: selectedBudget,
          preferredColors: [],
          occasions: selectedOccasions,
        },
      });
      dispatch(updateUser({ isOnboarded: true, styleDna: data.completeOnboarding.styleDna }));
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient colors={['rgba(212,175,55,0.05)', 'transparent']} style={styles.bgGlow} />

      {/* Progress */}
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
      </View>

      {step === 0 && (
        <View style={styles.stepContainer}>
          <View style={styles.welcomeContent}>
            <Text style={styles.welcomeIcon}>✦</Text>
            <Text style={styles.welcomeTitle}>Welcome to{'\n'}FitCheck.</Text>
            <Text style={styles.welcomeSubtitle}>
              Your AI-powered Personal Appearance Operating System.
            </Text>
            <Text style={styles.welcomeBody}>
              We're about to transform how you relate to your wardrobe. Every outfit, every decision — optimized by AI.
            </Text>
          </View>
          <GoldButton title="Begin Setup →" onPress={nextStep} fullWidth size="lg" />
        </View>
      )}

      {step === 1 && (
        <View style={styles.stepContainer}>
          <Text style={styles.stepLabel}>STEP 1 OF 3</Text>
          <Text style={styles.stepTitle}>Your Style Archetype</Text>
          <Text style={styles.stepSubtitle}>Select up to 3 that resonate with your aesthetic.</Text>
          <ScrollView contentContainerStyle={styles.archetypeGrid} showsVerticalScrollIndicator={false}>
            {ARCHETYPE_DATA.map((arch) => (
              <TouchableOpacity
                key={arch.key}
                onPress={() => toggleArchetype(arch.key)}
                style={styles.archetypeItem}
              >
                <GlassCard
                  style={[styles.archetypeCard, selectedArchetypes.includes(arch.key) && styles.archetypeCardActive]}
                  variant={selectedArchetypes.includes(arch.key) ? 'gold' : 'dark'}
                >
                  <View style={styles.archetypeCardInner}>
                    <Text style={styles.archetypeIcon}>{arch.icon}</Text>
                    <Text style={[styles.archetypeLabel, selectedArchetypes.includes(arch.key) && styles.archetypeLabelActive]}>
                      {arch.label}
                    </Text>
                    <Text style={styles.archetypeDesc}>{arch.desc}</Text>
                    {selectedArchetypes.includes(arch.key) && (
                      <View style={styles.archetypeCheck}>
                        <Text style={styles.archetypeCheckText}>✓</Text>
                      </View>
                    )}
                  </View>
                </GlassCard>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <GoldButton
            title="Continue →"
            onPress={nextStep}
            fullWidth
            disabled={selectedArchetypes.length === 0}
          />
        </View>
      )}

      {step === 2 && (
        <View style={styles.stepContainer}>
          <Text style={styles.stepLabel}>STEP 2 OF 3</Text>
          <Text style={styles.stepTitle}>Your Budget Range</Text>
          <Text style={styles.stepSubtitle}>We'll tailor shopping recommendations to match.</Text>
          <View style={styles.budgetList}>
            {BUDGET_DATA.map((b) => (
              <TouchableOpacity key={b.key} onPress={() => setSelectedBudget(b.key)}>
                <GlassCard
                  style={[styles.budgetCard, selectedBudget === b.key && styles.budgetCardActive]}
                  variant={selectedBudget === b.key ? 'gold' : 'dark'}
                >
                  <View style={styles.budgetCardInner}>
                    <View>
                      <Text style={[styles.budgetLabel, selectedBudget === b.key && styles.budgetLabelActive]}>
                        {b.label}
                      </Text>
                      <Text style={styles.budgetDesc}>{b.desc}</Text>
                    </View>
                    {selectedBudget === b.key && <Text style={styles.budgetCheck}>✓</Text>}
                  </View>
                </GlassCard>
              </TouchableOpacity>
            ))}
          </View>
          <GoldButton title="Continue →" onPress={nextStep} fullWidth />
        </View>
      )}

      {step === 3 && (
        <View style={styles.stepContainer}>
          <Text style={styles.stepLabel}>STEP 3 OF 3</Text>
          <Text style={styles.stepTitle}>Your Lifestyle</Text>
          <Text style={styles.stepSubtitle}>What occasions do you dress for most?</Text>
          <View style={styles.occasionGrid}>
            {OCCASION_DATA.map((occ) => (
              <TouchableOpacity
                key={occ}
                onPress={() => toggleOccasion(occ)}
                style={[styles.occasionChip, selectedOccasions.includes(occ) && styles.occasionChipActive]}
              >
                <Text style={[styles.occasionChipText, selectedOccasions.includes(occ) && styles.occasionChipTextActive]}>
                  {occ.replace(/_/g, ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <GoldButton
            title="Complete Setup ✦"
            onPress={completeOnboarding}
            isLoading={isLoading}
            fullWidth
            size="lg"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary, paddingHorizontal: Spacing.md },
  bgGlow: { position: 'absolute', top: 0, left: -100, right: -100, height: 400 },
  progressTrack: { height: 2, backgroundColor: Colors.border.subtle, borderRadius: 1, marginVertical: Spacing.lg },
  progressFill: { height: '100%', backgroundColor: Colors.gold.primary, borderRadius: 1 },
  stepContainer: { flex: 1, gap: Spacing.lg, paddingBottom: Spacing.xl },
  stepLabel: { ...Typography.luxe, color: Colors.text.tertiary },
  stepTitle: { ...Typography.display3, color: Colors.text.primary },
  stepSubtitle: { ...Typography.body1, color: Colors.text.secondary },
  welcomeContent: { flex: 1, justifyContent: 'center', gap: Spacing.md },
  welcomeIcon: { fontSize: 48, color: Colors.gold.primary },
  welcomeTitle: { fontSize: 52, fontWeight: '700', color: Colors.text.primary, letterSpacing: -2, lineHeight: 58 },
  welcomeSubtitle: { ...Typography.h3, color: Colors.gold.primary },
  welcomeBody: { ...Typography.body1, color: Colors.text.secondary, lineHeight: 26 },
  archetypeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, paddingBottom: Spacing.lg },
  archetypeItem: { width: (width - Spacing.md * 2 - Spacing.sm) / 2 },
  archetypeCard: { },
  archetypeCardActive: { borderColor: Colors.gold.primary },
  archetypeCardInner: { padding: Spacing.md, gap: 4, position: 'relative' },
  archetypeIcon: { fontSize: 24 },
  archetypeLabel: { ...Typography.h4, color: Colors.text.primary },
  archetypeLabelActive: { color: Colors.gold.primary },
  archetypeDesc: { ...Typography.body3, color: Colors.text.tertiary },
  archetypeCheck: { position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.gold.primary, alignItems: 'center', justifyContent: 'center' },
  archetypeCheckText: { fontSize: 10, color: '#0A0A0B', fontWeight: '700' },
  budgetList: { flex: 1, gap: Spacing.sm },
  budgetCard: { },
  budgetCardActive: { borderColor: Colors.gold.primary },
  budgetCardInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md },
  budgetLabel: { ...Typography.h4, color: Colors.text.primary },
  budgetLabelActive: { color: Colors.gold.primary },
  budgetDesc: { ...Typography.body3, color: Colors.text.tertiary },
  budgetCheck: { color: Colors.gold.primary, fontSize: 20, fontWeight: '700' },
  occasionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, flex: 1, alignContent: 'flex-start' },
  occasionChip: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: Radius.full, backgroundColor: Colors.background.elevated, borderWidth: 1, borderColor: Colors.border.subtle },
  occasionChipActive: { backgroundColor: Colors.gold.muted, borderColor: Colors.gold.primary },
  occasionChipText: { ...Typography.body2, color: Colors.text.secondary, fontWeight: '500' },
  occasionChipTextActive: { color: Colors.gold.primary, fontWeight: '700' },
});
