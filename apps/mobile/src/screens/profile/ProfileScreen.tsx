import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../constants/theme';
import { GlassCard } from '../../components/common/GlassCard';
import { GoldButton } from '../../components/common/GoldButton';
import { useAppSelector } from '../../hooks/useAppDispatch';
import { AuthService } from '../../services/auth/authService';
import { ARCHETYPE_LABELS, PLANS } from '../../constants';

const { width } = Dimensions.get('window');

const TIER_GRADIENTS: Record<string, readonly [string, string]> = {
  FREE: ['#3A3A3A', '#1A1A1A'],
  ESSENTIAL: ['#4A90D9', '#1A4A8A'],
  STYLE: ['#D4AF37', '#A08020'],
  LUXE: ['#E8C84A', '#C8A020'],
};

const TIER_LABELS: Record<string, string> = {
  FREE: 'Free', ESSENTIAL: 'Essential', STYLE: 'Style', LUXE: 'Luxe ✦',
};

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const user = useAppSelector((s) => s.auth.user);
  const stats = useAppSelector((s) => s.wardrobe.stats);
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => AuthService.logout() },
    ]);
  };

  const archetype = (user?.styleDna as any)?.primaryArchetype;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Banner */}
        <View style={styles.hero}>
          <LinearGradient
            colors={TIER_GRADIENTS[user?.premiumTier || 'FREE']}
            style={styles.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
            ) : (
              <LinearGradient colors={['#D4AF37', '#A08020']} style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>{user?.displayName?.[0] || 'F'}</Text>
              </LinearGradient>
            )}
            <View style={styles.tierBadge}>
              <Text style={styles.tierBadgeText}>{TIER_LABELS[user?.premiumTier || 'FREE']}</Text>
            </View>
          </View>

          <Text style={styles.displayName}>{user?.displayName}</Text>
          <Text style={styles.username}>@{user?.username}</Text>

          {archetype && (
            <View style={styles.archetypeTag}>
              <Text style={styles.archetypeTagText}>
                {ARCHETYPE_LABELS[archetype] || archetype}
              </Text>
            </View>
          )}
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {[
            { value: stats?.totalItems || 0, label: 'Items' },
            { value: '—', label: 'Following' },
            { value: '—', label: 'Followers' },
          ].map((stat) => (
            <View key={stat.label} style={styles.statItem}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Style DNA Card */}
        {user?.styleDna && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>STYLE DNA</Text>
            <GlassCard variant="gold" style={styles.styleDnaCard}>
              <LinearGradient colors={['rgba(212,175,55,0.08)', 'transparent']} style={StyleSheet.absoluteFill} />
              <View style={styles.styleDnaInner}>
                <View style={styles.styleDnaHeader}>
                  <Text style={styles.styleDnaPrimary}>
                    {ARCHETYPE_LABELS[(user.styleDna as any).primaryArchetype] || (user.styleDna as any).primaryArchetype}
                  </Text>
                  <Text style={styles.styleDnaIconText}>✦</Text>
                </View>

                {(user.styleDna as any).secondaryArchetypes?.length > 0 && (
                  <View style={styles.secondaryArchetypes}>
                    {(user.styleDna as any).secondaryArchetypes.slice(0, 3).map((arch: string) => (
                      <View key={arch} style={styles.secondaryChip}>
                        <Text style={styles.secondaryChipText}>{ARCHETYPE_LABELS[arch] || arch}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {(user.styleDna as any).fashionAge && (
                  <Text style={styles.fashionAge}>"{(user.styleDna as any).fashionAge}"</Text>
                )}

                {(user.styleDna as any).strengths?.length > 0 && (
                  <View style={styles.strengthsList}>
                    <Text style={styles.strengthsTitle}>STRENGTHS</Text>
                    {(user.styleDna as any).strengths.slice(0, 3).map((s: string) => (
                      <Text key={s} style={styles.strengthItem}>✓ {s}</Text>
                    ))}
                  </View>
                )}
              </View>
            </GlassCard>
          </View>
        )}

        {/* Premium Upgrade */}
        {(!user?.isPremium || user.premiumTier === 'FREE') && (
          <View style={styles.section}>
            <GlassCard variant="gold" style={styles.upgradeCard}>
              <LinearGradient colors={['rgba(212,175,55,0.15)', 'transparent']} style={StyleSheet.absoluteFill} />
              <View style={styles.upgradeInner}>
                <Text style={styles.upgradeBadge}>✦ UPGRADE</Text>
                <Text style={styles.upgradeTitle}>Unlock the full FitCheck</Text>
                <Text style={styles.upgradeSub}>AI Stylist chat, Style DNA, unlimited items, shopping intelligence.</Text>
                <GoldButton title="View Plans →" onPress={() => {}} fullWidth />
              </View>
            </GlassCard>
          </View>
        )}

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PREFERENCES</Text>
          <GlassCard style={styles.settingsCard}>
            <SettingRow
              label="Daily Outfit Suggestions"
              sub="Morning push notification with AI picks"
              value={notificationsOn}
              onToggle={setNotificationsOn}
            />
            <View style={styles.settingDivider} />
            <SettingRow
              label="Weekly Style Report"
              sub="Sunday summary of your wardrobe intelligence"
              value={weeklyReport}
              onToggle={setWeeklyReport}
            />
          </GlassCard>
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>
          <GlassCard style={styles.settingsCard}>
            {[
              { label: 'Edit Profile', icon: '✏' },
              { label: 'Privacy Settings', icon: '🔒' },
              { label: 'Subscription & Billing', icon: '💳' },
              { label: 'Refer Friends', icon: '🎁' },
              { label: 'Help & Support', icon: '❓' },
            ].map((item, i) => (
              <React.Fragment key={item.label}>
                {i > 0 && <View style={styles.settingDivider} />}
                <TouchableOpacity style={styles.menuRow}>
                  <Text style={styles.menuIcon}>{item.icon}</Text>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Text style={styles.menuChevron}>›</Text>
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </GlassCard>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appVersion}>FitCheck v1.0 · Built with ✦</Text>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <GoldButton title="Sign Out" onPress={handleLogout} variant="danger" fullWidth />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

function SettingRow({ label, sub, value, onToggle }: any) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingSub}>{sub}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: Colors.background.elevated, true: Colors.gold.primary }}
        thumbColor={Colors.text.primary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  hero: { paddingBottom: Spacing.xl, alignItems: 'center', gap: Spacing.sm, overflow: 'hidden', position: 'relative' },
  heroGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 180, opacity: 0.3 },
  avatarContainer: { marginTop: Spacing.xl, position: 'relative' },
  avatar: { width: 96, height: 96, borderRadius: 48, borderWidth: 3, borderColor: Colors.gold.primary },
  avatarPlaceholder: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 36, fontWeight: '700', color: '#0A0A0B' },
  tierBadge: { position: 'absolute', bottom: -4, right: -8, backgroundColor: Colors.gold.primary, paddingHorizontal: 10, paddingVertical: 3, borderRadius: Radius.full },
  tierBadgeText: { fontSize: 10, fontWeight: '800', color: '#0A0A0B' },
  displayName: { ...Typography.h2, color: Colors.text.primary },
  username: { ...Typography.body2, color: Colors.text.tertiary },
  archetypeTag: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.gold.primary, backgroundColor: Colors.gold.muted },
  archetypeTagText: { ...Typography.label, color: Colors.gold.primary },
  statsRow: { flexDirection: 'row', paddingHorizontal: Spacing.md, paddingVertical: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border.subtle },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { ...Typography.h2, color: Colors.text.primary },
  statLabel: { ...Typography.body3, color: Colors.text.tertiary },
  section: { paddingHorizontal: Spacing.md, marginTop: Spacing.xl, gap: Spacing.md },
  sectionTitle: { ...Typography.luxe, color: Colors.text.tertiary },
  styleDnaCard: { overflow: 'hidden' },
  styleDnaInner: { padding: Spacing.lg, gap: Spacing.md },
  styleDnaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  styleDnaPrimary: { ...Typography.h2, color: Colors.gold.primary },
  styleDnaIconText: { fontSize: 24, color: Colors.gold.primary },
  secondaryArchetypes: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  secondaryChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full, backgroundColor: Colors.background.elevated, borderWidth: 1, borderColor: Colors.border.default },
  secondaryChipText: { ...Typography.body3, color: Colors.text.secondary },
  fashionAge: { ...Typography.body2, color: Colors.text.secondary, fontStyle: 'italic', lineHeight: 22 },
  strengthsList: { gap: Spacing.xs },
  strengthsTitle: { ...Typography.luxe, color: Colors.text.tertiary, marginBottom: 4 },
  strengthItem: { ...Typography.body3, color: Colors.text.secondary },
  upgradeCard: { overflow: 'hidden' },
  upgradeInner: { padding: Spacing.lg, gap: Spacing.md },
  upgradeBadge: { ...Typography.luxe, color: Colors.gold.primary },
  upgradeTitle: { ...Typography.h3, color: Colors.text.primary },
  upgradeSub: { ...Typography.body2, color: Colors.text.secondary, lineHeight: 22 },
  settingsCard: {},
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.md },
  settingInfo: { flex: 1 },
  settingLabel: { ...Typography.body2, color: Colors.text.primary, fontWeight: '500' },
  settingSub: { ...Typography.body3, color: Colors.text.tertiary, marginTop: 2 },
  settingDivider: { height: 1, backgroundColor: Colors.border.subtle, marginHorizontal: Spacing.md },
  menuRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.md },
  menuIcon: { fontSize: 18, width: 24, textAlign: 'center' },
  menuLabel: { flex: 1, ...Typography.body2, color: Colors.text.primary },
  menuChevron: { fontSize: 20, color: Colors.text.tertiary },
  appInfo: { alignItems: 'center', paddingVertical: Spacing.lg },
  appVersion: { ...Typography.body3, color: Colors.text.tertiary },
});
