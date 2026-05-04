import webpush from "web-push";
import { db } from "@/lib/db";
import { pushSubscriptions, memberships } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

function getVapidConfig() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? `mailto:${process.env.ADMIN_EMAIL ?? "admin@my-repair.it"}`;
  if (!publicKey || !privateKey) return null;
  return { publicKey, privateKey, subject };
}

export function getVapidPublicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY ?? null;
}

export async function sendPushNotification(
  userId: string,
  payload: { title: string; body: string; url?: string },
) {
  const vapid = getVapidConfig();
  if (!vapid) return;

  webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);

  const subs = await db
    .select({ endpoint: pushSubscriptions.endpoint, p256dh: pushSubscriptions.p256dh, auth: pushSubscriptions.auth })
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));

  const data = JSON.stringify(payload);

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          data,
        );
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 410 || status === 404) {
          // Subscription scaduta: rimuoviamo
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, sub.endpoint));
        } else {
          console.error("[push] sendNotification error", err);
        }
      }
    }),
  );
}

export async function sendPushToOrgMembers(
  organizationId: string,
  payload: { title: string; body: string; url?: string },
) {
  const vapid = getVapidConfig();
  if (!vapid) return;

  const members = await db
    .select({ userId: memberships.userId })
    .from(memberships)
    .where(eq(memberships.organizationId, organizationId));

  if (members.length === 0) return;

  const userIds = members.map((m) => m.userId);

  webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);

  const subs = await db
    .select({ endpoint: pushSubscriptions.endpoint, p256dh: pushSubscriptions.p256dh, auth: pushSubscriptions.auth })
    .from(pushSubscriptions)
    .where(inArray(pushSubscriptions.userId, userIds));

  const data = JSON.stringify(payload);

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          data,
        );
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 410 || status === 404) {
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, sub.endpoint));
        } else {
          console.error("[push] sendNotification error", err);
        }
      }
    }),
  );
}
