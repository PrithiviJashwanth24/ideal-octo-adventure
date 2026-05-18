import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { GlassCard } from '../../components/common/GlassCard';
import { GoldButton } from '../../components/common/GoldButton';
import { useAppSelector, useAppDispatch } from '../../hooks/useAppDispatch';
import { OutfitRecommendationCard } from '../../components/outfit/OutfitRecommendationCard';
import { WardrobeStatsCard } from '../../components/analytics/WardrobeStatsCard';
import { AIStyleTip } from '../../components/ai/AIStyleTip';

const { width } = Dimensions.get('window');

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<any>();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const recommendations = useAppSelector((s) => s.outfit.todayRecommendations);
  const stats = useAppSelector((s) => s.wardrobe.stats);
  const isGenerating = useAppSelector((s) => s.outfit.isGenerating);

  const scrollY = useRef(new Animated.Value(0)).current;
  const [refreshing, setRefreshing] = React.useState(false);

  const headerOpacity = scrollY.interpolate({ inputRange: [0, 80], outputRange: [0, 1], extrapolate: 'clamp' });
  const heroScale = scrollY.interpolate({ inputRange: [-100, 0], outputRange: [1.1, 1], extrapolate: 'clamp' });

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Sticky header blur */}
      <Animated.View style={[styles.stickyHeader, { opacity: headerOpacity }]}>
        <Text style={styles.stickyTitle}>FitCheck</Text>
      </Animated.View>

      <Animated.ScrollView
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <LinearGradient
            colors={['rgba(212,175,55,0.08)', 'transparent']}
            style={styles.heroGlow}
          />
          <View style={styles.heroContent}>
            <Text style={styles.greeting}>{greeting()},</Text>
            <Text style={styles.userName}>{user?.displayName?.split(' ')[0]}.</Text>
            <Text style={styles.heroSubtitle}>Your appearance OS is ready.</Text>
          </View>
        </View>

        {/* Today's Outfit Recommendations */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>TODAY'S FITS</Text>
            <TouchableOpacity onPress={() => nav.navigate('Stylist')}>
              <Text style={styles.sectionLink}>All →</Text>
            </TouchableOpacity>
          </View>

          {recommendations ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.outfitScroll}>
              {[
                { key: 'safe', label: 'SAFE FIT', data: recommendations.safe },
                { key: 'statement', label: 'STATEMENT', data: recommendations.statement },
                { key: 'stealthLuxury', label: 'STEALTH LUXE', data: recommendations.stealthLuxury },
                { key: 'dateNight', label: 'DATE NIGHT', data: recommendations.dateNight },
                { key: 'boardroom', label: 'BOARDROOM', data: recommendations.boardroom },
              ]
                .filter((o) => o.data)
                .map((o) => (
                  <OutfitRecommendationCard
                    key={o.key}
                    outfit={o.data}
                    label={o.label}
                    onPress={() => nav.navigate('OutfitDetail', { outfitId: o.data.id })}
                  />
                ))}
            </ScrollView>
          ) : (
            <GlassCard style={styles.generateCard}>
              <View style={{ padding: Spacing.xl, alignItems: 'center', gap: Spacing.md }}>
                <Text style={styles.generateTitle}>
                  {isGenerating ? 'Your AI Stylist is thinking…' : 'Ready for today\'s fits?'}
                </Text>
                <Text style={styles.generateSub}>
                  FitCheck analyzes your calendar, weather, and wardrobe to build your perfect outfits.
                </Text>
                <GoldButton
                  title={isGenerating ? 'Generating…' : 'Generate Outfits'}
                  onPress={() => nav.navigate('Stylist')}
                  isLoading={isGenerating}
                  fullWidth
                />
              </View>
            </GlassCard>
          )}
        </View>

        {/* AI Style Tip */}
        <View style={styles.section}>
          <AIStyleTip />
        </View>

        {/* Wardrobe Stats */}
        {stats && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>CLOSET INTELLIGENCE</Text>
              <TouchableOpacity onPress={() => nav.navigate('Analytics')}>
                <Text style={styles.sectionLink}>Full Report →</Text>
              </TouchableOpacity>
            </View>
            <WardrobeStatsCard stats={stats} />
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
          <View style={styles.quickActions}>
            {[
              { label: 'Log Outfit', icon: '📸', screen: 'LogOutfit' },
              { label: 'Add Item', icon: '➕', screen: 'AddItem' },
              { label: 'AI Stylist', icon: '✨', screen: 'Stylist' },
              { label: 'Shop Gaps', icon: '🛍', screen: 'Shop' },
            ].map((action) => (
              <TouchableOpacity
                key={action.label}
                style={styles.quickAction}
                onPress={() => nav.navigate(action.screen)}
              >
                <GlassCard style={styles.quickActionCard}>
                  <View style={styles.quickActionInner}>
                    <Text style={styles.quickActionIcon}>{action.icon}</Text>
                    <Text style={styles.quickActionLabel}>{action.label}</Text>
                  </View>
                </GlassCard>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
    backgroundColor: 'rgba(10,10,11,0.9)',
    alignItems: 'center',
  },
  stickyTitle: {
    ...Typography.h3,
    color: Colors.gold.primary,
    letterSpacing: 3,
  },
  hero: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    top: 0,
    left: -50,
    right: -50,
    height: 200,
  },
  heroContent: { gap: 4 },
  greeting: {
    ...Typography.body2,
    color: Colors.text.secondary,
    letterSpacing: 0.5,
  },
  userName: {
    fontSize: 40,
    fontWeight: '700',
    color: Colors.text.primary,
    letterSpacing: -1.5,
  },
  heroSubtitle: {
    ...Typography.body2,
    color: Colors.text.tertiary,
    marginTop: 4,
  },
  section: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    ...Typography.luxe,
    color: Colors.text.secondary,
  },
  sectionLink: {
    ...Typography.body3,
    color: Colors.gold.primary,
  },
  outfitScroll: {
    paddingRight: Spacing.md,
    gap: Spacing.md,
  },
  generateCard: { marginTop: 0 },
  generateTitle: {
    ...Typography.h3,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  generateSub: {
    ...Typography.body2,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  quickAction: {
    width: (width - Spacing.md * 2 - Spacing.sm) / 2,
  },
  quickActionCard: {
    aspectRatio: 1.8,
  },
  quickActionInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  quickActionIcon: { fontSize: 28 },
  quickActionLabel: {
    ...Typography.body3,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
});
