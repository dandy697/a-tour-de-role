import Stripe from "stripe";

// Lazy singleton — avoids crashing at build/import time when STRIPE_SECRET_KEY is not set
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY environment variable is not set");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-04-22.dahlia",
    });
  }
  return _stripe;
}

// Keep named export for direct use in webhook handler where key is guaranteed
export { _stripe as stripe };

export const PLANS = {
  free: {
    name: "Gratuit",
    priceMonthly: 0,
    stripePriceId: null,
  },
  pro: {
    name: "Pro",
    priceMonthly: 4.99,
    stripePriceId: process.env.STRIPE_PRICE_PRO,
  },
  premium: {
    name: "Premium",
    priceMonthly: 9.99,
    stripePriceId: process.env.STRIPE_PRICE_PREMIUM,
  },
} as const;

export type PlanKey = keyof typeof PLANS;

export function getPlanFromPriceId(priceId: string): PlanKey {
  for (const [key, plan] of Object.entries(PLANS)) {
    if (plan.stripePriceId === priceId) return key as PlanKey;
  }
  return "free";
}
