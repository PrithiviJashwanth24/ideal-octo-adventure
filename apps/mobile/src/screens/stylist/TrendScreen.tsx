import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useQuery, useLazyQuery, gql } from '@apollo/client';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';

const PERSONALIZED_TRENDS = gql`
  query {
    personalizedTrends {
      trend
      momentum
      relevanceToUser
      adoptionAdvice
      keyPieces
      timeframe
    }
  }
`;

const WARDROBE_SIMULATION = gql`
  query WardrobeSimulation($itemDescription: String!, $itemPrice: Float!) {
    wardrobeSimulation(itemDescription: $itemDescription, itemPrice: $itemPrice) {
      currentScore
      projectedScore
      addedItem
      impactAnalysis
      outfitCombinationsUnlocked
      recommendedBudget
    }
  }
`;

const MOMENTUM_COLOR: Record<string, string> = {
  rising: '#4CAF50',
  peak: Colors.gold.primary,
  declining: '#FF5252',
};

const MOMENTUM_LABEL: Record<string, string> = {
  rising: '↑ Rising',
  peak: '◉ Peak',
  declining: '↓ Fading',
};

export default function TrendScreen() {
  const [tab, setTab] = useState<'trends' | 'simulate'>('trends');
  const [itemDesc, setItemDesc] = useState('');
  const [itemPrice, setItemPrice] = useState('');

  const { data: trendsData, loading: trendsLoading } = useQuery(PERSONALIZED_TRENDS);

  const [runSim, { data: simData, loading: simLoading }] = useLazyQuery(WARDROBE_SIMULATION);

  const trends = trendsData?.personalizedTrends || [];

  const handleSimulate = async () => {
    if (!itemDesc || !itemPrice) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    runSim({ variables: { itemDescription: itemDesc, itemPrice: parseFloat(itemPrice) } });
  };

  const sim = simData?.wardrobeSimulation;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0A0B', '#111113']} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <Text style={styles.title}>Trend Intelligence</Text>
        <View style={styles.tabs}>
          {(['trends', 'simulate'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tab, tab === t && styles.tabActive]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === 'trends' ? 'Your Trends' : 'Simulate Buy'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {tab === 'trends' && (
          <>
            {trendsLoading ? (
              <ActivityIndicator color={Colors.gold.primary} style={{ marginTop: 60 }} />
            ) : (
              trends.map((trend: any, idx: number) => (
                <BlurView key={idx} intensity={15} tint="dark" style={styles.trendCard}>
                  <View style={styles.trendHeader}>
                    <Text style={styles.trendName}>{trend.trend}</Text>
                    <View
                      style={[
                        styles.momentumBadge,
                        { borderColor: MOMENTUM_COLOR[trend.momentum] },
                      ]}
                    >
                      <Text
                        style={[styles.momentumText, { color: MOMENTUM_COLOR[trend.momentum] }]}
                      >
                        {MOMENTUM_LABEL[trend.momentum]}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.relevanceBar}>
                    <View
                      style={[
                        styles.relevanceFill,
                        { width: `${trend.relevanceToUser * 100}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.relevanceLabel}>
                    {Math.round(trend.relevanceToUser * 100)}% relevant to your style
                  </Text>

                  <Text style={styles.adoptionAdvice}>{trend.adoptionAdvice}</Text>

                  <View style={styles.keyPieces}>
                    {(trend.keyPieces || []).map((piece: string, i: number) => (
                      <View key={i} style={styles.piecePill}>
                        <Text style={styles.pieceText}>{piece}</Text>
                      </View>
                    ))}
                  </View>

                  <Text style={styles.timeframe}>⏱ {trend.timeframe}</Text>
                </BlurView>
              ))
            )}
          </>
        )}

        {tab === 'simulate' && (
          <View style={styles.simContainer}>
            <Text style={styles.simTitle}>What if I buy this?</Text>
            <Text style={styles.simSubtitle}>
              See exactly how a new item impacts your wardrobe before spending.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Describe the item (e.g. Navy slim-fit chinos, Loro Piana)"
              placeholderTextColor={Colors.text.tertiary}
              value={itemDesc}
              onChangeText={setItemDesc}
              multiline
            />

            <TextInput
              style={styles.input}
              placeholder="Price ($)"
              placeholderTextColor={Colors.text.tertiary}
              value={itemPrice}
              onChangeText={setItemPrice}
              keyboardType="numeric"
            />

            <TouchableOpacity
              style={styles.simBtn}
              onPress={handleSimulate}
              disabled={simLoading}
            >
              <LinearGradient
                colors={['#D4AF37', '#B8962E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.simBtnGrad}
              >
                {simLoading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.simBtnText}>Run Simulation ✦</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {sim && (
              <BlurView intensity={20} tint="dark" style={styles.simResult}>
                <View style={styles.scoreRow}>
                  <View style={styles.scoreBox}>
                    <Text style={styles.scoreLabel}>NOW</Text>
                    <Text style={styles.scoreValue}>{sim.currentScore}</Text>
                  </View>
                  <Text style={styles.arrow}>→</Text>
                  <View style={[styles.scoreBox, styles.scoreBoxGold]}>
                    <Text style={[styles.scoreLabel, { color: Colors.gold.primary }]}>AFTER</Text>
                    <Text style={[styles.scoreValue, { color: Colors.gold.primary }]}>
                      {sim.projectedScore}
                    </Text>
                  </View>
                  <View style={styles.scoreBox}>
                    <Text style={styles.scoreLabel}>COMBOS</Text>
                    <Text style={styles.scoreValue}>+{sim.outfitCombinationsUnlocked}</Text>
                  </View>
                </View>

                <Text style={styles.impactText}>{sim.impactAnalysis}</Text>

                <View style={styles.budgetRow}>
                  <Text style={styles.budgetLabel}>Budget Score</Text>
                  <View style={styles.budgetDots}>
                    {Array.from({ length: 10 }).map((_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.dot,
                          i < sim.recommendedBudget ? styles.dotActive : styles.dotInactive,
                        ]}
                      />
                    ))}
                  </View>
                  <Text style={styles.budgetScore}>{sim.recommendedBudget}/10</Text>
                </View>
              </BlurView>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  header: { paddingHorizontal: Spacing[5], paddingTop: 60, paddingBottom: Spacing[4] },
  title: { ...Typography.h2, color: Colors.text.primary, marginBottom: Spacing[4] },
  tabs: { flexDirection: 'row', gap: Spacing[2] },
  tab: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  tabActive: { backgroundColor: Colors.gold.primary, borderColor: Colors.gold.primary },
  tabText: { ...Typography.label, color: Colors.text.tertiary },
  tabTextActive: { color: '#000' },
  scroll: { padding: Spacing[5], paddingTop: Spacing[2] },
  trendCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    overflow: 'hidden',
    padding: Spacing[5],
    marginBottom: Spacing[4],
  },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing[3],
  },
  trendName: { ...Typography.h4, color: Colors.text.primary, flex: 1, marginRight: Spacing[3] },
  momentumBadge: {
    borderRadius: Radius.sm,
    borderWidth: 1,
    paddingHorizontal: Spacing[2],
    paddingVertical: 4,
  },
  momentumText: { ...Typography.mono, fontSize: 10 },
  relevanceBar: {
    height: 3,
    backgroundColor: Colors.border.subtle,
    borderRadius: 2,
    marginBottom: Spacing[1],
  },
  relevanceFill: { height: 3, backgroundColor: Colors.gold.primary, borderRadius: 2 },
  relevanceLabel: { ...Typography.body3, color: Colors.text.tertiary, marginBottom: Spacing[3] },
  adoptionAdvice: { ...Typography.body2, color: Colors.text.secondary, lineHeight: 22, marginBottom: Spacing[3] },
  keyPieces: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2], marginBottom: Spacing[3] },
  piecePill: {
    backgroundColor: Colors.background.tertiary,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing[3],
    paddingVertical: 5,
  },
  pieceText: { ...Typography.body3, color: Colors.text.secondary },
  timeframe: { ...Typography.body3, color: Colors.text.tertiary },
  simContainer: {},
  simTitle: { ...Typography.h3, color: Colors.text.primary, marginBottom: Spacing[2] },
  simSubtitle: { ...Typography.body2, color: Colors.text.tertiary, marginBottom: Spacing[5], lineHeight: 22 },
  input: {
    backgroundColor: Colors.background.secondary,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    padding: Spacing[4],
    color: Colors.text.primary,
    ...Typography.body2,
    marginBottom: Spacing[3],
  },
  simBtn: { borderRadius: Radius.lg, overflow: 'hidden', marginBottom: Spacing[5] },
  simBtnGrad: {
    paddingVertical: Spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
  },
  simBtnText: { ...Typography.label, color: '#000' },
  simResult: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
    overflow: 'hidden',
    padding: Spacing[5],
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: Spacing[5],
  },
  scoreBox: { alignItems: 'center' },
  scoreBoxGold: {},
  scoreLabel: { ...Typography.mono, fontSize: 10, color: Colors.text.tertiary, letterSpacing: 1 },
  scoreValue: { ...Typography.display3, color: Colors.text.primary },
  arrow: { ...Typography.h2, color: Colors.text.tertiary },
  impactText: { ...Typography.body2, color: Colors.text.secondary, lineHeight: 22, marginBottom: Spacing[5] },
  budgetRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  budgetLabel: { ...Typography.body3, color: Colors.text.tertiary },
  budgetDots: { flexDirection: 'row', gap: 4, flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { backgroundColor: Colors.gold.primary },
  dotInactive: { backgroundColor: Colors.border.subtle },
  budgetScore: { ...Typography.label, color: Colors.gold.primary },
});
