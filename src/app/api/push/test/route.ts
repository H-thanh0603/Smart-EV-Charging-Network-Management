import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";
import { sendPush } from "@/lib/push";

export async function POST(req: NextRequest) {
  const token = getTokenFromRequest(req);
  const u = token ? verifyToken(token) : null;
  if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const subs = await prisma.pushSubscription.findMany({ where: { userId: u.id } });
  let sent = 0;
  for (const sub of subs) {
    const ok = await sendPush(sub, {
      title: "🔔 Test Notification",
      body: "Push notification từ EV Charge đang hoạt động!",
      icon: "/icon-192.png",
      url: "/notifications"
    });
    if (ok) sent++;
  }
  return NextResponse.json({ sent, total: subs.length });
}
