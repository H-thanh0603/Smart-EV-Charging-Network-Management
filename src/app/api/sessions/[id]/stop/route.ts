import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { finalizeSession } from "@/lib/session";
import { triggerWebhooks } from "@/lib/webhook";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const token = getTokenFromRequest(req);
  const u = token ? verifyToken(token) : null;
  if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Kiểm tra quyền sở hữu trước khi kết thúc
  const owner = await prisma.chargingSession.findUnique({
    where: { id: params.id },
    select: { userId: true, status: true },
  });
  if (!owner || (owner.userId !== u.id && u.role !== "ADMIN"))
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (owner.status !== "ACTIVE")
    return NextResponse.json({ error: "Phiên đã kết thúc" }, { status: 400 });

  let result;
  try {
    result = await finalizeSession(params.id);
  } catch (e: any) {
    if (e?.message === "SESSION_NOT_FOUND")
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (e?.message === "SESSION_NOT_ACTIVE")
      return NextResponse.json({ error: "Phiên đã kết thúc" }, { status: 400 });
    return NextResponse.json({ error: "Lỗi kết thúc phiên" }, { status: 500 });
  }

  const { energyKwh, amount, fleetDiscount, fleetDiscountRate, pointsEarned } = result;
  const fleetMsg = fleetDiscount > 0 ? ` (Fleet -${fleetDiscountRate}%: -${fleetDiscount.toLocaleString("vi-VN")} ₫)` : "";
  await notify(
    result.userId,
    "✓ Phiên sạc kết thúc",
    `${energyKwh} kWh • ${amount.toLocaleString("vi-VN")} ₫${fleetMsg} • +${pointsEarned} điểm`,
    { type: "SUCCESS", link: "/invoices" }
  );

  triggerWebhooks("session.end", {
    sessionId: result.session.id, userId: result.userId, energyKwh, amount, fleetDiscount,
  }).catch(() => {});

  return NextResponse.json({
    session: result.session,
    invoice: result.invoice,
    pointsEarned,
    fleetDiscount,
  });
}
