import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
  RefreshControl,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { GlassCard } from '../../components/common/GlassCard';
import { GoldButton } from '../../components/common/GoldButton';
import { gqlRequest } from '../../services/graphql';

const { width } = Dimensions.get('window');
const CARD_W = (width - Spacing.md * 2 - Spacing.sm) / 2;

const SHOPPING_QUERY = `
  query Shopping {
    shoppingRecommendations(limit: 6) {
      gapType priority reason
      suggestions {
        id name brand price currency imageUrl productUrl retailer aiScore aiReason category
      }
    }
    wardrobeStats {
      closetHealthScore neglectedItemCount totalItems utilizationRate
    }
  }
`;

const RETAILER_COLORS: Record<string, string> = {
  Zara: '#1A1A1A',
  Nike: '#FF6200',
  Farfetch: '#1A1A1A',
  SSENSE: '#1A1A1A',
  Myntra: '#FF3F6C',
  'Amazon Fashion': '#FF9900',
  'H&M': '#E50010',
};

export function ShopScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<any>();
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeGap, setActiveGap] = useState<number>(0);

  useEffect(() => { fetch(); }, []);

  const fetch = async () => {
    setIsLoading(true);
    try {
      const data = await gqlRequest<any>(SHOPPING_QUERY);
      setRecommendations(data.shoppingRecommendations || []);
      setStats(data.wardrobeStats);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => { setRefreshing(true); fetch(); };

  const activeRec = recommendations[activeGap];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>WARDROBE GAPS</Text>
          <Text style={styles.headerTitle}>AI Shopping Intelligence</Text>
        </View>
        <TouchableOpacity style={styles.filterBtn}>
          <Text style={styles.filterIcon}>⊞</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold.primary} />}
      >
        {/* Wardrobe Gap Summary */}
        {stats && (
          <View style={styles.gapSummary}>
            <GlassCard variant="gold" style={styles.gapCard}>
              <LinearGradient colors={['rgba(212,175,55,0.1)', 'transparent']} style={StyleSheet.absoluteFill} />
              <View style={styles.gapCardInner}>
                <Text style={styles.gapCardTitle}>Your Wardrobe Has Gaps</Text>
                <Text style={styles.gapCardSub}>
                  AI analyzed your {stats.totalItems} items and found {recommendations.length} key opportunities.
                </Text>
                <View style={styles.gapStats}>
                  <View style={styles.gapStat}>
                    <Text style={styles.gapStatValue}>{Math.round((1 - stats.utilizationRate) * stats.totalItems)}</Text>
                    <Text style={styles.gapStatLabel}>UNUSED ITEMS</Text>
                  </View>
                  <View style={styles.gapStatDivider} />
                  <View style={styles.gapStat}>
                    <Text style={styles.gapStatValue}>{recommendations.length}</Text>
                    <Text style={styles.gapStatLabel}>GAPS FOUND</Text>
                  </View>
                  <View style={styles.gapStatDivider} />
                  <View style={styles.gapStat}>
                    <Text style={[styles.gapStatValue, { color: Colors.gold.primary }]}>
                      {Math.round(stats.closetHealthScore * 100)}
                    </Text>
                    <Text style={styles.gapStatLabel}>HEALTH</Text>
                  </View>
                </View>
              </View>
            </GlassCard>
          </View>
        )}

        {/* Gap Selector */}
        {recommendations.length > 0 && (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gapTabs}>
              {recommendations.map((rec, i) => (
                <TouchableOpacity
                  key={rec.gapType}
                  onPress={() => setActiveGap(i)}
                  style={[styles.gapTab, activeGap === i && styles.gapTabActive]}
                >
                  <View style={styles.gapTabInner}>
                    <Text style={[styles.gapTabPriority, activeGap === i && { color: Colors.gold.primary }]}>
                      P{rec.priority}
                    </Text>
                    <Text style={[styles.gapTabText, activeGap === i && styles.gapTabTextActive]}>
                      {rec.gapType}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {activeRec && (
              <View style={styles.activeGapSection}>
                <GlassCard style={styles.gapReason}>
                  <View style={styles.gapReasonInner}>
                    <Text style={styles.gapReasonLabel}>WHY YOU NEED THIS</Text>
                    <Text style={styles.gapReasonText}>{activeRec.reason}</Text>
                  </View>
                </GlassCard>

                <Text style={styles.suggestionsLabel}>AI PICKS FOR YOU</Text>

                <View style={styles.productGrid}>
                  {activeRec.suggestions?.map((product: any) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </View>
              </View>
            )}
          </>
        )}

        {/* Partners Strip */}
        <View style={styles.partnersSection}>
          <Text style={styles.partnersLabel}>SHOP FROM</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.partnersList}>
            {['Zara', 'Nike', 'Farfetch', 'SSENSE', 'Myntra', 'H&M'].map((brand) => (
              <GlassCard key={brand} style={styles.partnerChip}>
                <View style={styles.partnerChipInner}>
                  <Text style={styles.partnerChipText}>{brand}</Text>
                </View>
              </GlassCard>
            ))}
          </ScrollView>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

function ProductCard({ product }: { product: any }) {
  const handleOpen = () => {
    if (product.productUrl) Linking.openURL(product.productUrl).catch(() => {});
  };

  return (
    <TouchableOpacity style={styles.productCard} onPress={handleOpen} activeOpacity={0.85}>
      <GlassCard style={styles.productCardInner}>
        {/* Image */}
        <View style={styles.productImageContainer}>
          {product.imageUrl ? (
            <Image source={{ uri: product.imageUrl }} style={styles.productImage} resizeMode="cover" />
          ) : (
            <View style={styles.productImagePlaceholder}>
              <Text style={styles.productPlaceholderIcon}>🛍</Text>
            </View>
          )}
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={styles.productImageGradient} />
          {/* AI Score Badge */}
          <View style={styles.aiScoreBadge}>
            <Text style={styles.aiScoreText}>{Math.round(product.aiScore * 100)}%</Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.productInfo}>
          <Text style={styles.productRetailer}>{product.retailer}</Text>
          <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
          {product.brand && <Text style={styles.productBrand}>{product.brand}</Text>}
          <View style={styles.productFooter}>
            {product.price ? (
              <Text style={styles.productPrice}>
                {product.currency === 'USD' ? '$' : product.currency}{product.price}
              </Text>
            ) : (
              <Text style={styles.productPriceTbd}>View Price →</Text>
            )}
          </View>
          <Text style={styles.productAiReason} numberOfLines={2}>{product.aiReason}</Text>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.md },
  headerLabel: { ...Typography.luxe, color: Colors.text.tertiary },
  headerTitle: { ...Typography.h2, color: Colors.text.primary },
  filterBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  filterIcon: { fontSize: 20, color: Colors.text.secondary },
  gapSummary: { paddingHorizontal: Spacing.md, marginBottom: Spacing.md },
  gapCard: { overflow: 'hidden' },
  gapCardInner: { padding: Spacing.lg, gap: Spacing.md },
  gapCardTitle: { ...Typography.h3, color: Colors.text.primary },
  gapCardSub: { ...Typography.body2, color: Colors.text.secondary, lineHeight: 22 },
  gapStats: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: Colors.border.subtle, paddingTop: Spacing.md },
  gapStat: { flex: 1, alignItems: 'center', gap: 4 },
  gapStatValue: { ...Typography.h2, color: Colors.text.primary },
  gapStatLabel: { ...Typography.luxe, color: Colors.text.tertiary, fontSize: 9 },
  gapStatDivider: { width: 1, backgroundColor: Colors.border.subtle },
  gapTabs: { paddingHorizontal: Spacing.md, gap: Spacing.sm, marginBottom: Spacing.md },
  gapTab: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.full, backgroundColor: Colors.background.elevated, borderWidth: 1, borderColor: Colors.border.subtle },
  gapTabActive: { backgroundColor: Colors.gold.muted, borderColor: Colors.gold.primary },
  gapTabInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  gapTabPriority: { ...Typography.luxe, color: Colors.text.tertiary, fontSize: 9 },
  gapTabText: { ...Typography.body3, color: Colors.text.secondary, fontWeight: '600' },
  gapTabTextActive: { color: Colors.gold.primary },
  activeGapSection: { paddingHorizontal: Spacing.md, gap: Spacing.md },
  gapReason: {},
  gapReasonInner: { padding: Spacing.md, gap: Spacing.sm },
  gapReasonLabel: { ...Typography.luxe, color: Colors.gold.primary },
  gapReasonText: { ...Typography.body2, color: Colors.text.secondary, lineHeight: 22 },
  suggestionsLabel: { ...Typography.luxe, color: Colors.text.tertiary },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  productCard: { width: CARD_W },
  productCardInner: { overflow: 'hidden' },
  productImageContainer: { height: CARD_W * 1.2, position: 'relative' },
  productImage: { width: '100%', height: '100%' },
  productImagePlaceholder: { flex: 1, backgroundColor: Colors.background.tertiary, alignItems: 'center', justifyContent: 'center' },
  productPlaceholderIcon: { fontSize: 32 },
  productImageGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 60 },
  aiScoreBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: Colors.gold.primary, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  aiScoreText: { fontSize: 10, fontWeight: '800', color: '#0A0A0B' },
  productInfo: { padding: 10, gap: 3 },
  productRetailer: { ...Typography.luxe, color: Colors.text.tertiary, fontSize: 9 },
  productName: { ...Typography.body3, color: Colors.text.primary, fontWeight: '600', lineHeight: 16 },
  productBrand: { ...Typography.body3, color: Colors.text.tertiary, fontSize: 10 },
  productFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  productPrice: { ...Typography.h4, color: Colors.gold.primary },
  productPriceTbd: { ...Typography.body3, color: Colors.gold.primary },
  productAiReason: { ...Typography.body3, color: Colors.text.tertiary, lineHeight: 15, marginTop: 3, fontSize: 10 },
  partnersSection: { paddingVertical: Spacing.lg, gap: Spacing.md },
  partnersLabel: { ...Typography.luxe, color: Colors.text.tertiary, paddingHorizontal: Spacing.md },
  partnersList: { paddingHorizontal: Spacing.md, gap: Spacing.sm },
  partnerChip: {},
  partnerChipInner: { paddingHorizontal: 20, paddingVertical: 12 },
  partnerChipText: { ...Typography.body3, color: Colors.text.secondary, fontWeight: '600' },
});
