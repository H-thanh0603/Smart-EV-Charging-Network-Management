import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const token = getTokenFromRequest(req);
  const user = token ? verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // IDOR: chỉ chủ recurring schedule được tắt; admin thay mặt
  const rr = await prisma.recurringReservation.findUnique({ where: { id: params.id }, select: { userId: true } });
  if (!rr) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (rr.userId !== user.id && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.recurringReservation.update({ where: { id: params.id }, data: { active: false } });
  // Cancel future PENDING reservations
  await prisma.reservation.updateMany({
    where: { recurringId: params.id, status: "PENDING", startTime: { gt: new Date() } },
    data: { status: "CANCELLED" }
  });
  return NextResponse.json({ ok: true });
}
