import { Queue, Worker } from "bullmq";
import { redis } from "./redis";
import { prisma } from "./prisma";
import crypto from "crypto";

/**
 * Webhook delivery queue — BullMQ trên Redis. Thay fire-and-forget inline:
 * retry có backoff, không chặn request khi webhook chậm/hỏng.
 * ponytail: 1 worker trong process Next.js; scale worker riêng khi tải cao.
 */
type Job = {
  event: string;
  payload: string;
  webhookId: string;
  secret: string;
  url: string;
};

export const webhookQueue = new Queue<Job>("webhooks", {
  connection: redis as any,
  defaultJobOptions: { attempts: 5, backoff: { type: "exponential", delay: 5000 } },
});

function startWorker() {
  const worker = new Worker<Job>(
    "webhooks",
    async (job) => {
      const { event, payload, webhookId, secret, url } = job.data;
      const signature = crypto.createHmac("sha256", secret).update(payload).digest("hex");

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": signature,
          "X-Webhook-Event": event,
        },
        body: payload,
        signal: AbortSignal.timeout(5000),
      });
      const body = await res.text().catch(() => "");
      await prisma.webhook.update({
        where: { id: webhookId },
        data: { lastTriggered: new Date(), failureCount: { increment: res.ok ? 0 : 1 } },
      });
      await prisma.webhookLog.create({
        data: { webhookId, event, payload, responseStatus: res.status, responseBody: body.slice(0, 500), success: res.ok },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`); // retry khi 5xx
    },
    {
      connection: redis as any,
      concurrency: 5,
      removeOnComplete: { count: 1000 },
      removeOnFail: { count: 1000 },
    }
  );
  worker.on("error", () => {});
  return worker;
}

// Lazy-start worker: chỉ trong process chạy server (không trong build/edge).
let started = false;
export function ensureWebhookWorker() {
  if (started) return;
  started = true;
  try {
    startWorker();
  } catch {
    /* Redis down — webhook chờ queue, worker khởi lại khi Redis lên */
  }
}
