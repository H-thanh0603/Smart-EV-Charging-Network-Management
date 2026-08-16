import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL ?? "file:./prisma/dev.db" });
const prisma = new PrismaClient({ adapter } as any);

const INTERVAL_MS = (() => {
  const n = parseInt(process.env.CRON_INTERVAL_MS ?? "-1", 10);
  return n > 0 ? n : 60_000;
})();

async function tick() {
  const now = new Date();
  const cutoff = new Date(now.getTime() - 15 * 60 * 1000);

  // 1. Huỷ reservation PENDING quá 15 phút check-in
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

  // 2. Nhắc 15 phút trước giờ sạc
  const upcoming = await prisma.reservation.findMany({
    where: { status: "PENDING", startTime: { gte: new Date(now.getTime() + 14 * 60 * 1000), lte: new Date(now.getTime() + 15 * 60 * 1000) } },
    include: { slot: { include: { station: true } } }
  });
  for (const r of upcoming) {
    await prisma.notification.create({
      data: { userId: r.userId, title: "⏰ Sắp đến giờ sạc", message: `Còn 15 phút trước giờ sạc tại ${r.slot.station.name}, trụ ${r.slot.slotNumber}`, type: "INFO", link: "/reservations" }
    });
  }

  console.log(`[${now.toISOString()}] tick: cancelled ${expired.length}, reminded ${upcoming.length}`);
}

async function main() {
  await tick();
  setInterval(tick, INTERVAL_MS);
  console.log(`Cron daemon chạy, tick mỗi ${Math.round(INTERVAL_MS / 1000)}s. Ctrl+C để dừng.`);
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });