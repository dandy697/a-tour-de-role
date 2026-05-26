import { getAuthenticatedUser, jsonError } from "@/lib/api-utils";
import { prisma } from "@/lib/db";

/** GET /api/notifications — fetch recent notifications for the current user */
export async function GET() {
  try {
    const user = await getAuthenticatedUser();

    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    const unreadCount = notifications.filter((n) => !n.read).length;

    return Response.json({ notifications, unreadCount });
  } catch (error) {
    console.error("[GET /api/notifications]", error);
    return jsonError(error);
  }
}

/** PATCH /api/notifications — mark all notifications as read */
export async function PATCH() {
  try {
    const user = await getAuthenticatedUser();

    await prisma.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true },
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error("[PATCH /api/notifications]", error);
    return jsonError(error);
  }
}
