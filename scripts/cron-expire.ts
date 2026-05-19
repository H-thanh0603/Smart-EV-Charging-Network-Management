import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({ url: "file:D:/ev-charging/prisma/dev.db" });
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  const now = new Date();
  const cutoff = new Date(now.getTime() - 15 * 60 * 1000);

  // 1. Expire reservations
  const expired = await prisma.reservation.findMany({
    where: { status: "PENDING", startTime: { lte: cutoff } }
  });
  for (const r of expired) {
    await prisma.reservation.update({ where: { id: r.id }, data: { status: "CANCELLED" } });
    await prisma.notification.create({
      data: {
        userId: r.userId,
        title: "Lịch đặt bị huỷ",
        message: `Lịch đặt lúc ${r.startTime.toLocaleString("vi-VN")} đã bị huỷ do quá 15 phút check-in.`,
        type: "WARNING",
        link: "/reservations"
      }
    });
  }

  // 2. Reminders 15min before
  const upcoming = await prisma.reservation.findMany({
    where: { status: "PENDING", startTime: { gte: new Date(now.getTime() + 14*60*1000), lte: new Date(now.getTime() + 15*60*1000) } },
    include: { slot: { include: { station: true } } }
  });
  let reminded = 0;
  for (const r of upcoming) {
    await prisma.notification.create({
      data: { userId: r.userId, title: "⏰ Sắp đến giờ sạc", message: `Còn 15 phút trước giờ sạc tại ${r.slot.station.name}, trụ ${r.slot.slotNumber}`, type: "INFO", link: "/reservations" }
    });
    reminded++;
  }

  console.log(`[${now.toISOString()}] Cancelled ${expired.length}, reminded ${reminded}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
