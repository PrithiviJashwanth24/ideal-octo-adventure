import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useQuery, gql } from '@apollo/client';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const WARDROBE_WRAPPED = gql`
  query WardrobeWrapped($year: Int!) {
    wardrobeWrapped(year: $year) {
      year
      totalOutfitsWorn
      totalItemsInWardrobe
      avgConfidenceRating
      topItem { id name wearCount }
      mostWornCategory
      peakMonth
      monthlyActivity
      stylePersonality
      headline
      insight
    }
  }
`;

const CURRENT_YEAR = new Date().getFullYear();

function StatCard({
  label,
  value,
  unit,
  delay,
}: {
  label: string;
  value: string;
  unit?: string;
  delay: number;
}) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 600 }));
    translateY.value = withDelay(delay, withSpring(0));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.statCard, style]}>
      <BlurView intensity={15} tint="dark" style={StyleSheet.absoluteFill} />
      <Text style={styles.statValue}>
        {value}
        {unit && <Text style={styles.statUnit}>{unit}</Text>}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
}

function MonthBar({ count, max, month }: { count: number; max: number; month: string }) {
  const height = useSharedValue(0);

  useEffect(() => {
    height.value = withDelay(300, withSpring((count / Math.max(max, 1)) * 80));
  }, [count, max]);

  const barStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return (
    <View style={styles.barContainer}>
      <View style={styles.barTrack}>
        <Animated.View style={[styles.barFill, barStyle]} />
      </View>
      <Text style={styles.barMonth}>{month}</Text>
    </View>
  );
}

const MONTH_SHORT = ['J','F','M','A','M','J','J','A','S','O','N','D'];

