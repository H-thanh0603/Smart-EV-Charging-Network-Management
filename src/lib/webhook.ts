import { prisma } from "./prisma";
import { webhookQueue, ensureWebhookWorker } from "./webhook-queue";

/**
 * Bắn webhook cho các đối tác đăng ký event. Enqueue vào BullMQ — retry có backoff,
 * không chặn request khi webhook chậm/hỏng. Worker chạy trong process server.
 */
export async function triggerWebhooks(event: string, data: unknown): Promise<number> {
  ensureWebhookWorker();
  const webhooks = await prisma.webhook.findMany({ where: { active: true } });
  const matching = webhooks.filter(w => w.events.split(",").map(e => e.trim()).includes(event));

  for (const wh of matching) {
    const payload = JSON.stringify({ event, data, timestamp: new Date().toISOString() });
    await webhookQueue.add(
      `${event}:${wh.id}`,
      { event, payload, webhookId: wh.id, secret: wh.secret, url: wh.url },
      { removeOnFail: false }
    );
  }
  return matching.length;
}
