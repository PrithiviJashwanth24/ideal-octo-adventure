import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
  typescript: true,
});

export const PLANS = {
  ESSENTIAL: {
    monthly: 'price_essential_monthly',
    annual: 'price_essential_annual',
    price: 9.99,
    features: [
      'Up to 200 wardrobe items',
      'Daily AI outfit suggestions',
      'Basic wardrobe analytics',
      'Laundry tracking',
    ],
  },
  STYLE: {
    monthly: 'price_style_monthly',
    annual: 'price_style_annual',
    price: 24.99,
    features: [
      'Unlimited wardrobe items',
      'Full AI Stylist chat (unlimited)',
      'Advanced analytics & reports',
      'AI packing lists',
      'Shopping recommendations',
      'Social style circles',
      'Style DNA analysis',
      'Priority AI processing',
    ],
  },
  LUXE: {
    monthly: 'price_luxe_monthly',
    annual: 'price_luxe_annual',
    price: 79.99,
    features: [
      'Everything in Style',
      'Personal AI Stylist calls',
      'White-glove wardrobe curation',
      'Luxury brand previews',
      'First access to new features',
      'Creator dashboard',
      'Affiliate commission program',
      'Concierge support',
    ],
  },
} as const;

export async function createOrRetrieveCustomer(userId: string, email: string): Promise<string> {
  const customers = await stripe.customers.list({ email, limit: 1 });
  if (customers.data.length > 0) return customers.data[0].id;

  const customer = await stripe.customers.create({
    email,
    metadata: { userId },
  });
  return customer.id;
}
