import { prisma } from "./prisma";
import { notify } from "./notify";
import { finalizeSession } from "./session";

/**
 * Một lần tick cron: huỷ reservation PENDING quá 15 phút check-in,
 * nhắc 15 phút và 5 phút trước giờ sạc. Nguồn duy nhất cho cả
 * /api/cron/reservation-reminder và scripts/cron-expire.ts.
 */
export async function cronTick() {
  const now = new Date();
  const cutoff = new Date(now.getTime() - 15 * 60 * 1000);
  const NO_SHOW_FEE = 20_000; // VND

  // 1. Huỷ reservation quá 15 phút check-in (chưa check-in) + phạt no-show
  const expired = await prisma.reservation.findMany({
    where: { status: "PENDING", startTime: { lte: cutoff } },
  });
  for (const r of expired) {
    await prisma.$transaction(async (tx) => {
      await tx.reservation.update({ where: { id: r.id }, data: { status: "CANCELLED" } });
      const wallet = await tx.wallet.upsert({
        where: { userId: r.userId },
        update: { balance: { decrement: NO_SHOW_FEE } },
        create: { userId: r.userId, balance: -NO_SHOW_FEE },
      });
      await tx.walletTransaction.create({
        data: { userId: r.userId, type: "PENALTY", amount: -NO_SHOW_FEE, balance: wallet.balance, note: `Phạt no-show lịch ${r.startTime.toLocaleString("vi-VN")}` },
      });
    });
    await notify(r.userId, "Lịch đặt bị huỷ", `Lịch đặt lúc ${r.startTime.toLocaleString("vi-VN")} bị huỷ do quá 15 phút check-in. Bị phạt ${NO_SHOW_FEE.toLocaleString("vi-VN")}₫.`, { type: "WARNING", link: "/reservations" });
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

  // 4. Watchdog: auto-finalize session ACTIVE quá 24h (charge point mất kết nối vĩnh viễn)
  const stuck = await prisma.chargingSession.findMany({
    where: { status: "ACTIVE", startTime: { lte: new Date(now.getTime() - 24 * 3600000) } },
    select: { id: true },
  });
  let finalized = 0;
  for (const s of stuck) {
    try {
      await finalizeSession(s.id);
      finalized++;
    } catch {
      /* đã finalize bởi tiến trình khác */
    }
  }

  return { cancelled: expired.length, reminded15: upcoming15.length, reminded5: upcoming5.length, watchdogFinalized: finalized, noShowFees: expired.length };
}