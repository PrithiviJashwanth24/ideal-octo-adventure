import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { useQuery, useMutation, gql } from '@apollo/client';
import { format } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const GET_OUTFIT = gql`
  query GetOutfit($id: ID!) {
    outfit(id: $id) {
      id
      name
      archetype
      occasion
      season
      rating
      wearCount
      createdAt
      items {
        id
        wardrobeItem {
          id
          name
          category
          brand
          colorPrimary
          formality
          imageUrls
          wearCount
          versatilityScore
          confidenceBoost
        }
        position
      }
    }
  }
`;

const LOG_OUTFIT = gql`
  mutation LogOutfit($outfitId: ID!, $confidenceRating: Int, $occasion: String, $notes: String) {
    logOutfit(outfitId: $outfitId, confidenceRating: $confidenceRating, occasion: $occasion, notes: $notes) {
      id
      wornAt
    }
  }
`;

const CONFIDENCE_PREDICTION = gql`
  query OutfitConfidence($outfitItemIds: [String!]!) {
    outfitConfidence(outfitItemIds: $outfitItemIds) {
      predictedScore
      explanation
      boosters
      detractors
      suggestions
    }
  }
`;

export default function OutfitDetailScreen({ route, navigation }: any) {
  const { outfitId } = route.params;
  const [logConfidence, setLogConfidence] = useState(8);
  const [showLogModal, setShowLogModal] = useState(false);

  const { data, loading } = useQuery(GET_OUTFIT, { variables: { id: outfitId } });
  const outfit = data?.outfit;

  const itemIds = outfit?.items?.map((i: any) => i.wardrobeItem.id) || [];
  const { data: confidenceData } = useQuery(CONFIDENCE_PREDICTION, {
    variables: { outfitItemIds: itemIds },
    skip: itemIds.length === 0,
  });
  const confidence = confidenceData?.outfitConfidence;

  const [logOutfit] = useMutation(LOG_OUTFIT);

  const handleWearToday = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setShowLogModal(true);
  };

  const handleLogConfirm = async () => {
    await logOutfit({
      variables: {
        outfitId,
        confidenceRating: logConfidence,
        occasion: outfit?.occasion?.[0],
      },
    });
    setShowLogModal(false);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.goBack();
  };

  if (!outfit && !loading) return null;

  const ARCHETYPE_COLORS: Record<string, string[]> = {
    safe: ['#1A1A2E', '#16213E'],
    statement: ['#1A0A2E', '#2D1B69'],
    stealthLuxury: ['#1A1408', '#2D2410'],
    dateNight: ['#2E0A1A', '#4D1A2D'],
    boardroom: ['#0A1A2E', '#1A2D4D'],
  };
  const gradColors = ARCHETYPE_COLORS[outfit?.archetype] || ['#0A0A0B', '#111113'];

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradColors as any} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Outfit name + archetype */}
        <View style={styles.heroSection}>
          <View style={styles.archetypePill}>
            <Text style={styles.archetypeText}>
              {outfit?.archetype?.replace(/([A-Z])/g, ' $1').trim().toUpperCase()}
            </Text>
          </View>
          <Text style={styles.outfitName}>{outfit?.name || 'Untitled Outfit'}</Text>
          <View style={styles.metaRow}>
            {outfit?.occasion?.slice(0, 2).map((occ: string) => (
              <View key={occ} style={styles.metaPill}>
                <Text style={styles.metaText}>{occ}</Text>
              </View>
            ))}
            {outfit?.season && (
              <View style={styles.metaPill}>
                <Text style={styles.metaText}>{outfit.season}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Items Grid */}
        <View style={styles.itemsSection}>
          <Text style={styles.sectionTitle}>The Pieces</Text>
          <View style={styles.itemsGrid}>
            {(outfit?.items || []).map((item: any) => {
              const wi = item.wardrobeItem;
              return (
                <BlurView key={item.id} intensity={15} tint="dark" style={styles.itemCard}>
                  <View style={styles.itemImagePlaceholder}>
                    {wi.imageUrls?.[0] ? (
                      <Image source={{ uri: wi.imageUrls[0] }} style={styles.itemImage} />
                    ) : (
                      <LinearGradient
                        colors={['#1A1A1A', '#222']}
                        style={StyleSheet.absoluteFill}
                      />
                    )}
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {wi.name}
                    </Text>
                    <Text style={styles.itemBrand} numberOfLines={1}>
                      {wi.brand || wi.category}
                    </Text>
                    <View style={styles.itemScores}>
                      <Text style={styles.itemScore}>
                        ⚡{Math.round((wi.confidenceBoost || 0.7) * 10)}/10
                      </Text>
                      <Text style={styles.itemScore}>
                        ◎{Math.round((wi.versatilityScore || 0.7) * 10)}/10
                      </Text>
                    </View>
                  </View>
                </BlurView>
              );
            })}
          </View>
        </View>

        {/* Confidence Prediction */}
        {confidence && (
          <BlurView intensity={20} tint="dark" style={styles.confidenceCard}>
            <View style={styles.confidenceHeader}>
              <Text style={styles.confidenceLabel}>AI CONFIDENCE PREDICTION</Text>
              <Text style={styles.confidenceScore}>
                {Math.round(confidence.predictedScore * 100)}%
              </Text>
            </View>
            <Text style={styles.confidenceExplanation}>{confidence.explanation}</Text>

            {confidence.boosters?.length > 0 && (
              <View style={styles.boosterSection}>
                {confidence.boosters.map((b: string, i: number) => (
                  <View key={i} style={styles.boosterRow}>
                    <Text style={styles.boosterIcon}>✓</Text>
                    <Text style={styles.boosterText}>{b}</Text>
                  </View>
                ))}
              </View>
            )}

            {confidence.detractors?.length > 0 && (
              <View>
                {confidence.detractors.map((d: string, i: number) => (
                  <View key={i} style={styles.detractorRow}>
                    <Text style={styles.detractorIcon}>△</Text>
                    <Text style={styles.detractorText}>{d}</Text>
                  </View>
                ))}
              </View>
            )}
          </BlurView>
        )}

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{outfit?.wearCount || 0}</Text>
            <Text style={styles.statLabel}>Times Worn</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{outfit?.rating?.toFixed(1) || '—'}</Text>
            <Text style={styles.statLabel}>Avg Rating</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{outfit?.items?.length || 0}</Text>
            <Text style={styles.statLabel}>Pieces</Text>
          </View>
        </View>

        {/* Wear Today CTA */}
        <View style={styles.ctaSection}>
          <TouchableOpacity style={styles.wearBtn} onPress={handleWearToday}>
            <LinearGradient
              colors={['#D4AF37', '#B8962E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.wearBtnGrad}
            >
              <Text style={styles.wearBtnText}>Wear This Today ✦</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Log Modal */}
      {showLogModal && (
        <View style={styles.modalOverlay}>
          <BlurView intensity={40} tint="dark" style={styles.modal}>
            <Text style={styles.modalTitle}>How confident do you feel?</Text>
            <Text style={styles.modalScore}>{logConfidence}/10</Text>
            <View style={styles.ratingRow}>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <TouchableOpacity
                  key={n}
                  style={[styles.ratingDot, logConfidence >= n && styles.ratingDotActive]}
                  onPress={() => setLogConfidence(n)}
                />
              ))}
            </View>
            <TouchableOpacity style={styles.confirmBtn} onPress={handleLogConfirm}>
              <LinearGradient
                colors={['#D4AF37', '#B8962E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.confirmBtnGrad}
              >
                <Text style={styles.confirmBtnText}>Log It ✦</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowLogModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </BlurView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: Spacing[5],
    paddingBottom: Spacing[2],
  },
  backBtn: { padding: Spacing[2] },
  backText: { ...Typography.h3, color: Colors.text.primary },
  heroSection: { paddingHorizontal: Spacing[5], paddingBottom: Spacing[5] },
  archetypePill: {
    alignSelf: 'flex-start',
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.gold.muted,
    paddingHorizontal: Spacing[3],
    paddingVertical: 4,
    marginBottom: Spacing[3],
  },
  archetypeText: {
    ...Typography.mono,
    fontSize: 10,
    color: Colors.gold.muted,
    letterSpacing: 2,
  },
  outfitName: { ...Typography.display3, color: Colors.text.primary, marginBottom: Spacing[3] },
  metaRow: { flexDirection: 'row', gap: Spacing[2] },
  metaPill: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing[3],
    paddingVertical: 4,
  },
  metaText: { ...Typography.body3, color: Colors.text.secondary },
  itemsSection: { paddingHorizontal: Spacing[5], marginBottom: Spacing[5] },
  sectionTitle: { ...Typography.h4, color: Colors.text.primary, marginBottom: Spacing[4] },
  itemsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[3] },
  itemCard: {
    width: (SCREEN_WIDTH - Spacing[5] * 2 - Spacing[3]) / 2,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    overflow: 'hidden',
  },
  itemImagePlaceholder: { width: '100%', height: 140, overflow: 'hidden' },
  itemImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  itemInfo: { padding: Spacing[3] },
  itemName: { ...Typography.label, color: Colors.text.primary },
  itemBrand: { ...Typography.body3, color: Colors.text.tertiary, marginBottom: Spacing[2] },
  itemScores: { flexDirection: 'row', gap: Spacing[3] },
  itemScore: { ...Typography.mono, fontSize: 10, color: Colors.text.tertiary },
  confidenceCard: {
    marginHorizontal: Spacing[5],
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
    overflow: 'hidden',
    padding: Spacing[5],
    marginBottom: Spacing[5],
  },
  confidenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[3],
  },
  confidenceLabel: {
    ...Typography.mono,
    fontSize: 10,
    color: Colors.text.tertiary,
    letterSpacing: 2,
  },
  confidenceScore: { ...Typography.h2, color: Colors.gold.primary },
  confidenceExplanation: {
    ...Typography.body2,
    color: Colors.text.secondary,
    lineHeight: 22,
    marginBottom: Spacing[4],
  },
  boosterSection: { marginBottom: Spacing[3] },
  boosterRow: { flexDirection: 'row', gap: Spacing[2], marginBottom: Spacing[2] },
  boosterIcon: { color: '#4CAF50', fontWeight: '700' },
  boosterText: { ...Typography.body3, color: Colors.text.secondary, flex: 1 },
  detractorRow: { flexDirection: 'row', gap: Spacing[2], marginBottom: Spacing[2] },
  detractorIcon: { color: Colors.gold.primary },
  detractorText: { ...Typography.body3, color: Colors.text.secondary, flex: 1 },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing[5],
    marginBottom: Spacing[6],
    backgroundColor: Colors.background.secondary,
    borderRadius: Radius.xl,
    padding: Spacing[5],
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { ...Typography.h2, color: Colors.text.primary },
  statLabel: { ...Typography.body3, color: Colors.text.tertiary },
  statDivider: { width: 1, backgroundColor: Colors.border.subtle },
  ctaSection: { paddingHorizontal: Spacing[5], paddingBottom: Spacing[8] },
  wearBtn: { borderRadius: Radius.lg, overflow: 'hidden' },
  wearBtnGrad: {
    paddingVertical: Spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
  },
  wearBtnText: { ...Typography.label, color: '#000' },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modal: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border.default,
    overflow: 'hidden',
    padding: Spacing[8],
    alignItems: 'center',
  },
  modalTitle: { ...Typography.h3, color: Colors.text.primary, marginBottom: Spacing[4] },
  modalScore: { fontSize: 56, fontWeight: '700', color: Colors.gold.primary, marginBottom: Spacing[4] },
  ratingRow: { flexDirection: 'row', gap: Spacing[2], marginBottom: Spacing[6] },
  ratingDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.background.tertiary,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  ratingDotActive: { backgroundColor: Colors.gold.primary, borderColor: Colors.gold.primary },
  confirmBtn: { borderRadius: Radius.lg, overflow: 'hidden', width: '100%', marginBottom: Spacing[4] },
  confirmBtnGrad: {
    paddingVertical: Spacing[4],
    alignItems: 'center',
  },
  confirmBtnText: { ...Typography.label, color: '#000' },
  cancelText: { ...Typography.body2, color: Colors.text.tertiary },
});
