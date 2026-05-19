import * as admin from 'firebase-admin';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { pubsub, EVENTS } from '../api/graphql/resolvers/subscriptions';

// Initialize Firebase Admin once
let firebaseApp: admin.app.App;

function getFirebaseApp(): admin.app.App {
  if (!firebaseApp && process.env.FIREBASE_PROJECT_ID) {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  }
  return firebaseApp;
}

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

export class NotificationService {
  static async sendPush(userId: string, payload: PushPayload): Promise<void> {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return;

      // Store in DB
      const notification = await prisma.notification.create({
        data: {
          userId,
          type: 'SYSTEM',
          title: payload.title,
          body: payload.body,
          data: payload.data,
        },
      });

      // Publish to GraphQL subscription
      pubsub.publish(`${EVENTS.NOTIFICATION}:${userId}`, {
        notificationReceived: notification,
      });

      // Firebase push (if token stored — skip for now, store FCM tokens in production)
      logger.info(`Notification sent to ${userId}: ${payload.title}`);
    } catch (err) {
      logger.error('Push notification failed', { userId, err });
    }
  }

  static async sendOutfitSuggestionNotification(userId: string): Promise<void> {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : 'Good afternoon';

    await NotificationService.sendPush(userId, {
      title: `${greeting} ✦`,
      body: "Your AI Stylist has picked today's outfits. Tap to see your fits.",
      data: { screen: 'Stylist', action: 'open_recommendations' },
    });
  }

  static async sendWeeklyReportNotification(userId: string): Promise<void> {
    await NotificationService.sendPush(userId, {
      title: 'Your Weekly Style Report ✦',
      body: 'Your wardrobe intelligence report is ready. See your insights.',
      data: { screen: 'Analytics', action: 'open_report' },
    });
  }

  static async sendLaundryReminderNotification(userId: string, dirtyCount: number): Promise<void> {
    await NotificationService.sendPush(userId, {
      title: `${dirtyCount} items need washing`,
      body: "Some of your outfit essentials are dirty. Time to do laundry.",
      data: { screen: 'Wardrobe', action: 'filter_dirty' },
    });
  }

  static async sendAchievementNotification(userId: string, achievementName: string): Promise<void> {
    await NotificationService.sendPush(userId, {
      title: `🏆 Achievement Unlocked`,
      body: `You earned "${achievementName}". Keep building your style.`,
      data: { screen: 'Profile', action: 'view_badges' },
    });
  }

  static async sendSocialNotification(userId: string, fromUserName: string, action: string): Promise<void> {
    await NotificationService.sendPush(userId, {
      title: `${fromUserName} ${action}`,
      body: 'Tap to view their profile.',
      data: { screen: 'Social' },
    });
  }

  static async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({ where: { userId, read: false } });
  }

  static async markAllRead(userId: string): Promise<void> {
    await prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
  }
}
