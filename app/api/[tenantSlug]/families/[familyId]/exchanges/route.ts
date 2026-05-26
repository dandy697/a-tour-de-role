import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getTenantFromRequest, jsonError } from "@/lib/api-utils";
import { notifyFamilyMembers } from "@/lib/notifications";
import { emailExchangeRequest } from "@/lib/email";
import { z } from "zod";

const CreateExchangeSchema = z.object({
  targetDate: z.string(),
  proposedDate: z.string().optional(),
  reason: z.string().max(500).optional(),
});

/** POST — create an exchange request and notify the other parent */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantSlug: string; familyId: string }> }
) {
  try {
    const { tenantSlug, familyId } = await params;
    const { user, tenant } = await getTenantFromRequest(tenantSlug);

    // Check family belongs to this tenant
    const family = await prisma.family.findFirst({
      where: { id: familyId, tenantId: tenant.id },
    });
    if (!family) {
      return Response.json({ error: "Famille introuvable" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = CreateExchangeSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Données invalides", details: parsed.error.issues }, { status: 400 });
    }

    const { targetDate, proposedDate, reason } = parsed.data;

    const exchange = await prisma.exchangeRequest.create({
      data: {
        familyId,
        requestedById: user.id,
        targetDate: new Date(targetDate),
        proposedDate: proposedDate ? new Date(proposedDate) : null,
        reason: reason ?? null,
        status: "pending",
      },
    });

    // Notify all other family members
    const targetStr = new Date(targetDate).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    const proposedStr = proposedDate
      ? new Date(proposedDate).toLocaleDateString("fr-FR", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })
      : null;

    const appUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://atourderole.vercel.app"}/${tenantSlug}/exchanges`;
    const notifMessage = proposedStr
      ? `Échange proposé : ${targetStr} ↔ ${proposedStr}${reason ? ` · "${reason}"` : ""}`
      : `Demande pour le ${targetStr}${reason ? ` · "${reason}"` : ""}`;

    // Fetch requester name for the email
    const requester = await prisma.user.findUnique({
      where: { id: user.id },
      select: { name: true },
    });

    await notifyFamilyMembers(
      familyId,
      user.id,
      "exchange_request",
      `Demande d'échange — ${family.name}`,
      notifMessage,
      {
        url: appUrl,
        emailSubject: `Demande d'échange — ${family.name}`,
        emailHtml: emailExchangeRequest({
          recipientName: "vous",
          requesterName: requester?.name ?? "Un parent",
          familyName: family.name,
          targetDate: targetStr,
          proposedDate: proposedStr ?? undefined,
          reason: reason ?? undefined,
          appUrl,
        }),
      }
    );

    return Response.json(exchange, { status: 201 });
  } catch (error) {
    console.error("[POST exchanges]", error);
    return jsonError(error);
  }
}

/** GET — list exchange requests for a family */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ tenantSlug: string; familyId: string }> }
) {
  try {
    const { tenantSlug, familyId } = await params;
    const { tenant } = await getTenantFromRequest(tenantSlug);

    const exchanges = await prisma.exchangeRequest.findMany({
      where: { familyId, family: { tenantId: tenant.id } },
      include: { requestedBy: { select: { id: true, name: true, image: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return Response.json(exchanges);
  } catch (error) {
    console.error("[GET exchanges]", error);
    return jsonError(error);
  }
}
