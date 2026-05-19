import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = getTokenFromRequest(req);
  const user = token ? verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const list = await prisma.recurringReservation.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  const token = getTokenFromRequest(req);
  const user = token ? verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slotId, daysOfWeek, startHour, endHour, startDate, endDate } = await req.json();
  if (!slotId || !daysOfWeek || startHour == null || endHour == null) {
    return NextResponse.json({ error: "Thiếu thông tin" }, { status: 400 });
  }

  const recurring = await prisma.recurringReservation.create({
    data: {
      userId: user.id, slotId, daysOfWeek,
      startHour, endHour,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      active: true
    }
  });

  // Auto-create reservations for next 4 weeks
  const days = daysOfWeek.split(",").map((d: string) => parseInt(d));
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date(Date.now() + 28 * 86400000);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    if (days.includes(d.getDay())) {
      const resStart = new Date(d); resStart.setHours(startHour, 0, 0, 0);
      const resEnd = new Date(d); resEnd.setHours(endHour, 0, 0, 0);
      const conflict = await prisma.reservation.findFirst({
        where: { slotId, status: { in: ["PENDING", "CONFIRMED"] },
          OR: [
            { startTime: { lte: resStart }, endTime: { gt: resStart } },
            { startTime: { lt: resEnd }, endTime: { gte: resEnd } }
          ]
        }
      });
      if (!conflict) {
        await prisma.reservation.create({
          data: { userId: user.id, slotId, startTime: resStart, endTime: resEnd, status: "PENDING", recurringId: recurring.id }
        });
      }
    }
  }

  return NextResponse.json(recurring);
}
