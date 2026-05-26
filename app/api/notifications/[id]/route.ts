import { getAuthenticatedUser, jsonError } from "@/lib/api-utils";
import { prisma } from "@/lib/db";

/** PATCH /api/notifications/[id] — mark one notification as read */
export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthenticatedUser();

    await prisma.notification.updateMany({
      where: { id, userId: user.id },
      data: { read: true },
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error("[PATCH /api/notifications/[id]]", error);
    return jsonError(error);
  }
}

/** DELETE /api/notifications/[id] — delete a notification */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthenticatedUser();

    await prisma.notification.deleteMany({
      where: { id, userId: user.id },
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error("[DELETE /api/notifications/[id]]", error);
    return jsonError(error);
  }
}
