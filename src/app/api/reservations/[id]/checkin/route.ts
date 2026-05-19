import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const token = getTokenFromRequest(req);
  const user = token ? verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const reservation = await prisma.reservation.findUnique({ where: { id: params.id } });
  if (!reservation) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const now = new Date();
  const deadline = new Date(reservation.startTime.getTime() + 15 * 60 * 1000);
  if (now > deadline) {
    await prisma.reservation.update({ where: { id: params.id }, data: { status: "CANCELLED" } });
    return NextResponse.json({ error: "Quá 15 phút check-in, đặt chỗ đã bị huỷ" }, { status: 400 });
  }
  const updated = await prisma.reservation.update({ where: { id: params.id }, data: { status: "CONFIRMED" } });
  const session = await prisma.chargingSession.create({
    data: { userId: user.id, slotId: reservation.slotId, reservationId: reservation.id, startTime: now, status: "ACTIVE" }
  });
  await prisma.slot.update({ where: { id: reservation.slotId }, data: { status: "OCCUPIED" } });
  return NextResponse.json({ reservation: updated, session });
}
