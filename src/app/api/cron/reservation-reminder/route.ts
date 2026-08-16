import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";

// Chạy mỗi 1 phút - nhắc nhở reservation 15p và 5p trước
export async function GET(req: NextRequest) {
  const now = new Date();
  const in15min = new Date(now.getTime() + 15 * 60 * 1000);
  const in5min = new Date(now.getTime() + 5 * 60 * 1000);

  let count = 0;

  // 15min reminder — chỉ nhắc 1 lần (reminderSentAt null)
  const upcoming15 = await prisma.reservation.findMany({
    where: { status: "PENDING", reminderSentAt: null, startTime: { gte: new Date(now.getTime() + 14*60*1000), lte: new Date(now.getTime() + 15*60*1000) } },
    include: { slot: { include: { station: true } } }
  });
  for (const r of upcoming15) {
    await notify(r.userId, "⏰ Sắp đến giờ sạc", `Còn 15 phút trước giờ sạc tại ${r.slot.station.name}, trụ ${r.slot.slotNumber}`, { type: "INFO", link: "/reservations" });
    await prisma.reservation.update({ where: { id: r.id }, data: { reminderSentAt: now } });
    count++;
  }

  // 5min reminder — nhắc lần 2 gần giờ (ko chặn reminderSentAt)
  const upcoming5 = await prisma.reservation.findMany({
    where: { status: "PENDING", startTime: { gte: new Date(now.getTime() + 4*60*1000), lte: new Date(now.getTime() + 5*60*1000) } },
    include: { slot: { include: { station: true } } }
  });
  for (const r of upcoming5) {
    await notify(r.userId, "⚡ Sạc trong 5 phút!", `Đến trạm ${r.slot.station.name} - trụ ${r.slot.slotNumber} ngay để check-in`, { type: "WARNING", link: "/reservations" });
    count++;
  }

  return NextResponse.json({ reminded: count, checkedAt: now.toISOString() });
}
