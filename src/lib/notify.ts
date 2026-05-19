import { prisma } from "./prisma";
import { sendPush } from "./push";

export async function notify(userId: string, title: string, message: string, opts?: { type?: string; link?: string }) {
  // Save to DB
  const notification = await prisma.notification.create({
    data: {
      userId,
      title,
      message,
      type: opts?.type || "INFO",
      link: opts?.link
    }
  });

  // Send web push to all subscriptions
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  for (const sub of subs) {
    sendPush(sub, { title, body: message, url: opts?.link || "/notifications" }).catch(() => {});
  }

  return notification;
}
