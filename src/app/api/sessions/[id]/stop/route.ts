import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";
import { notify } from "@/lib/notify";

function tierFromPoints(points: number) {
  if (points >= 5000) return "PLATINUM";
  if (points >= 2000) return "GOLD";
  if (points >= 500) return "SILVER";
  return "BRONZE";
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const token = getTokenFromRequest(req);
  const u = token ? verifyToken(token) : null;
  if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const session = await prisma.chargingSession.findUnique({
    where: { id: params.id },
    include: { slot: { include: { station: true } }, user: { include: { fleet: true } } }
  });
  if (!session || session.userId !== u.id) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (session.status !== "ACTIVE") return NextResponse.json({ error: "Phiên đã kết thúc" }, { status: 400 });

  const endTime = new Date();
  const durationMs = endTime.getTime() - new Date(session.startTime).getTime();
  const durationHours = durationMs / 3600000;
  const energyKwh = +(durationHours * session.slot.powerKw * 0.9).toFixed(3);

  const hour = endTime.getHours();
  const tariff = await prisma.tariff.findFirst({
    where: { active: true, startHour: { lte: hour }, endHour: { gt: hour } },
    orderBy: { isPeak: "desc" }
  });
  const ratePerKwh = tariff?.ratePerKwh || 3210;
  const subtotal = +(energyKwh * ratePerKwh).toFixed(0);

  // FLEET DISCOUNT - Xanh SM drivers get 15% off
  const fleetDiscountRate = (session.user as any).fleet?.discountRate || 0;
  const fleetDiscount = Math.round(subtotal * fleetDiscountRate / 100);
  const amount = subtotal - fleetDiscount;

  const pointsEarned = Math.floor(amount / 10000);
  const invoiceNo = `EV${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 100)}`;

  const result = await prisma.$transaction(async (tx: any) => {
    await tx.chargingSession.update({
      where: { id: session.id }, data: { status: "COMPLETED", endTime, energyKwh }
    });
    await tx.slot.update({ where: { id: session.slotId }, data: { status: "AVAILABLE" } });
    const invoice = await tx.invoice.create({
      data: {
        sessionId: session.id, userId: session.userId, energyKwh,
        subtotal, discount: fleetDiscount, amount,
        pointsEarned, invoiceNo
      }
    });
    if (pointsEarned > 0) {
      const newPoints = session.user.loyaltyPoints + pointsEarned;
      await tx.user.update({
        where: { id: session.userId },
        data: { loyaltyPoints: newPoints, loyaltyTier: tierFromPoints(newPoints) }
      });
      await tx.loyaltyTransaction.create({
        data: { userId: session.userId, type: "EARN", points: pointsEarned, balance: newPoints, reason: `Phiên sạc ${energyKwh} kWh` }
      });
    }
    return invoice;
  });

  const fleetMsg = fleetDiscount > 0 ? ` (Fleet -${fleetDiscountRate}%: -${fleetDiscount.toLocaleString("vi-VN")} ₫)` : "";
  await notify(session.userId, "✓ Phiên sạc kết thúc", `${energyKwh} kWh • ${amount.toLocaleString("vi-VN")} ₫${fleetMsg} • +${pointsEarned} điểm`, { type: "SUCCESS", link: "/invoices" });

  fetch(`${req.nextUrl.origin}/api/webhooks/trigger`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event: "session.end", payload: { sessionId: session.id, userId: session.userId, energyKwh, amount, fleetDiscount } })
  }).catch(() => {});

  return NextResponse.json({ session: { id: session.id, status: "COMPLETED" }, invoice: result, pointsEarned, fleetDiscount });
}
