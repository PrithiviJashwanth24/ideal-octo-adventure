import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { GlassCard } from '../common/GlassCard';

interface Props {
  stats: {
    totalItems: number;
    utilizationRate: number;
    closetHealthScore: number;
    totalValue: number;
    neglectedItemCount: number;
    avgCostPerWear?: number;
  };
}

export function WardrobeStatsCard({ stats }: Props) {
  const healthColor = stats.closetHealthScore > 0.7
    ? Colors.success
    : stats.closetHealthScore > 0.4
    ? Colors.warning
    : Colors.error;

  return (
    <GlassCard variant="gold" style={styles.card}>
      <LinearGradient colors={['rgba(212,175,55,0.08)', 'transparent']} style={StyleSheet.absoluteFill} />

      <View style={styles.content}>
        {/* Health score hero */}
        <View style={styles.heroSection}>
          <Text style={styles.healthLabel}>CLOSET HEALTH</Text>
          <View style={styles.healthRow}>
            <Text style={[styles.healthScore, { color: healthColor }]}>
              {Math.round(stats.closetHealthScore * 100)}
            </Text>
            <Text style={styles.healthMax}>/100</Text>
          </View>
          <View style={styles.healthBar}>
            <View style={[styles.healthFill, {
              width: `${stats.closetHealthScore * 100}%`,
              backgroundColor: healthColor,
            }]} />
          </View>
        </View>

        {/* Stats grid */}
        <View style={styles.statsRow}>
          {[
            { value: stats.totalItems, label: 'ITEMS' },
            { value: `${Math.round(stats.utilizationRate * 100)}%`, label: 'WORN' },
            { value: stats.neglectedItemCount, label: 'NEGLECTED' },
          ].map((stat) => (
            <View key={stat.label} style={styles.statItem}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden' },
  content: { padding: Spacing.lg, gap: Spacing.md },
  heroSection: { gap: Spacing.sm },
  healthLabel: { ...Typography.luxe, color: Colors.gold.dark },
  healthRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  healthScore: { fontSize: 48, fontWeight: '700', letterSpacing: -2 },
  healthMax: { ...Typography.h3, color: Colors.text.tertiary, marginBottom: 8 },
  healthBar: { height: 3, backgroundColor: Colors.border.subtle, borderRadius: 1.5 },
  healthFill: { height: '100%', borderRadius: 1.5 },
  statsRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: Colors.border.subtle, paddingTop: Spacing.md },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { ...Typography.h3, color: Colors.text.primary },
  statLabel: { ...Typography.luxe, color: Colors.text.tertiary, fontSize: 9 },
});
