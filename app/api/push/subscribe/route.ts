import { NextRequest } from "next/server";
import { getAuthenticatedUser, jsonError } from "@/lib/api-utils";
import { prisma } from "@/lib/db";
import { z } from "zod";

const SubscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

/** POST — enregistre une subscription push */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    const body = await request.json();
    const parsed = SubscribeSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Subscription invalide" }, { status: 400 });
    }

    const { endpoint, keys } = parsed.data;

    await prisma.pushSubscription.upsert({
      where: { endpoint },
      create: {
        userId: user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
      update: {
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error("[POST /api/push/subscribe]", error);
    return jsonError(error);
  }
}

/** DELETE — supprime une subscription push */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    const { endpoint } = await request.json();

    if (!endpoint) return Response.json({ error: "endpoint requis" }, { status: 400 });

    await prisma.pushSubscription.deleteMany({
      where: { endpoint, userId: user.id },
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error("[DELETE /api/push/subscribe]", error);
    return jsonError(error);
  }
}
