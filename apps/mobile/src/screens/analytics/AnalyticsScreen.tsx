import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { GlassCard } from '../../components/common/GlassCard';
import { gqlRequest } from '../../services/graphql';
import { useAppSelector } from '../../hooks/useAppDispatch';

const { width } = Dimensions.get('window');

const REPORT_QUERY = `
  query WardrobeReport($period: String) {
    wardrobeReport(period: $period) {
      period utilizationRate costPerWear outfitDiversityScore sustainabilityScore
      insights recommendations
      topItems { id name brand wearCount thumbnailUrl category }
      neglectedItems { id name brand wearCount thumbnailUrl category purchasePrice }
    }
    confidenceScore {
      overall trend
      topBoostingItems { id name thumbnailUrl }
    }
  }
`;

export function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [report, setReport] = useState<any>(null);
  const [confidence, setConfidence] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const stats = useAppSelector((s) => s.wardrobe.stats);

  useEffect(() => {
    fetchReport();
  }, [period]);

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      const data = await gqlRequest<{ wardrobeReport: any; confidenceScore: any }>(REPORT_QUERY, { period });
      setReport(data.wardrobeReport);
      setConfidence(data.confidenceScore);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const MetricRing = ({ value, label, color = Colors.gold.primary }: any) => {
    const pct = Math.round(value * 100);
    return (
      <View style={styles.ring}>
        <View style={[styles.ringOuter, { borderColor: color }]}>
          <View style={[styles.ringInner, { borderColor: color + '33' }]}>
            <Text style={[styles.ringValue, { color }]}>{pct}</Text>
            <Text style={styles.ringPct}>%</Text>
          </View>
        </View>
        <Text style={styles.ringLabel}>{label}</Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerLabel}>CLOSET INTELLIGENCE</Text>
        <Text style={styles.headerTitle}>Your wardrobe report</Text>
      </View>

      {/* Period tabs */}
      <View style={styles.periodTabs}>
        {(['weekly', 'monthly', 'yearly'] as const).map((p) => (
          <TouchableOpacity
            key={p}
            onPress={() => setPeriod(p)}
            style={[styles.periodTab, period === p && styles.periodTabActive]}
          >
            <Text style={[styles.periodTabText, period === p && styles.periodTabTextActive]}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Closet Health Score */}
        {stats && (
          <GlassCard variant="gold" style={styles.healthCard}>
            <LinearGradient colors={['rgba(212,175,55,0.1)', 'transparent']} style={StyleSheet.absoluteFill} />
            <View style={styles.healthCardInner}>
              <View style={styles.healthScoreContainer}>
                <Text style={styles.healthScore}>{Math.round(stats.closetHealthScore * 100)}</Text>
                <Text style={styles.healthScoreLabel}>CLOSET HEALTH</Text>
              </View>
              <View style={styles.metrics}>
                <MetricRing value={stats.utilizationRate} label="UTILIZED" />
                <MetricRing value={stats.diversityScore} label="DIVERSE" color={Colors.info} />
                <MetricRing value={stats.sustainabilityScore} label="SUSTAIN" color={Colors.success} />
              </View>
            </View>
          </GlassCard>
        )}

        {/* Confidence Score */}
        {confidence && (
          <GlassCard style={styles.section}>
            <View style={styles.sectionInner}>
              <Text style={styles.sectionLabel}>CONFIDENCE SCORE</Text>
              <View style={styles.confidenceRow}>
                <View style={styles.confidenceMain}>
                  <Text style={styles.confidenceValue}>{Math.round(confidence.overall * 100)}</Text>
                  <Text style={styles.confidenceUnit}>/100</Text>
                </View>
                {/* Mini trend chart */}
                <View style={styles.trendChart}>
                  {confidence.trend?.slice(0, 14).map((v: number, i: number) => (
                    <View
                      key={i}
                      style={[styles.trendBar, {
                        height: Math.max(4, v * 40),
                        backgroundColor: v > 0.7 ? Colors.success : v > 0.4 ? Colors.warning : Colors.error,
                      }]}
                    />
                  ))}
                </View>
              </View>
            </View>
          </GlassCard>
        )}

        {/* Insights */}
        {report?.insights?.length > 0 && (
          <View style={styles.insightsContainer}>
            <Text style={styles.sectionLabel}>AI INSIGHTS</Text>
            {report.insights.map((insight: string, i: number) => (
              <GlassCard key={i} style={styles.insightCard}>
                <View style={styles.insightInner}>
                  <View style={styles.insightDot} />
                  <Text style={styles.insightText}>{insight}</Text>
                </View>
              </GlassCard>
            ))}
          </View>
        )}

        {/* Recommendations */}
        {report?.recommendations?.length > 0 && (
          <View style={styles.insightsContainer}>
            <Text style={styles.sectionLabel}>RECOMMENDATIONS</Text>
            {report.recommendations.map((rec: string, i: number) => (
              <GlassCard key={i} style={styles.insightCard}>
                <View style={styles.insightInner}>
                  <Text style={styles.recNumber}>{i + 1}</Text>
                  <Text style={styles.insightText}>{rec}</Text>
                </View>
              </GlassCard>
            ))}
          </View>
        )}

        {/* Key Stats */}
        {stats && (
          <View>
            <Text style={styles.sectionLabel}>KEY NUMBERS</Text>
            <View style={styles.statsGrid}>
              {[
                { label: 'Total Items', value: stats.totalItems, unit: '' },
                { label: 'Total Value', value: `$${Math.round(stats.totalValue)}`, unit: '' },
                { label: 'Avg Cost/Wear', value: `$${stats.avgCostPerWear?.toFixed(2)}`, unit: '' },
                { label: 'Neglected', value: stats.neglectedItemCount, unit: ' items' },
                { label: 'Total Wears', value: stats.totalWearEvents, unit: '' },
              ].map((stat) => (
                <GlassCard key={stat.label} style={styles.statCard}>
                  <View style={styles.statCardInner}>
                    <Text style={styles.statCardValue}>{stat.value}{stat.unit}</Text>
                    <Text style={styles.statCardLabel}>{stat.label.toUpperCase()}</Text>
                  </View>
                </GlassCard>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  header: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, gap: 4 },
  headerLabel: { ...Typography.luxe, color: Colors.text.tertiary },
  headerTitle: { ...Typography.h2, color: Colors.text.primary },
  periodTabs: { flexDirection: 'row', paddingHorizontal: Spacing.md, gap: Spacing.sm, marginBottom: Spacing.md },
  periodTab: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: Radius.full, backgroundColor: Colors.background.elevated, borderWidth: 1, borderColor: Colors.border.subtle },
  periodTabActive: { backgroundColor: Colors.gold.muted, borderColor: Colors.gold.primary },
  periodTabText: { ...Typography.label, color: Colors.text.secondary },
  periodTabTextActive: { color: Colors.gold.primary },
  content: { paddingHorizontal: Spacing.md, gap: Spacing.md },
  healthCard: { overflow: 'hidden' },
  healthCardInner: { padding: Spacing.lg, gap: Spacing.lg },
  healthScoreContainer: { alignItems: 'center' },
  healthScore: { fontSize: 72, fontWeight: '700', color: Colors.gold.primary, letterSpacing: -3 },
  healthScoreLabel: { ...Typography.luxe, color: Colors.gold.dark },
  metrics: { flexDirection: 'row', justifyContent: 'space-around' },
  ring: { alignItems: 'center', gap: Spacing.sm },
  ringOuter: { width: 72, height: 72, borderRadius: 36, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  ringInner: { width: 56, height: 56, borderRadius: 28, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', alignItems: 'flex-end' },
  ringValue: { fontSize: 22, fontWeight: '700', lineHeight: 26 },
  ringPct: { ...Typography.body3, color: Colors.text.tertiary, marginBottom: 4 },
  ringLabel: { ...Typography.luxe, color: Colors.text.tertiary, fontSize: 9 },
  section: { },
  sectionInner: { padding: Spacing.md, gap: Spacing.md },
  sectionLabel: { ...Typography.luxe, color: Colors.text.tertiary, marginBottom: 4 },
  confidenceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  confidenceMain: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  confidenceValue: { fontSize: 56, fontWeight: '700', color: Colors.gold.primary, letterSpacing: -2 },
  confidenceUnit: { ...Typography.h3, color: Colors.text.tertiary, marginBottom: 8 },
  trendChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 40 },
  trendBar: { width: 6, borderRadius: 3, minHeight: 4 },
  insightsContainer: { gap: Spacing.sm },
  insightCard: { },
  insightInner: { flexDirection: 'row', padding: Spacing.md, gap: Spacing.sm, alignItems: 'flex-start' },
  insightDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.gold.primary, marginTop: 6 },
  recNumber: { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.gold.muted, textAlign: 'center', lineHeight: 20, color: Colors.gold.primary, fontSize: 11, fontWeight: '700' },
  insightText: { flex: 1, ...Typography.body2, color: Colors.text.secondary, lineHeight: 22 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  statCard: { width: (width - Spacing.md * 2 - Spacing.sm) / 2 },
  statCardInner: { padding: Spacing.md, gap: 4 },
  statCardValue: { ...Typography.h2, color: Colors.text.primary },
  statCardLabel: { ...Typography.luxe, color: Colors.text.tertiary, fontSize: 9 },
});
