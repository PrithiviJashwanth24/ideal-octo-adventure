import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { useAppSelector, useAppDispatch } from '../../hooks/useAppDispatch';
import { setCategory, setSearchQuery, toggleFavorite } from '../../store/slices/wardrobeSlice';
import { GlassCard } from '../../components/common/GlassCard';
import { CATEGORY_LABELS } from '../../constants';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - Spacing.md * 2 - Spacing.sm) / 2;

const CATEGORIES = ['ALL', ...Object.keys(CATEGORY_LABELS).slice(0, 8)];

export function WardrobeScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<any>();
  const dispatch = useAppDispatch();
  const items = useAppSelector((s) => s.wardrobe.items);
  const selectedCategory = useAppSelector((s) => s.wardrobe.selectedCategory);
  const searchQuery = useAppSelector((s) => s.wardrobe.searchQuery);
  const stats = useAppSelector((s) => s.wardrobe.stats);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredItems = items.filter((item) => {
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    const matchesSearch = !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brand?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch && !item.isArchived;
  });

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  };

  const renderItem = useCallback(({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => nav.navigate('ItemDetail', { itemId: item.id })}
      onLongPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        dispatch(toggleFavorite(item.id));
      }}
    >
      <GlassCard style={styles.itemCard}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: item.images?.[0]?.url || item.thumbnailUrl }}
            style={styles.itemImage}
            contentFit="cover"
            transition={200}
          />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={styles.imageGradient} />
          {item.isFavorite && <Text style={styles.favoriteIcon}>★</Text>}
          <View style={[styles.laundryDot, { backgroundColor: item.laundryStatus === 'CLEAN' ? Colors.success : Colors.warning }]} />
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
          {item.brand && <Text style={styles.itemBrand}>{item.brand}</Text>}
          <View style={styles.itemMeta}>
            <Text style={styles.wearCount}>{item.wearCount}×</Text>
            <View style={styles.versatilityBar}>
              <View style={[styles.versatilityFill, { width: `${item.versatilityScore * 100}%` }]} />
            </View>
          </View>
        </View>
      </GlassCard>
    </TouchableOpacity>
  ), [nav, dispatch]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>MY WARDROBE</Text>
          <Text style={styles.headerCount}>{filteredItems.length} items</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')} style={styles.iconButton}>
            <Text style={styles.iconText}>{viewMode === 'grid' ? '≡' : '⊞'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => nav.navigate('AddItem')} style={styles.addButton}>
            <LinearGradient colors={['#D4AF37', '#A08020']} style={styles.addButtonGradient}>
              <Text style={styles.addButtonText}>+</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Strip */}
      {stats && (
        <View style={styles.statsStrip}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{Math.round(stats.utilizationRate * 100)}%</Text>
            <Text style={styles.statLabel}>UTILIZED</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.neglectedItemCount}</Text>
            <Text style={styles.statLabel}>NEGLECTED</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: Colors.gold.primary }]}>
              {Math.round(stats.closetHealthScore * 100)}
            </Text>
            <Text style={styles.statLabel}>HEALTH</Text>
          </View>
        </View>
      )}

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search your wardrobe…"
          placeholderTextColor={Colors.text.tertiary}
          value={searchQuery}
          onChangeText={(t) => dispatch(setSearchQuery(t))}
        />
      </View>

      {/* Category Filter */}
      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryList}
        renderItem={({ item: cat }) => (
          <TouchableOpacity
            onPress={() => dispatch(setCategory(cat === 'ALL' ? null : cat))}
            style={[
              styles.categoryChip,
              (cat === 'ALL' ? !selectedCategory : selectedCategory === cat) && styles.categoryChipActive,
            ]}
          >
            <Text
              style={[
                styles.categoryChipText,
                (cat === 'ALL' ? !selectedCategory : selectedCategory === cat) && styles.categoryChipTextActive,
              ]}
            >
              {cat === 'ALL' ? 'All' : CATEGORY_LABELS[cat]}
            </Text>
          </TouchableOpacity>
        )}
        style={styles.categoryScroll}
      />

      {/* Items Grid */}
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>👗</Text>
            <Text style={styles.emptyTitle}>Your wardrobe is empty</Text>
            <Text style={styles.emptySubtitle}>Add your first item to start building your digital closet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.md },
  headerLabel: { ...Typography.luxe, color: Colors.text.tertiary },
  headerCount: { ...Typography.h2, color: Colors.text.primary, marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  iconButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  iconText: { fontSize: 20, color: Colors.text.secondary },
  addButton: { },
  addButtonGradient: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  addButtonText: { fontSize: 24, fontWeight: '300', color: '#0A0A0B' },
  statsStrip: { flexDirection: 'row', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, marginBottom: Spacing.sm },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { ...Typography.h3, color: Colors.text.primary },
  statLabel: { ...Typography.luxe, color: Colors.text.tertiary, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: Colors.border.subtle, marginVertical: 4 },
  searchContainer: { paddingHorizontal: Spacing.md, marginBottom: Spacing.sm },
  searchInput: {
    backgroundColor: Colors.background.elevated,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    ...Typography.body2,
  },
  categoryScroll: { marginBottom: Spacing.sm },
  categoryList: { paddingHorizontal: Spacing.md, gap: Spacing.sm },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.background.elevated,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  categoryChipActive: { backgroundColor: Colors.gold.muted, borderColor: Colors.gold.primary },
  categoryChipText: { ...Typography.body3, color: Colors.text.secondary, fontWeight: '500' },
  categoryChipTextActive: { color: Colors.gold.primary, fontWeight: '700' },
  list: { paddingHorizontal: Spacing.md, paddingBottom: 100 },
  row: { gap: Spacing.sm, marginBottom: Spacing.sm },
  itemContainer: { width: ITEM_WIDTH },
  itemCard: { overflow: 'hidden' },
  imageContainer: { position: 'relative', aspectRatio: 0.75 },
  itemImage: { width: '100%', height: '100%' },
  imageGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80 },
  favoriteIcon: { position: 'absolute', top: 8, right: 8, fontSize: 16, color: Colors.gold.primary },
  laundryDot: { position: 'absolute', top: 8, left: 8, width: 8, height: 8, borderRadius: 4 },
  itemInfo: { padding: 10, gap: 4 },
  itemName: { ...Typography.body3, color: Colors.text.primary, fontWeight: '600' },
  itemBrand: { ...Typography.body3, color: Colors.text.tertiary, fontSize: 10 },
  itemMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  wearCount: { ...Typography.body3, color: Colors.gold.primary, fontSize: 10, fontWeight: '700' },
  versatilityBar: { flex: 1, height: 2, backgroundColor: Colors.background.elevated, borderRadius: 1 },
  versatilityFill: { height: '100%', backgroundColor: Colors.gold.primary, borderRadius: 1 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: Spacing.md },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { ...Typography.h3, color: Colors.text.primary },
  emptySubtitle: { ...Typography.body2, color: Colors.text.tertiary, textAlign: 'center', paddingHorizontal: Spacing.xl },
});
