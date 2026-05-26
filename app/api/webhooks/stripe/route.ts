import { NextRequest } from "next/server";
import { getStripe, getPlanFromPriceId } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import type Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return Response.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("[Stripe webhook] Signature verification failed:", err);
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const tenant = await prisma.tenant.findFirst({
          where: { stripeCustomerId: sub.customer as string },
        });
        if (!tenant) break;

        const item = sub.items.data[0];
        const planId = getPlanFromPriceId(item.price.id);
        const plan = await prisma.plan.findUnique({ where: { name: planId } });
        if (!plan) break;

        // In Stripe API 2026+, period fields live on SubscriptionItem
        const periodStart = new Date(item.current_period_start * 1000);
        const periodEnd = new Date(item.current_period_end * 1000);

        await prisma.$transaction([
          prisma.tenant.update({
            where: { id: tenant.id },
            data: {
              planId: plan.id,
              maxFamilies: plan.maxFamilies,
              maxMembers: plan.maxMembers,
              chatEnabled: (plan.features as Record<string, boolean>).chat ?? false,
              analyticsEnabled: (plan.features as Record<string, boolean>).analytics ?? false,
            },
          }),
          prisma.subscription.upsert({
            where: { tenantId: tenant.id },
            create: {
              tenantId: tenant.id,
              stripeSubscriptionId: sub.id,
              status: sub.status,
              currentPeriodStart: periodStart,
              currentPeriodEnd: periodEnd,
            },
            update: {
              status: sub.status,
              currentPeriodStart: periodStart,
              currentPeriodEnd: periodEnd,
            },
          }),
        ]);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const tenant = await prisma.tenant.findFirst({
          where: { stripeCustomerId: sub.customer as string },
        });
        if (!tenant) break;

        const freePlan = await prisma.plan.findUnique({ where: { name: "free" } });
        if (!freePlan) break;

        await prisma.$transaction([
          prisma.tenant.update({
            where: { id: tenant.id },
            data: {
              planId: freePlan.id,
              maxFamilies: freePlan.maxFamilies,
              maxMembers: freePlan.maxMembers,
              chatEnabled: false,
              analyticsEnabled: false,
            },
          }),
          prisma.subscription.update({
            where: { tenantId: tenant.id },
            data: { status: "canceled" },
          }),
        ]);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const tenant = await prisma.tenant.findFirst({
          where: { stripeCustomerId: invoice.customer as string },
        });
        if (!tenant) break;

        await prisma.invoice.create({
          data: {
            tenantId: tenant.id,
            stripeInvoiceId: invoice.id,
            amount: (invoice.amount_paid ?? 0) / 100,
            status: "paid",
            paidAt: new Date(),
          },
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const tenant = await prisma.tenant.findFirst({
          where: { stripeCustomerId: invoice.customer as string },
        });
        if (!tenant) break;

        await prisma.invoice.create({
          data: {
            tenantId: tenant.id,
            stripeInvoiceId: invoice.id,
            amount: (invoice.amount_due ?? 0) / 100,
            status: "open",
          },
        });
        break;
      }

      default:
        // Unhandled event type — ignore
        break;
    }
  } catch (err) {
    console.error(`[Stripe webhook] Error processing ${event.type}:`, err);
    return Response.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return Response.json({ received: true });
}
