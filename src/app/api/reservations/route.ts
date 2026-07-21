import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";
import { parseBody, reservationSchema } from "@/lib/validation";
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
  const parsed = await parseBody(req, reservationSchema);
  if (!parsed.ok) return parsed.response;
  const { slotId, startTime, endTime } = parsed.data;
  // Bọc trong transaction: check trùng khung giờ + tạo reservation atomic,
  // tránh race condition 2 người đặt cùng slot cùng lúc (SQLite serialize giao dịch).
  try {
    const reservation = await prisma.$transaction(async (tx) => {
      const conflict = await tx.reservation.findFirst({
        where: {
          slotId,
          status: { in: ["PENDING", "CONFIRMED", "CHECKED_IN"] },
          OR: [
            { startTime: { lte: startTime }, endTime: { gt: startTime } },
            { startTime: { lt: endTime }, endTime: { gte: endTime } },
            { startTime: { gte: startTime }, endTime: { lte: endTime } },
          ],
        },
      });
      if (conflict) throw new Error("SLOT_CONFLICT");
      return tx.reservation.create({
        data: { userId: user.id, slotId, startTime, endTime, status: "PENDING" },
        include: { slot: { include: { station: true } } },
      });
    });
    return NextResponse.json(reservation);
  } catch (e: any) {
    if (e?.message === "SLOT_CONFLICT")
      return NextResponse.json({ error: "Slot đã được đặt trong khung giờ này" }, { status: 409 });
    return NextResponse.json({ error: "Lỗi tạo đặt chỗ" }, { status: 500 });
  }
}
