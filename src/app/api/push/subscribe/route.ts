import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";
import { VAPID_PUBLIC } from "@/lib/push";

export async function GET() {
  return NextResponse.json({ vapidPublicKey: VAPID_PUBLIC });
}

export async function POST(req: NextRequest) {
  const token = getTokenFromRequest(req);
  const u = token ? verifyToken(token) : null;
  if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { subscription } = await req.json();
  if (!subscription?.endpoint) return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });

  const userAgent = req.headers.get("user-agent") || "";
  await prisma.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    update: { userId: u.id, p256dh: subscription.keys.p256dh, auth: subscription.keys.auth, userAgent },
    create: {
      userId: u.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      userAgent
    }
  });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const token = getTokenFromRequest(req);
  const u = token ? verifyToken(token) : null;
  if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { endpoint } = await req.json();
  await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: u.id } });
  return NextResponse.json({ success: true });
}
