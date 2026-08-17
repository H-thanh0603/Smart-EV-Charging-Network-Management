import { prisma } from "./prisma";
import { notify } from "./notify";

/**
 * Một lần tick cron: huỷ reservation PENDING quá 15 phút check-in,
 * nhắc 15 phút và 5 phút trước giờ sạc. Nguồn duy nhất cho cả
 * /api/cron/reservation-reminder và scripts/cron-expire.ts.
 */
export async function cronTick() {
  const now = new Date();
  const cutoff = new Date(now.getTime() - 15 * 60 * 1000);

  // 1. Huỷ reservation quá 15 phút check-in (chưa check-in)
  const expired = await prisma.reservation.findMany({
    where: { status: "PENDING", startTime: { lte: cutoff } },
  });
  for (const r of expired) {
    await prisma.reservation.update({ where: { id: r.id }, data: { status: "CANCELLED" } });
    await notify(r.userId, "Lịch đặt bị huỷ", `Lịch đặt lúc ${r.startTime.toLocaleString("vi-VN")} đã bị huỷ do quá 15 phút check-in.`, { type: "WARNING", link: "/reservations" });
  }

  // 2. Nhắc 15 phút trước giờ sạc — 1 lần (reminderSentAt)
  const upcoming15 = await prisma.reservation.findMany({
    where: { status: "PENDING", reminderSentAt: null, startTime: { gte: new Date(now.getTime() + 14 * 60 * 1000), lte: new Date(now.getTime() + 15 * 60 * 1000) } },
    include: { slot: { include: { station: true } } },
  });
  for (const r of upcoming15) {
    await notify(r.userId, "⏰ Sắp đến giờ sạc", `Còn 15 phút trước giờ sạc tại ${r.slot.station.name}, trụ ${r.slot.slotNumber}`, { type: "INFO", link: "/reservations" });
    await prisma.reservation.update({ where: { id: r.id }, data: { reminderSentAt: now } });
  }

  // 3. Nhắc 5 phút trước — 1 lần (reminder5SentAt)
  const upcoming5 = await prisma.reservation.findMany({
    where: { status: "PENDING", reminder5SentAt: null, startTime: { gte: new Date(now.getTime() + 4 * 60 * 1000), lte: new Date(now.getTime() + 5 * 60 * 1000) } },
    include: { slot: { include: { station: true } } },
  });
  for (const r of upcoming5) {
    await notify(r.userId, "⚡ Sạc trong 5 phút!", `Đến trạm ${r.slot.station.name} - trụ ${r.slot.slotNumber} ngay để check-in`, { type: "WARNING", link: "/reservations" });
    await prisma.reservation.update({ where: { id: r.id }, data: { reminder5SentAt: now } });
  }

  return { cancelled: expired.length, reminded15: upcoming15.length, reminded5: upcoming5.length };
}