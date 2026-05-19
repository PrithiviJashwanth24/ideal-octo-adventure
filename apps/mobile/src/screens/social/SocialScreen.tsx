import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { GlassCard } from '../../components/common/GlassCard';
import { GoldButton } from '../../components/common/GoldButton';
import { gqlRequest } from '../../services/graphql';
import { useAppSelector } from '../../hooks/useAppDispatch';
import { ARCHETYPE_LABELS } from '../../constants';

const { width } = Dimensions.get('window');

const FEED_QUERY = `
  query Feed($limit: Int, $offset: Int) {
    socialFeed(limit: $limit, offset: $offset) {
      id imageUrl caption likeCount commentCount createdAt
      user { id displayName username avatarUrl }
      outfit { id name items { id name category thumbnailUrl } }
    }
  }
`;

const STYLE_CIRCLES_DATA = [
  { id: '1', name: 'Quiet Luxury', members: 12400, icon: '🤍' },
  { id: '2', name: 'Clean Fit Gang', members: 8700, icon: '⚡' },
  { id: '3', name: 'Old Money Aesthetic', members: 21000, icon: '🏛' },
  { id: '4', name: 'Streetwear Culture', members: 45000, icon: '🔥' },
];

export function SocialScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<any>();
  const user = useAppSelector((s) => s.auth.user);
  const [feed, setFeed] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'feed' | 'circles' | 'discover'>('feed');
  const [refreshing, setRefreshing] = useState(false);
  const [offset, setOffset] = useState(0);

  useEffect(() => { fetchFeed(); }, []);

  const fetchFeed = async () => {
    try {
      const data = await gqlRequest<{ socialFeed: any[] }>(FEED_QUERY, { limit: 20, offset: 0 });
      setFeed(data.socialFeed || []);
    } catch (e) { /* feed may be empty */ }
    setRefreshing(false);
  };

  const onRefresh = () => { setRefreshing(true); fetchFeed(); };

  const renderFeedItem = ({ item }: { item: any }) => (
    <GlassCard style={styles.feedCard}>
      <View style={styles.feedHeader}>
        <View style={styles.feedAvatar}>
          {item.user?.avatarUrl ? (
            <Image source={{ uri: item.user.avatarUrl }} style={styles.avatarImg} />
          ) : (
            <LinearGradient colors={['#D4AF37', '#A08020']} style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>{item.user?.displayName?.[0] || '?'}</Text>
            </LinearGradient>
          )}
        </View>
        <View style={styles.feedUserInfo}>
          <Text style={styles.feedUserName}>{item.user?.displayName}</Text>
          <Text style={styles.feedUserHandle}>@{item.user?.username}</Text>
        </View>
        <TouchableOpacity style={styles.followBtn}>
          <Text style={styles.followBtnText}>Follow</Text>
        </TouchableOpacity>
      </View>

      {item.imageUrl && (
        <Image source={{ uri: item.imageUrl }} style={styles.feedImage} contentFit="cover" />
      )}

      {item.outfit && (
        <View style={styles.outfitStrip}>
          <Text style={styles.outfitStripLabel}>OUTFIT</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.outfitItems}>
            {item.outfit.items?.map((oi: any) => (
              <View key={oi.id} style={styles.outfitItemChip}>
                {oi.thumbnailUrl && <Image source={{ uri: oi.thumbnailUrl }} style={styles.outfitItemImg} />}
                <Text style={styles.outfitItemName}>{oi.name}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.feedFooter}>
        <TouchableOpacity style={styles.feedAction} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
          <Text style={styles.feedActionIcon}>♥</Text>
          <Text style={styles.feedActionCount}>{item.likeCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.feedAction}>
          <Text style={styles.feedActionIcon}>💬</Text>
          <Text style={styles.feedActionCount}>{item.commentCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.feedAction}>
          <Text style={styles.feedActionIcon}>✦</Text>
          <Text style={styles.feedActionCount}>Rate Fit</Text>
        </TouchableOpacity>
      </View>
    </GlassCard>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>STYLE SOCIAL</Text>
        <TouchableOpacity style={styles.searchBtn}>
          <Text style={styles.searchIcon}>⌕</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['feed', 'circles', 'discover'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'feed' && (
        <FlatList
          data={feed}
          keyExtractor={(item) => item.id}
          renderItem={renderFeedItem}
          contentContainerStyle={styles.feedList}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyFeed}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyTitle}>Your feed is empty</Text>
              <Text style={styles.emptySub}>Follow people to see their fits here</Text>
              <GoldButton title="Discover People" onPress={() => setActiveTab('discover')} />
            </View>
          }
          ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
        />
      )}

      {activeTab === 'circles' && (
        <ScrollView contentContainerStyle={styles.circlesContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.circlesSectionTitle}>STYLE CIRCLES</Text>
          <Text style={styles.circlesSubtitle}>Join communities that match your aesthetic</Text>

          {STYLE_CIRCLES_DATA.map((circle) => (
            <TouchableOpacity key={circle.id}>
              <GlassCard style={styles.circleCard}>
                <View style={styles.circleCardInner}>
                  <Text style={styles.circleIcon}>{circle.icon}</Text>
                  <View style={styles.circleInfo}>
                    <Text style={styles.circleName}>{circle.name}</Text>
                    <Text style={styles.circleMembers}>{(circle.members / 1000).toFixed(1)}K members</Text>
                  </View>
                  <TouchableOpacity style={styles.joinBtn}>
                    <LinearGradient colors={['#D4AF37', '#A08020']} style={styles.joinBtnGradient}>
                      <Text style={styles.joinBtnText}>Join</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </GlassCard>
            </TouchableOpacity>
          ))}

          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {activeTab === 'discover' && (
        <ScrollView contentContainerStyle={styles.discoverContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.discoverTitle}>TRENDING FITS</Text>

          {/* Trending placeholder grid */}
          <View style={styles.trendingGrid}>
            {Array.from({ length: 6 }).map((_, i) => (
              <TouchableOpacity key={i} style={styles.trendingItem}>
                <GlassCard style={styles.trendingCard}>
                  <View style={styles.trendingPlaceholder}>
                    <Text style={styles.trendingIcon}>✦</Text>
                  </View>
                </GlassCard>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.discoverTitle, { marginTop: Spacing.xl }]}>TOP STYLE ARCHETYPES THIS WEEK</Text>
          {['Quiet Luxury', 'Clean Fit', 'Old Money'].map((arch, i) => (
            <GlassCard key={arch} style={styles.archCard}>
              <View style={styles.archCardInner}>
                <Text style={styles.archRank}>#{i + 1}</Text>
                <Text style={styles.archName}>{arch}</Text>
                <Text style={styles.archTrend}>↑ {[23, 18, 15][i]}%</Text>
              </View>
            </GlassCard>
          ))}

          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </View>
  );
}

const THUMB_SIZE = (width - Spacing.md * 2 - Spacing.sm * 2) / 3;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.md },
  headerTitle: { ...Typography.luxe, color: Colors.text.primary, fontSize: 14, letterSpacing: 3 },
  searchBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  searchIcon: { fontSize: 22, color: Colors.text.secondary },
  tabs: { flexDirection: 'row', paddingHorizontal: Spacing.md, marginBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border.subtle },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.gold.primary },
  tabText: { ...Typography.body3, color: Colors.text.tertiary, fontWeight: '600' },
  tabTextActive: { color: Colors.gold.primary },
  feedList: { paddingHorizontal: Spacing.md, paddingBottom: 100 },
  feedCard: {},
  feedHeader: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.sm },
  feedAvatar: { width: 40, height: 40, borderRadius: 20, overflow: 'hidden' },
  avatarImg: { width: '100%', height: '100%' },
  avatarPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 16, fontWeight: '700', color: '#0A0A0B' },
  feedUserInfo: { flex: 1 },
  feedUserName: { ...Typography.body3, color: Colors.text.primary, fontWeight: '600' },
  feedUserHandle: { ...Typography.body3, color: Colors.text.tertiary, fontSize: 10 },
  followBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.gold.primary },
  followBtnText: { ...Typography.body3, color: Colors.gold.primary, fontWeight: '600' },
  feedImage: { width: '100%', aspectRatio: 0.8 },
  outfitStrip: { padding: Spacing.sm, gap: Spacing.xs },
  outfitStripLabel: { ...Typography.luxe, color: Colors.text.tertiary, paddingHorizontal: Spacing.xs },
  outfitItems: { gap: Spacing.sm, paddingHorizontal: Spacing.xs },
  outfitItemChip: { backgroundColor: Colors.background.elevated, borderRadius: Radius.sm, padding: 8, minWidth: 70, alignItems: 'center', gap: 4 },
  outfitItemImg: { width: 32, height: 32, borderRadius: 4 },
  outfitItemName: { ...Typography.body3, color: Colors.text.secondary, fontSize: 9, textAlign: 'center' },
  feedFooter: { flexDirection: 'row', padding: Spacing.md, gap: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border.subtle },
  feedAction: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  feedActionIcon: { fontSize: 16, color: Colors.text.secondary },
  feedActionCount: { ...Typography.body3, color: Colors.text.secondary },
  emptyFeed: { alignItems: 'center', paddingVertical: 60, gap: Spacing.md, paddingHorizontal: Spacing.xl },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { ...Typography.h3, color: Colors.text.primary },
  emptySub: { ...Typography.body2, color: Colors.text.tertiary, textAlign: 'center' },
  circlesContent: { paddingHorizontal: Spacing.md, gap: Spacing.md, paddingBottom: 100 },
  circlesSectionTitle: { ...Typography.luxe, color: Colors.text.tertiary },
  circlesSubtitle: { ...Typography.body2, color: Colors.text.secondary },
  circleCard: {},
  circleCardInner: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.md },
  circleIcon: { fontSize: 28 },
  circleInfo: { flex: 1 },
  circleName: { ...Typography.h4, color: Colors.text.primary },
  circleMembers: { ...Typography.body3, color: Colors.text.tertiary },
  joinBtn: {},
  joinBtnGradient: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full },
  joinBtnText: { ...Typography.label, color: '#0A0A0B' },
  discoverContent: { paddingHorizontal: Spacing.md, gap: Spacing.md, paddingBottom: 100 },
  discoverTitle: { ...Typography.luxe, color: Colors.text.tertiary },
  trendingGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  trendingItem: { width: THUMB_SIZE },
  trendingCard: { aspectRatio: 0.75, overflow: 'hidden' },
  trendingPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background.tertiary },
  trendingIcon: { fontSize: 24, color: Colors.gold.primary },
  archCard: {},
  archCardInner: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md },
  archRank: { width: 32, ...Typography.h3, color: Colors.gold.primary },
  archName: { flex: 1, ...Typography.h4, color: Colors.text.primary },
  archTrend: { ...Typography.body3, color: Colors.success, fontWeight: '700' },
});
