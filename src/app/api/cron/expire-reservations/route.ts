import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Chạy bằng cron mỗi 1 phút
export async function GET(req: NextRequest) {
  const now = new Date();
  const cutoff = new Date(now.getTime() - 15 * 60 * 1000); // 15 min ago

  const expired = await prisma.reservation.findMany({
    where: {
      status: "PENDING",
      startTime: { lte: cutoff }
    }
  });

  let cancelled = 0;
  for (const r of expired) {
    await prisma.$transaction(async (tx: any) => {
      await tx.reservation.update({ where: { id: r.id }, data: { status: "CANCELLED" } });
      await tx.notification.create({
        data: {
          userId: r.userId,
          title: "Lịch đặt bị huỷ",
          message: `Lịch đặt lúc ${r.startTime.toLocaleString("vi-VN")} đã bị huỷ do quá 15 phút check-in.`,
          type: "WARNING",
          link: "/reservations"
        }
      });
    });
    cancelled++;
  }

  return NextResponse.json({ cancelled, checkedAt: now.toISOString() });
}