export default function WardrobeWrappedScreen({ navigation }: any) {
  const { data, loading } = useQuery(WARDROBE_WRAPPED, {
    variables: { year: CURRENT_YEAR },
  });

  const wrapped = data?.wardrobeWrapped;
  const titleOpacity = useSharedValue(0);
  const titleScale = useSharedValue(0.8);

  useEffect(() => {
    titleOpacity.value = withDelay(100, withTiming(1, { duration: 800 }));
    titleScale.value = withDelay(100, withSpring(1));
  }, []);

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ scale: titleScale.value }],
  }));

  const handleShare = async () => {
    if (!wrapped) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Share.share({
      message: `My ${wrapped.year} Wardrobe Wrapped:\n\n${wrapped.headline}\n\n${wrapped.insight}\n\nMy style personality: ${wrapped.stylePersonality}\n\n— via FitCheck`,
    });
  };

  const monthly = wrapped?.monthlyActivity || Array(12).fill(0);
  const maxMonth = Math.max(...monthly, 1);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0A0A0B', '#1A1408', '#0A0A0B']}
        style={StyleSheet.absoluteFill}
      />

      {/* Gold particle effect overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(212,175,55,0.05)', 'transparent']}
        style={styles.goldOverlay}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Hero */}
        <Animated.View style={[styles.hero, titleStyle]}>
          <Text style={styles.yearLabel}>{CURRENT_YEAR}</Text>
          <Text style={styles.wrappedTitle}>Wardrobe{'\n'}Wrapped</Text>
          <Text style={styles.tagline}>Your year in style, decoded.</Text>
        </Animated.View>

        {wrapped && (
          <>
            {/* Headline */}
            <BlurView intensity={20} tint="dark" style={styles.headlineCard}>
              <Text style={styles.headlineText}>{wrapped.headline}</Text>
            </BlurView>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <StatCard
                label="Outfits Worn"
                value={String(wrapped.totalOutfitsWorn)}
                delay={200}
              />
              <StatCard
                label="Items in Closet"
                value={String(wrapped.totalItemsInWardrobe)}
                delay={300}
              />
              <StatCard
                label="Avg Confidence"
                value={String(wrapped.avgConfidenceRating)}
                unit="/10"
                delay={400}
              />
              <StatCard
                label="Peak Month"
                value={wrapped.peakMonth}
                delay={500}
              />
            </View>

            {/* Style Personality */}
            <View style={styles.personalitySection}>
              <LinearGradient
                colors={['rgba(212,175,55,0.15)', 'rgba(212,175,55,0.05)']}
                style={styles.personalityCard}
              >
                <Text style={styles.personalityLabel}>YOUR STYLE PERSONALITY</Text>
                <Text style={styles.personalityName}>{wrapped.stylePersonality}</Text>
              </LinearGradient>
            </View>

            {/* Most Worn */}
            {wrapped.topItem && (
              <BlurView intensity={15} tint="dark" style={styles.topItemCard}>
                <Text style={styles.topItemLabel}>MOST WORN PIECE</Text>
                <Text style={styles.topItemName}>{wrapped.topItem.name}</Text>
                <Text style={styles.topItemCount}>
                  Worn {wrapped.topItem.wearCount} times
                </Text>
              </BlurView>
            )}

            {/* Monthly Activity Chart */}
            <View style={styles.chartSection}>
              <Text style={styles.chartTitle}>Monthly Activity</Text>
              <View style={styles.chart}>
                {monthly.map((count: number, i: number) => (
                  <MonthBar key={i} count={count} max={maxMonth} month={MONTH_SHORT[i]} />
                ))}
              </View>
            </View>

            {/* Insight */}
            <BlurView intensity={15} tint="dark" style={styles.insightCard}>
              <Text style={styles.insightLabel}>YEAR IN REVIEW</Text>
              <Text style={styles.insightText}>{wrapped.insight}</Text>
            </BlurView>

            {/* Share */}
            <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
              <LinearGradient
                colors={['#D4AF37', '#B8962E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.shareBtnGrad}
              >
                <Text style={styles.shareBtnText}>Share Your Wrapped ✦</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}

        {loading && (
          <View style={styles.loadingState}>
            <Text style={styles.loadingText}>Analyzing your year...</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  goldOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.6,
  },
  scroll: { padding: Spacing[5], paddingTop: 70 },
  hero: { alignItems: 'center', marginBottom: Spacing[8] },
  yearLabel: {
    ...Typography.mono,
    fontSize: 14,
    color: Colors.gold.muted,
    letterSpacing: 4,
    marginBottom: Spacing[2],
  },
  wrappedTitle: {
    fontSize: 56,
    fontWeight: '800',
    color: Colors.text.primary,
    textAlign: 'center',
    lineHeight: 60,
    letterSpacing: -2,
    marginBottom: Spacing[3],
  },
  tagline: { ...Typography.body1, color: Colors.text.tertiary },
  headlineCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.4)',
    overflow: 'hidden',
    padding: Spacing[6],
    marginBottom: Spacing[6],
    alignItems: 'center',
  },
  headlineText: {
    ...Typography.h3,
    color: Colors.gold.primary,
    textAlign: 'center',
    lineHeight: 30,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[3],
    marginBottom: Spacing[6],
  },
  statCard: {
    width: (SCREEN_WIDTH - Spacing[5] * 2 - Spacing[3]) / 2,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    overflow: 'hidden',
    padding: Spacing[5],
    alignItems: 'center',
  },
  statValue: {
    fontSize: 40,
    fontWeight: '700',
    color: Colors.text.primary,
    letterSpacing: -1,
  },
  statUnit: { fontSize: 20, fontWeight: '400', color: Colors.text.tertiary },
  statLabel: { ...Typography.body3, color: Colors.text.tertiary, marginTop: Spacing[1] },
  personalitySection: { marginBottom: Spacing[5] },
  personalityCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
    padding: Spacing[6],
    alignItems: 'center',
  },
  personalityLabel: {
    ...Typography.mono,
    fontSize: 11,
    color: Colors.gold.muted,
    letterSpacing: 2,
    marginBottom: Spacing[2],
  },
  personalityName: { ...Typography.display3, color: Colors.gold.primary, textAlign: 'center' },
  topItemCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    overflow: 'hidden',
    padding: Spacing[5],
    marginBottom: Spacing[5],
  },
  topItemLabel: {
    ...Typography.mono,
    fontSize: 10,
    color: Colors.text.tertiary,
    letterSpacing: 2,
    marginBottom: Spacing[2],
  },
  topItemName: { ...Typography.h3, color: Colors.text.primary, marginBottom: Spacing[1] },
  topItemCount: { ...Typography.body2, color: Colors.gold.primary },
  chartSection: { marginBottom: Spacing[6] },
  chartTitle: { ...Typography.h4, color: Colors.text.primary, marginBottom: Spacing[4] },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 100,
    gap: 4,
  },
  barContainer: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  barTrack: {
    width: '100%',
    height: 80,
    backgroundColor: Colors.background.secondary,
    borderRadius: 3,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    backgroundColor: Colors.gold.primary,
    width: '100%',
    borderRadius: 3,
  },
  barMonth: { ...Typography.mono, fontSize: 8, color: Colors.text.tertiary, marginTop: 4 },
  insightCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    overflow: 'hidden',
    padding: Spacing[5],
    marginBottom: Spacing[6],
  },
  insightLabel: {
    ...Typography.mono,
    fontSize: 10,
    color: Colors.text.tertiary,
    letterSpacing: 2,
    marginBottom: Spacing[3],
  },
  insightText: { ...Typography.body1, color: Colors.text.secondary, lineHeight: 26 },
  shareBtn: { borderRadius: Radius.lg, overflow: 'hidden', marginBottom: Spacing[8] },
  shareBtnGrad: {
    paddingVertical: Spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBtnText: { ...Typography.label, color: '#000' },
  loadingState: { alignItems: 'center', paddingTop: 100 },
  loadingText: { ...Typography.body1, color: Colors.text.tertiary },
});
