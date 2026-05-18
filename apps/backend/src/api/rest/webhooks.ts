import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' });
export const webhookRouter = Router();

webhookRouter.post(
  '/stripe',
  (req, res, next) => {
    let rawBody = '';
    req.on('data', (chunk) => (rawBody += chunk));
    req.on('end', () => {
      (req as any).rawBody = rawBody;
      next();
    });
  },
  async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        (req as any).rawBody,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      logger.error('Stripe webhook signature failed', err);
      return res.status(400).send('Webhook Error');
    }

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata.userId;
        const tier = sub.metadata.tier || 'ESSENTIAL';
        await prisma.user.update({
          where: { id: userId },
          data: { isPremium: sub.status === 'active', premiumTier: tier as any },
        });
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata.userId;
        await prisma.user.update({
          where: { id: userId },
          data: { isPremium: false, premiumTier: 'FREE' },
        });
        break;
      }
    }

    res.json({ received: true });
  }
);
