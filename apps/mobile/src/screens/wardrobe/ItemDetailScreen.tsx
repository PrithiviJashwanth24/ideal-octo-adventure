import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../constants/theme';
import { GlassCard } from '../../components/common/GlassCard';
import { GoldButton } from '../../components/common/GoldButton';
import { useAppSelector, useAppDispatch } from '../../hooks/useAppDispatch';
import { toggleFavorite, removeItem } from '../../store/slices/wardrobeSlice';
import { WardrobeService } from '../../services/wardrobe/wardrobeService';
import { CATEGORY_LABELS, OCCASION_LABELS, ARCHETYPE_LABELS } from '../../constants';

const { width, height } = Dimensions.get('window');

export function ItemDetailScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useAppDispatch();
  const { itemId } = route.params;
  const items = useAppSelector((s) => s.wardrobe.items);
  const item = items.find((i) => i.id === itemId);

  const scrollY = useRef(new Animated.Value(0)).current;
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  if (!item) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.notFound}>Item not found</Text>
      </View>
    );
  }

  const imageOpacity = scrollY.interpolate({ inputRange: [0, height * 0.4], outputRange: [1, 0], extrapolate: 'clamp' });
  const headerOpacity = scrollY.interpolate({ inputRange: [height * 0.3, height * 0.45], outputRange: [0, 1], extrapolate: 'clamp' });

  const handleToggleFavorite = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    dispatch(toggleFavorite(item.id));
    await WardrobeService.toggleFavorite(item.id).catch(() => {
      dispatch(toggleFavorite(item.id)); // rollback
    });
  };

  const handleLaundryChange = async (status: string) => {
    await WardrobeService.updateLaundryStatus(item.id, status).catch(console.error);
  };

  const handleDelete = () => {
    Alert.alert('Remove Item', `Remove "${item.name}" from your wardrobe?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          dispatch(removeItem(item.id));
          nav.goBack();
        },
      },
    ]);
  };

  const costPerWear = item.wearCount > 0 && (item as any).purchasePrice
    ? ((item as any).purchasePrice / item.wearCount).toFixed(2)
    : null;

  const laundryOptions = ['CLEAN', 'DIRTY', 'IN_WASH', 'DRYING'];
  const laundryLabels: Record<string, string> = {
    CLEAN: '✓ Clean', DIRTY: '✗ Dirty', IN_WASH: '⟳ Washing', DRYING: '≋ Drying',
  };
  const laundryColors: Record<string, string> = {
    CLEAN: Colors.success, DIRTY: Colors.error, IN_WASH: Colors.info, DRYING: Colors.warning,
  };

  return (
    <View style={styles.container}>
      {/* Sticky header */}
      <Animated.View style={[styles.stickyHeader, { paddingTop: insets.top, opacity: headerOpacity }]}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.headerBtn}>
          <Text style={styles.headerBtnIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.stickyHeaderTitle} numberOfLines={1}>{item.name}</Text>
        <TouchableOpacity onPress={handleToggleFavorite} style={styles.headerBtn}>
          <Text style={[styles.headerBtnIcon, item.isFavorite && { color: Colors.gold.primary }]}>★</Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.ScrollView
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Image */}
        <Animated.View style={[styles.heroContainer, { opacity: imageOpacity }]}>
          <Image
            source={{ uri: item.images?.[activeImageIdx]?.url || item.thumbnailUrl }}
            style={styles.heroImage}
            contentFit="cover"
          />
          <LinearGradient colors={['transparent', Colors.background.primary]} style={styles.heroGradient} />

          {/* Back button overlay */}
          <View style={[styles.overlayButtons, { top: insets.top + 8 }]}>
            <TouchableOpacity onPress={() => nav.goBack()} style={styles.overlayBtn}>
              <GlassCard style={styles.overlayBtnCard}>
                <Text style={styles.overlayBtnIcon}>←</Text>
              </GlassCard>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleToggleFavorite} style={styles.overlayBtn}>
              <GlassCard style={[styles.overlayBtnCard, item.isFavorite && styles.favActive]}>
                <Text style={[styles.overlayBtnIcon, item.isFavorite && { color: Colors.gold.primary }]}>★</Text>
              </GlassCard>
            </TouchableOpacity>
          </View>

          {/* Image dots */}
          {item.images && item.images.length > 1 && (
            <View style={styles.imageDots}>
              {item.images.map((_, i) => (
                <TouchableOpacity key={i} onPress={() => setActiveImageIdx(i)}>
                  <View style={[styles.dot, i === activeImageIdx && styles.dotActive]} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Animated.View>

        {/* Content */}
        <View style={styles.content}>
          {/* Title + brand */}
          <View style={styles.titleRow}>
            <View style={styles.titleInfo}>
              <Text style={styles.itemCategory}>{CATEGORY_LABELS[item.category] || item.category}</Text>
              <Text style={styles.itemName}>{item.name}</Text>
              {item.brand && <Text style={styles.itemBrand}>{item.brand}</Text>}
            </View>
            <View style={styles.wearBadge}>
              <Text style={styles.wearCount}>{item.wearCount}</Text>
              <Text style={styles.wearLabel}>wears</Text>
            </View>
          </View>

          {/* Key Metrics */}
          <View style={styles.metricsGrid}>
            {[
              { label: 'VERSATILITY', value: `${Math.round(item.versatilityScore * 100)}%`, color: Colors.gold.primary },
              { label: 'CONFIDENCE', value: `${Math.round(item.confidenceBoost * 100)}%`, color: Colors.success },
              { label: 'COST/WEAR', value: costPerWear ? `$${costPerWear}` : '—', color: Colors.text.primary },
              { label: 'FRESHNESS', value: `${Math.round((item as any).socialFreshnessScore * 100 || 100)}%`, color: Colors.info },
            ].map((m) => (
              <GlassCard key={m.label} style={styles.metricCard}>
                <View style={styles.metricInner}>
                  <Text style={[styles.metricValue, { color: m.color }]}>{m.value}</Text>
                  <Text style={styles.metricLabel}>{m.label}</Text>
                </View>
              </GlassCard>
            ))}
          </View>

          {/* Laundry Status */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>LAUNDRY STATUS</Text>
            <View style={styles.laundryOptions}>
              {laundryOptions.map((status) => (
                <TouchableOpacity
                  key={status}
                  onPress={() => handleLaundryChange(status)}
                  style={[
                    styles.laundryBtn,
                    item.laundryStatus === status && {
                      backgroundColor: laundryColors[status] + '20',
                      borderColor: laundryColors[status],
                    },
                  ]}
                >
                  <Text style={[styles.laundryBtnText, item.laundryStatus === status && { color: laundryColors[status] }]}>
                    {laundryLabels[status]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Style Info */}
          {item.occasionTags?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>OCCASION TAGS</Text>
              <View style={styles.tagCloud}>
                {item.occasionTags.map((tag) => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagText}>{OCCASION_LABELS[tag] || tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {item.styleArchetypes?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>STYLE ARCHETYPES</Text>
              <View style={styles.tagCloud}>
                {item.styleArchetypes.map((arch) => (
                  <View key={arch} style={[styles.tag, styles.archetypeTag]}>
                    <Text style={[styles.tagText, { color: Colors.gold.primary }]}>
                      {ARCHETYPE_LABELS[arch] || arch}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* AI Insights */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>AI INSIGHTS</Text>
            <GlassCard style={styles.insightCard}>
              <View style={styles.insightInner}>
                <Text style={styles.insightIcon}>✦</Text>
                <Text style={styles.insightText}>
                  {item.wearCount === 0
                    ? `You've never worn this item. It's using up prime wardrobe real estate — consider wearing it this week or donating it.`
                    : item.wearCount > 20
                    ? `This is a core wardrobe staple with ${item.wearCount} wears. High versatility item.`
                    : `You've worn this ${item.wearCount} time${item.wearCount !== 1 ? 's' : ''}. Versatility score: ${Math.round(item.versatilityScore * 100)}%.`
                  }
                </Text>
              </View>
            </GlassCard>
          </View>

          {/* Actions */}
          <View style={styles.actionsSection}>
            <GoldButton title="Log Outfit With This Item" onPress={() => nav.navigate('LogOutfit', { itemId: item.id })} fullWidth />
            <View style={styles.secondaryActions}>
              <GoldButton title="Edit Item" onPress={() => {}} variant="outline" style={{ flex: 1 }} />
              <GoldButton title="Remove" onPress={handleDelete} variant="danger" style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  notFound: { ...Typography.body1, color: Colors.text.secondary, textAlign: 'center', marginTop: 100 },
  stickyHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingBottom: Spacing.md, backgroundColor: 'rgba(10,10,11,0.9)', gap: Spacing.md },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerBtnIcon: { fontSize: 22, color: Colors.text.primary },
  stickyHeaderTitle: { flex: 1, ...Typography.h4, color: Colors.text.primary, textAlign: 'center' },
  heroContainer: { height: height * 0.6, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 200 },
  overlayButtons: { position: 'absolute', left: Spacing.md, right: Spacing.md, flexDirection: 'row', justifyContent: 'space-between' },
  overlayBtn: {},
  overlayBtnCard: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  favActive: { borderColor: Colors.gold.primary, backgroundColor: Colors.gold.muted },
  overlayBtnIcon: { fontSize: 20, color: Colors.text.primary },
  imageDots: { position: 'absolute', bottom: 20, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotActive: { backgroundColor: Colors.gold.primary, width: 18 },
  content: { padding: Spacing.md, gap: Spacing.lg },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  titleInfo: { flex: 1, gap: 4 },
  itemCategory: { ...Typography.luxe, color: Colors.gold.primary },
  itemName: { ...Typography.h2, color: Colors.text.primary },
  itemBrand: { ...Typography.body2, color: Colors.text.tertiary },
  wearBadge: { alignItems: 'center', backgroundColor: Colors.gold.muted, borderRadius: Radius.md, padding: Spacing.sm, borderWidth: 1, borderColor: Colors.gold.primary, minWidth: 64 },
  wearCount: { ...Typography.h2, color: Colors.gold.primary },
  wearLabel: { ...Typography.luxe, color: Colors.gold.dark, fontSize: 9 },
  metricsGrid: { flexDirection: 'row', gap: Spacing.sm },
  metricCard: { flex: 1 },
  metricInner: { padding: Spacing.sm, alignItems: 'center', gap: 4 },
  metricValue: { ...Typography.h3, fontWeight: '700' },
  metricLabel: { ...Typography.luxe, color: Colors.text.tertiary, fontSize: 8 },
  section: { gap: Spacing.sm },
  sectionLabel: { ...Typography.luxe, color: Colors.text.tertiary },
  laundryOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  laundryBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full, backgroundColor: Colors.background.elevated, borderWidth: 1, borderColor: Colors.border.subtle },
  laundryBtnText: { ...Typography.body3, color: Colors.text.secondary, fontWeight: '600' },
  tagCloud: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full, backgroundColor: Colors.background.elevated, borderWidth: 1, borderColor: Colors.border.subtle },
  archetypeTag: { backgroundColor: Colors.gold.muted, borderColor: Colors.gold.primary },
  tagText: { ...Typography.body3, color: Colors.text.secondary },
  insightCard: {},
  insightInner: { flexDirection: 'row', padding: Spacing.md, gap: Spacing.sm, alignItems: 'flex-start' },
  insightIcon: { fontSize: 14, color: Colors.gold.primary, marginTop: 2 },
  insightText: { flex: 1, ...Typography.body2, color: Colors.text.secondary, lineHeight: 22 },
  actionsSection: { gap: Spacing.sm, paddingBottom: Spacing.xl },
  secondaryActions: { flexDirection: 'row', gap: Spacing.sm },
});
