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
import { useLazyQuery, useMutation, gql } from '@apollo/client';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';

const SOCIAL_PERCEPTION = gql`
  query SocialPerception($outfitItemIds: [String!]!, $socialContext: String!) {
    socialPerception(outfitItemIds: $outfitItemIds, socialContext: $socialContext) {
      overallImpression
      perceivedTraits { trait strength explanation }
      firstImpressionScore
      memorabilityScore
      approachabilityScore
      authorityScore
      attractivenessScore
      suggestions
    }
  }
`;

const PERSONAL_BRAND = gql`
  mutation PersonalBrand($brandStatement: String!, $targetAudience: String!) {
    personalBrandOptimize(brandStatement: $brandStatement, targetAudience: $targetAudience) {
      brandScore
      recommendations
      outfitPrinciples
      avoidList
      signatureElement
    }
  }
`;

const SOCIAL_CONTEXTS = [
  'Job Interview',
  'First Date',
  'Board Meeting',
  'Networking Event',
  'Art Gallery Opening',
  'Startup Demo Day',
  'Dinner Party',
  'College Reunion',
];

const PERCEPTION_METRICS = [
  { key: 'firstImpressionScore', label: 'First Impression' },
  { key: 'memorabilityScore', label: 'Memorability' },
  { key: 'approachabilityScore', label: 'Approachability' },
  { key: 'authorityScore', label: 'Authority' },
  { key: 'attractivenessScore', label: 'Attractiveness' },
];

