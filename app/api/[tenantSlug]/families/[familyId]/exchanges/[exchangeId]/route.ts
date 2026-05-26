import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getTenantFromRequest, jsonError } from "@/lib/api-utils";
import { createNotification } from "@/lib/notifications";
import { emailExchangeDecision } from "@/lib/email";
import { z } from "zod";

const UpdateSchema = z.object({
  status: z.enum(["accepted", "declined"]),
});

/** PATCH — accept or decline an exchange request */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ tenantSlug: string; familyId: string; exchangeId: string }> }
) {
  try {
    const { tenantSlug, familyId, exchangeId } = await params;
    const { user, tenant } = await getTenantFromRequest(tenantSlug);

    const body = await request.json();
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Statut invalide" }, { status: 400 });
    }

    const exchange = await prisma.exchangeRequest.findFirst({
      where: { id: exchangeId, familyId, family: { tenantId: tenant.id } },
      include: { family: true },
    });

    if (!exchange) {
      return Response.json({ error: "Demande introuvable" }, { status: 404 });
    }

    if (exchange.requestedById === user.id) {
      return Response.json({ error: "Vous ne pouvez pas répondre à votre propre demande" }, { status: 403 });
    }

    const updated = await prisma.exchangeRequest.update({
      where: { id: exchangeId },
      data: { status: parsed.data.status },
    });

    // Notify the requester of the decision
    const targetStr = exchange.targetDate.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });

    const accepted = parsed.data.status === "accepted";

    const appUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://atourderole.vercel.app"}/${tenantSlug}/calendar`;

    await createNotification(
      exchange.requestedById,
      accepted ? "exchange_accepted" : "exchange_declined",
      accepted
        ? `Échange accepté ✅ — ${exchange.family.name}`
        : `Échange refusé ❌ — ${exchange.family.name}`,
      `Votre demande pour le ${targetStr} a été ${accepted ? "acceptée" : "refusée"}.`,
      {
        url: appUrl,
        emailSubject: accepted
          ? `Échange accepté — ${exchange.family.name}`
          : `Échange refusé — ${exchange.family.name}`,
        emailHtml: emailExchangeDecision({
          recipientName: "vous",
          familyName: exchange.family.name,
          targetDate: targetStr,
          accepted,
          appUrl,
        }),
      }
    );

    return Response.json(updated);
  } catch (error) {
    console.error("[PATCH exchange]", error);
    return jsonError(error);
  }
}
