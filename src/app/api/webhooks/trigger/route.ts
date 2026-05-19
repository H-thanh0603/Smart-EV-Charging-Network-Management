import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const { event, data } = await req.json();
  const webhooks = await prisma.webhook.findMany({ where: { active: true } });
  const matching = webhooks.filter(w => w.events.split(",").map(e => e.trim()).includes(event));

  for (const wh of matching) {
    const payload = JSON.stringify({ event, data, timestamp: new Date().toISOString() });
    const signature = crypto.createHmac("sha256", wh.secret).update(payload).digest("hex");

    try {
      const res = await fetch(wh.url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Webhook-Signature": signature, "X-Webhook-Event": event },
        body: payload,
        signal: AbortSignal.timeout(5000)
      });
      const body = await res.text().catch(() => "");
      await prisma.webhook.update({ where: { id: wh.id }, data: { lastTriggered: new Date(), failureCount: res.ok ? 0 : wh.failureCount + 1 } });
      await prisma.webhookLog.create({
        data: { webhookId: wh.id, event, payload, responseStatus: res.status, responseBody: body.slice(0, 500), success: res.ok }
      });
    } catch (e: any) {
      await prisma.webhookLog.create({
        data: { webhookId: wh.id, event, payload, responseBody: e.message?.slice(0, 500), success: false }
      });
      await prisma.webhook.update({ where: { id: wh.id }, data: { failureCount: wh.failureCount + 1 } });
    }
  }
  return NextResponse.json({ triggered: matching.length });
}
