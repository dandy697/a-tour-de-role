import { prisma } from "@/lib/db";
import { sendPushToUser, sendPushToUsers, type PushPayload } from "@/lib/push";
import { sendEmail } from "@/lib/email";

export type NotificationType =
  | "exchange_request"
  | "exchange_accepted"
  | "exchange_declined"
  | "weekend_changed"
  | "family_invite"
  | "reminder";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://atourderole.vercel.app";

interface NotificationOptions {
  /** URL to open when clicking the push notification */
  url?: string;
  /** Brevo email HTML — if provided, also sends an email to the user */
  emailHtml?: string;
  emailSubject?: string;
}

/** Create a single in-app notification + optional push + optional email */
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  opts: NotificationOptions = {}
) {
  // 1. In-app (DB)
  const notif = await prisma.notification.create({
    data: { userId, type, title, message },
  });

  // 2. Push (fire-and-forget)
  const pushPayload: PushPayload = {
    title,
    body: message,
    tag: type,
    url: opts.url ?? APP_URL,
  };
  sendPushToUser(userId, pushPayload).catch((e) =>
    console.warn("[notifications] push failed:", e)
  );

  // 3. Email (if provided)
  if (opts.emailHtml && opts.emailSubject) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (user?.email) {
      sendEmail({
        to: { email: user.email },
        subject: opts.emailSubject,
        htmlContent: opts.emailHtml,
      }).catch((e) => console.warn("[notifications] email failed:", e));
    }
  }

  return notif;
}

/** Notify all members of a family except the actor */
export async function notifyFamilyMembers(
  familyId: string,
  excludeUserId: string,
  type: NotificationType,
  title: string,
  message: string,
  opts: NotificationOptions = {}
) {
  const members = await prisma.familyMember.findMany({
    where: {
      familyId,
      AND: [{ userId: { not: null } }, { userId: { not: excludeUserId } }],
    },
    include: { user: { select: { id: true, email: true } } },
  });

  if (members.length === 0) return;

  const validMembers = members.filter((m) => m.userId !== null);

  // 1. In-app (DB) — bulk
  await prisma.notification.createMany({
    data: validMembers.map((m) => ({
      userId: m.userId as string,
      type,
      title,
      message,
    })),
  });

  // 2. Push — fire-and-forget
  const userIds = validMembers.map((m) => m.userId as string);
  sendPushToUsers(userIds, { title, body: message, tag: type, url: opts.url ?? APP_URL }).catch(
    (e) => console.warn("[notifications] push to family failed:", e)
  );

  // 3. Email — fire-and-forget
  if (opts.emailHtml && opts.emailSubject) {
    for (const m of validMembers) {
      if (m.user?.email) {
        sendEmail({
          to: { email: m.user.email },
          subject: opts.emailSubject,
          htmlContent: opts.emailHtml,
        }).catch((e) => console.warn("[notifications] email failed:", e));
      }
    }
  }
}