export default function SocialPerceptionScreen({ route }: any) {
  const preloadedItemIds: string[] = route?.params?.itemIds || [];
  const [tab, setTab] = useState<'perception' | 'brand'>('perception');
  const [selectedContext, setSelectedContext] = useState('Job Interview');
  const [brandStatement, setBrandStatement] = useState('');
  const [targetAudience, setTargetAudience] = useState('');

  const [analyzePerception, { data: perceptionData, loading: perceptionLoading }] =
    useLazyQuery(SOCIAL_PERCEPTION);

  const [optimizeBrand, { data: brandData, loading: brandLoading }] = useMutation(PERSONAL_BRAND);

  const perception = perceptionData?.socialPerception;
  const brand = brandData?.personalBrandOptimize;

  const handleAnalyze = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    analyzePerception({
      variables: {
        outfitItemIds: preloadedItemIds,
        socialContext: selectedContext,
      },
    });
  };

  const handleBrandOptimize = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    optimizeBrand({ variables: { brandStatement, targetAudience } });
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0A0B', '#111113']} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <Text style={styles.title}>Social Perception</Text>
        <Text style={styles.subtitle}>How the room reads you before you speak.</Text>
        <View style={styles.tabs}>
          {(['perception', 'brand'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tab, tab === t && styles.tabActive]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === 'perception' ? 'Read the Room' : 'Personal Brand'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {tab === 'perception' && (
          <>
            <Text style={styles.sectionLabel}>SELECT CONTEXT</Text>
            <View style={styles.contextGrid}>
              {SOCIAL_CONTEXTS.map((ctx) => (
                <TouchableOpacity
                  key={ctx}
                  style={[styles.contextChip, selectedContext === ctx && styles.contextChipActive]}
                  onPress={() => setSelectedContext(ctx)}
                >
                  <Text
                    style={[
                      styles.contextChipText,
                      selectedContext === ctx && styles.contextChipTextActive,
                    ]}
                  >
                    {ctx}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.analyzeBtn}
              onPress={handleAnalyze}
              disabled={perceptionLoading}
            >
              <LinearGradient
                colors={['#D4AF37', '#B8962E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.analyzeBtnGrad}
              >
                {perceptionLoading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.analyzeBtnText}>Analyze Perception ✦</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {perception && (
              <>
                <BlurView intensity={20} tint="dark" style={styles.impressionCard}>
                  <Text style={styles.impressionText}>"{perception.overallImpression}"</Text>
                </BlurView>

                <View style={styles.metricsGrid}>
                  {PERCEPTION_METRICS.map(({ key, label }) => (
                    <View key={key} style={styles.metricBox}>
                      <BlurView intensity={10} tint="dark" style={StyleSheet.absoluteFill} />
                      <Text style={styles.metricScore}>
                        {Math.round((perception as any)[key] * 100)}
                      </Text>
                      <Text style={styles.metricLabel}>{label}</Text>
                      <View style={styles.metricBar}>
                        <View
                          style={[
                            styles.metricFill,
                            { width: `${(perception as any)[key] * 100}%` },
                          ]}
                        />
                      </View>
                    </View>
                  ))}
                </View>

                <Text style={styles.sectionLabel}>PERCEIVED TRAITS</Text>
                {(perception.perceivedTraits || []).map((t: any, i: number) => (
                  <BlurView key={i} intensity={10} tint="dark" style={styles.traitCard}>
                    <View style={styles.traitHeader}>
                      <Text style={styles.traitName}>{t.trait}</Text>
                      <Text style={styles.traitStrength}>{Math.round(t.strength * 100)}%</Text>
                    </View>
                    <Text style={styles.traitExplanation}>{t.explanation}</Text>
                  </BlurView>
                ))}

                <Text style={styles.sectionLabel}>SUGGESTIONS</Text>
                {(perception.suggestions || []).map((s: string, i: number) => (
                  <View key={i} style={styles.suggestion}>
                    <Text style={styles.suggestionDot}>✦</Text>
                    <Text style={styles.suggestionText}>{s}</Text>
                  </View>
                ))}
              </>
            )}
          </>
        )}

        {tab === 'brand' && (
          <>
            <Text style={styles.sectionLabel}>YOUR PERSONAL BRAND</Text>
            <TextInput
              style={styles.input}
              placeholder="I want to be known as... (e.g. 'The innovative tech founder who's also a cultural tastemaker')"
              placeholderTextColor={Colors.text.tertiary}
              value={brandStatement}
              onChangeText={setBrandStatement}
              multiline
            />

            <Text style={styles.sectionLabel}>TARGET AUDIENCE</Text>
            <TextInput
              style={styles.input}
              placeholder="Who needs to perceive you this way? (e.g. 'VCs and enterprise clients in tech')"
              placeholderTextColor={Colors.text.tertiary}
              value={targetAudience}
              onChangeText={setTargetAudience}
              multiline
            />

            <TouchableOpacity
              style={styles.analyzeBtn}
              onPress={handleBrandOptimize}
              disabled={brandLoading}
            >
              <LinearGradient
                colors={['#D4AF37', '#B8962E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.analyzeBtnGrad}
              >
                {brandLoading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.analyzeBtnText}>Optimize My Brand ✦</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {brand && (
              <>
                <View style={styles.brandScoreCard}>
                  <LinearGradient
                    colors={['rgba(212,175,55,0.15)', 'rgba(212,175,55,0.05)']}
                    style={StyleSheet.absoluteFill}
                  />
                  <Text style={styles.brandScoreLabel}>BRAND ALIGNMENT SCORE</Text>
                  <Text style={styles.brandScoreValue}>{brand.brandScore}</Text>
                  <Text style={styles.brandScoreSubtext}>out of 100</Text>
                </View>

                {brand.signatureElement && (
                  <BlurView intensity={15} tint="dark" style={styles.signatureCard}>
                    <Text style={styles.signatureLabel}>YOUR SIGNATURE ELEMENT</Text>
                    <Text style={styles.signatureText}>{brand.signatureElement}</Text>
                  </BlurView>
                )}

                <Text style={styles.sectionLabel}>RECOMMENDATIONS</Text>
                {(brand.recommendations || []).map((r: string, i: number) => (
                  <View key={i} style={styles.listItem}>
                    <Text style={styles.listDot}>✦</Text>
                    <Text style={styles.listText}>{r}</Text>
                  </View>
                ))}

                <Text style={styles.sectionLabel}>STYLE PRINCIPLES</Text>
                {(brand.outfitPrinciples || []).map((p: string, i: number) => (
                  <View key={i} style={styles.listItem}>
                    <Text style={styles.listDot}>◎</Text>
                    <Text style={styles.listText}>{p}</Text>
                  </View>
                ))}

                <Text style={styles.sectionLabel}>AVOID</Text>
                {(brand.avoidList || []).map((a: string, i: number) => (
                  <View key={i} style={styles.listItem}>
                    <Text style={[styles.listDot, { color: '#FF5252' }]}>✕</Text>
                    <Text style={styles.listText}>{a}</Text>
                  </View>
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  header: { paddingHorizontal: Spacing[5], paddingTop: 60, paddingBottom: Spacing[4] },
  title: { ...Typography.h2, color: Colors.text.primary, marginBottom: Spacing[1] },
  subtitle: { ...Typography.body2, color: Colors.text.tertiary, marginBottom: Spacing[4] },
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
  scroll: { padding: Spacing[5], paddingTop: Spacing[3] },
  sectionLabel: {
    ...Typography.mono,
    fontSize: 10,
    color: Colors.text.tertiary,
    letterSpacing: 2,
    marginBottom: Spacing[3],
    marginTop: Spacing[4],
  },
  contextGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2], marginBottom: Spacing[5] },
  contextChip: {
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    backgroundColor: Colors.background.secondary,
  },
  contextChipActive: { backgroundColor: Colors.gold.primary, borderColor: Colors.gold.primary },
  contextChipText: { ...Typography.body3, color: Colors.text.secondary },
  contextChipTextActive: { color: '#000', fontWeight: '600' },
  analyzeBtn: { borderRadius: Radius.lg, overflow: 'hidden', marginBottom: Spacing[5] },
  analyzeBtnGrad: {
    paddingVertical: Spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyzeBtnText: { ...Typography.label, color: '#000' },
  impressionCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.4)',
    overflow: 'hidden',
    padding: Spacing[5],
    marginBottom: Spacing[5],
  },
  impressionText: {
    ...Typography.h4,
    color: Colors.gold.primary,
    fontStyle: 'italic',
    lineHeight: 28,
    textAlign: 'center',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[3],
    marginBottom: Spacing[5],
  },
  metricBox: {
    width: '47%',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    overflow: 'hidden',
    padding: Spacing[4],
  },
  metricScore: { fontSize: 32, fontWeight: '700', color: Colors.text.primary },
  metricLabel: { ...Typography.body3, color: Colors.text.tertiary, marginVertical: Spacing[1] },
  metricBar: {
    height: 3,
    backgroundColor: Colors.border.subtle,
    borderRadius: 2,
    marginTop: Spacing[2],
  },
  metricFill: { height: 3, backgroundColor: Colors.gold.primary, borderRadius: 2 },
  traitCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    overflow: 'hidden',
    padding: Spacing[4],
    marginBottom: Spacing[3],
  },
  traitHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing[2] },
  traitName: { ...Typography.label, color: Colors.text.primary },
  traitStrength: { ...Typography.label, color: Colors.gold.primary },
  traitExplanation: { ...Typography.body3, color: Colors.text.tertiary, lineHeight: 20 },
  suggestion: { flexDirection: 'row', gap: Spacing[3], marginBottom: Spacing[3] },
  suggestionDot: { color: Colors.gold.primary, marginTop: 2 },
  suggestionText: { ...Typography.body2, color: Colors.text.secondary, flex: 1, lineHeight: 22 },
  input: {
    backgroundColor: Colors.background.secondary,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    padding: Spacing[4],
    color: Colors.text.primary,
    ...Typography.body2,
    marginBottom: Spacing[3],
    minHeight: 80,
    textAlignVertical: 'top',
  },
  brandScoreCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
    overflow: 'hidden',
    padding: Spacing[6],
    alignItems: 'center',
    marginBottom: Spacing[4],
  },
  brandScoreLabel: {
    ...Typography.mono,
    fontSize: 10,
    color: Colors.gold.muted,
    letterSpacing: 2,
    marginBottom: Spacing[2],
  },
  brandScoreValue: { fontSize: 72, fontWeight: '800', color: Colors.gold.primary, lineHeight: 80 },
  brandScoreSubtext: { ...Typography.body2, color: Colors.text.tertiary },
  signatureCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border.default,
    overflow: 'hidden',
    padding: Spacing[5],
    marginBottom: Spacing[2],
  },
  signatureLabel: {
    ...Typography.mono,
    fontSize: 10,
    color: Colors.text.tertiary,
    letterSpacing: 2,
    marginBottom: Spacing[2],
  },
  signatureText: { ...Typography.h4, color: Colors.text.primary },
  listItem: { flexDirection: 'row', gap: Spacing[3], marginBottom: Spacing[3] },
  listDot: { color: Colors.gold.primary, marginTop: 2 },
  listText: { ...Typography.body2, color: Colors.text.secondary, flex: 1, lineHeight: 22 },
});
