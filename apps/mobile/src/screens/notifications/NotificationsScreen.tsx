import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useQuery, useMutation, gql } from '@apollo/client';
import { formatDistanceToNow } from 'date-fns';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';

const NOTIFICATIONS = gql`
  query Notifications {
    notifications(limit: 50) {
      id
      type
      title
      body
      read
      createdAt
      data
    }
  }
`;

const MARK_ALL_READ = gql`
  mutation MarkAllNotificationsRead {
    markAllNotificationsRead
  }
`;

const TYPE_ICON: Record<string, string> = {
  SYSTEM: '◎',
  OUTFIT: '✦',
  SOCIAL: '◉',
  ACHIEVEMENT: '🏆',
  LAUNDRY: '○',
  REPORT: '▦',
};

const TYPE_COLOR: Record<string, string> = {
  SYSTEM: Colors.text.tertiary,
  OUTFIT: Colors.gold.primary,
  SOCIAL: '#A78BFA',
  ACHIEVEMENT: Colors.gold.primary,
  LAUNDRY: '#60A5FA',
  REPORT: '#34D399',
};

export default function NotificationsScreen({ navigation }: any) {
  const { data, refetch } = useQuery(NOTIFICATIONS);
  const [markAllRead] = useMutation(MARK_ALL_READ, { onCompleted: () => refetch() });

  const notifications = data?.notifications || [];
  const unreadCount = notifications.filter((n: any) => !n.read).length;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0A0B', '#111113']} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={() => markAllRead()}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {notifications.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>◎</Text>
          <Text style={styles.emptyText}>All caught up</Text>
          <Text style={styles.emptySubtext}>Your AI stylist will notify you here.</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <BlurView
              intensity={item.read ? 8 : 15}
              tint="dark"
              style={[styles.notifCard, !item.read && styles.notifCardUnread]}
            >
              <View style={styles.notifLeft}>
                <Text
                  style={[
                    styles.notifIcon,
                    { color: TYPE_COLOR[item.type] || Colors.text.tertiary },
                  ]}
                >
                  {TYPE_ICON[item.type] || '·'}
                </Text>
              </View>
              <View style={styles.notifBody}>
                <Text style={[styles.notifTitle, !item.read && styles.notifTitleUnread]}>
                  {item.title}
                </Text>
                <Text style={styles.notifText}>{item.body}</Text>
                <Text style={styles.notifTime}>
                  {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                </Text>
              </View>
              {!item.read && <View style={styles.unreadDot} />}
            </BlurView>
          )}
        />
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
    paddingBottom: Spacing[4],
  },
  backBtn: { marginRight: Spacing[4] },
  backText: { ...Typography.h3, color: Colors.text.primary },
  title: { ...Typography.h3, color: Colors.text.primary, flex: 1 },
  markAllText: { ...Typography.body3, color: Colors.gold.primary },
  list: { padding: Spacing[5], gap: Spacing[3] },
  notifCard: {
    flexDirection: 'row',
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    overflow: 'hidden',
    padding: Spacing[4],
    gap: Spacing[4],
    alignItems: 'flex-start',
  },
  notifCardUnread: { borderColor: 'rgba(212,175,55,0.3)' },
  notifLeft: { paddingTop: 2 },
  notifIcon: { fontSize: 18 },
  notifBody: { flex: 1 },
  notifTitle: { ...Typography.label, color: Colors.text.secondary, marginBottom: 4 },
  notifTitleUnread: { color: Colors.text.primary },
  notifText: { ...Typography.body3, color: Colors.text.tertiary, lineHeight: 20, marginBottom: 6 },
  notifTime: { ...Typography.mono, fontSize: 10, color: Colors.text.tertiary, letterSpacing: 0.5 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.gold.primary,
    marginTop: 6,
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing[3] },
  emptyIcon: { fontSize: 48, color: Colors.border.subtle },
  emptyText: { ...Typography.h3, color: Colors.text.secondary },
  emptySubtext: { ...Typography.body2, color: Colors.text.tertiary },
});
