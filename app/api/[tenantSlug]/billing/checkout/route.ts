import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getStripe, PLANS } from "@/lib/stripe";
import { getTenantFromRequest, jsonError } from "@/lib/api-utils";
import { z } from "zod";

const CheckoutSchema = z.object({
  planId: z.enum(["pro", "premium"]),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await params;
    const { tenant } = await getTenantFromRequest(tenantSlug);

    const body = await request.json();
    const parsed = CheckoutSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Plan invalide" }, { status: 400 });
    }

    const { planId } = parsed.data;
    const plan = PLANS[planId];
    if (!plan.stripePriceId) {
      return Response.json({ error: "Ce plan n'a pas de prix Stripe configuré" }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    // Reuse or create Stripe customer
    let customerId = tenant.stripeCustomerId ?? undefined;
    if (!customerId) {
      const customer = await getStripe().customers.create({
        email: tenant.billingEmail,
        name: tenant.name,
        metadata: { tenantId: tenant.id, tenantSlug: tenant.slug },
      });
      customerId = customer.id;
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: plan.stripePriceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${appUrl}/${tenantSlug}/settings/billing?success=true`,
      cancel_url: `${appUrl}/${tenantSlug}/settings/billing?cancelled=true`,
      metadata: { tenantId: tenant.id, planId },
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error("[POST /api/[tenantSlug]/billing/checkout]", error);
    return jsonError(error);
  }
}
