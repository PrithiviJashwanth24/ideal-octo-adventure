import { PubSub } from 'graphql-subscriptions';

export const pubsub = new PubSub();

export const EVENTS = {
  OUTFIT_READY: 'OUTFIT_RECOMMENDATION_READY',
  NOTIFICATION: 'NOTIFICATION_RECEIVED',
  WARDROBE_ANALYZED: 'WARDROBE_ITEM_ANALYZED',
} as const;

export const subscriptionResolvers = {
  Subscription: {
    outfitRecommendationReady: {
      subscribe: (_: unknown, { userId }: { userId: string }) =>
        pubsub.asyncIterator(`${EVENTS.OUTFIT_READY}:${userId}`),
    },
    notificationReceived: {
      subscribe: (_: unknown, { userId }: { userId: string }) =>
        pubsub.asyncIterator(`${EVENTS.NOTIFICATION}:${userId}`),
    },
    wardrobeItemAnalyzed: {
      subscribe: (_: unknown, { itemId }: { itemId: string }) =>
        pubsub.asyncIterator(`${EVENTS.WARDROBE_ANALYZED}:${itemId}`),
    },
  },
};
