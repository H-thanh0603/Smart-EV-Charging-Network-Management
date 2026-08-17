import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";
import { parseBody, reservationSchema } from "@/lib/validation";
export async function GET(req: NextRequest) {
  const token = getTokenFromRequest(req);
  const user = token ? verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const where = user.role === "ADMIN" ? {} : { userId: user.id };
  const include = { slot: { include: { station: { select: { name: true, address: true } } } } };
  const orderBy = { createdAt: "desc" as const };

  // Không ?page → trả toàn bộ (backward-compat)
  const url = new URL(req.url);
  const pageParam = url.searchParams.get("page");
  if (!pageParam) {
    const reservations = await prisma.reservation.findMany({ where, include, orderBy });
    return NextResponse.json(reservations);
  }

  const page = Math.max(parseInt(pageParam) || 1, 1);
  const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "20") || 20, 1), 100);
  const [items, total] = await Promise.all([
    prisma.reservation.findMany({ where, include, orderBy, skip: (page - 1) * limit, take: limit }),
    prisma.reservation.count({ where }),
  ]);
  return NextResponse.json({ items, total, page, limit });
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
