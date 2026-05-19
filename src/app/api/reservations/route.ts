import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";
export async function GET(req: NextRequest) {
  const token = getTokenFromRequest(req);
  const user = token ? verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const reservations = await prisma.reservation.findMany({
    where: user.role === "ADMIN" ? {} : { userId: user.id },
    include: { slot: { include: { station: { select: { name: true, address: true } } } } },
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json(reservations);
}
export async function POST(req: NextRequest) {
  const token = getTokenFromRequest(req);
  const user = token ? verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { slotId, startTime, endTime } = await req.json();
  const conflict = await prisma.reservation.findFirst({
    where: { slotId, status: { in: ["PENDING", "CONFIRMED"] },
      OR: [
        { startTime: { lte: new Date(startTime) }, endTime: { gt: new Date(startTime) } },
        { startTime: { lt: new Date(endTime) }, endTime: { gte: new Date(endTime) } },
        { startTime: { gte: new Date(startTime) }, endTime: { lte: new Date(endTime) } }
      ]
    }
  });
  if (conflict) return NextResponse.json({ error: "Slot đã được đặt trong khung giờ này" }, { status: 409 });
  const reservation = await prisma.reservation.create({
    data: { userId: user.id, slotId, startTime: new Date(startTime), endTime: new Date(endTime), status: "PENDING" },
    include: { slot: { include: { station: true } } }
  });
  return NextResponse.json(reservation);
}
