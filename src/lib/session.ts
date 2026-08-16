import { prisma } from "./prisma";

export function tierFromPoints(points: number) {
  if (points >= 5000) return "PLATINUM";
  if (points >= 2000) return "GOLD";
  if (points >= 500) return "SILVER";
  return "BRONZE";
}

export type FinalizeResult = {
  session: { id: string; status: string };
  invoice: {
    id: string;
    invoiceNo: string | null;
    energyKwh: number;
    subtotal: number | null;
    discount: number;
    amount: number;
    pointsEarned: number;
  };
  userId: string;
  energyKwh: number;
  subtotal: number;
  fleetDiscount: number;
  fleetDiscountRate: number;
  amount: number;
  pointsEarned: number;
};

/**
 * Kết thúc một phiên sạc ACTIVE: tính năng lượng, cước theo tariff, chiết khấu fleet,
 * tạo hóa đơn, cộng điểm loyalty + tự nâng hạng, giải phóng slot, đóng reservation.
 * Toàn bộ ghi DB nằm trong 1 transaction để đảm bảo nhất quán.
 *
 * @param sessionId  id phiên sạc
 * @param opts.energyKwhOverride  năng lượng thực đo (vd: từ OCPP MeterValues). Nếu không có, mô phỏng theo công suất * thời gian.
 * @throws Error("SESSION_NOT_FOUND") | Error("SESSION_NOT_ACTIVE")
 */
export async function finalizeSession(
  sessionId: string,
  opts?: { energyKwhOverride?: number }
): Promise<FinalizeResult> {
  const session = await prisma.chargingSession.findUnique({
    where: { id: sessionId },
    include: { slot: { include: { station: true } }, user: { include: { fleet: true } } },
  });
  if (!session) throw new Error("SESSION_NOT_FOUND");
  if (session.status !== "ACTIVE") throw new Error("SESSION_NOT_ACTIVE");

  const endTime = new Date();
  const durationHours = Math.max(
    (endTime.getTime() - new Date(session.startTime).getTime()) / 3600000,
    0
  );
  const energyKwh =
    opts?.energyKwhOverride != null
      ? +opts.energyKwhOverride.toFixed(3)
      : +(durationHours * session.slot.powerKw * 0.9).toFixed(3);

  const hour = endTime.getHours();
  const tariff = await prisma.tariff.findFirst({
    where: { active: true, startHour: { lte: hour }, endHour: { gt: hour } },
    orderBy: { isPeak: "desc" },
  });
  const ratePerKwh = tariff?.ratePerKwh || 3210;
  const subtotal = +(energyKwh * ratePerKwh).toFixed(0);

  // Chiết khấu fleet (vd: tài xế Xanh SM)
  const fleetDiscountRate = session.user.fleet?.discountRate || 0;
  const fleetDiscount = Math.round((subtotal * fleetDiscountRate) / 100);
  const amount = subtotal - fleetDiscount;

  const pointsEarned = Math.floor(amount / 10000);
  const invoiceNo = `EV${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 100)}`;

  const invoice = await prisma.$transaction(async (tx) => {
    // Claim 1 lần: 2 request stop song song chỉ 1 finalize được (chống double invoice)
    const claimed = await tx.chargingSession.updateMany({
      where: { id: session.id, status: "ACTIVE" },
      data: { status: "COMPLETED", endTime, energyKwh },
    });
    if (claimed.count === 0) throw new Error("SESSION_NOT_ACTIVE");
    await tx.slot.update({ where: { id: session.slotId }, data: { status: "AVAILABLE" } });
    if (session.reservationId) {
      await tx.reservation.update({
        where: { id: session.reservationId },
        data: { status: "COMPLETED" },
      });
    }
    const inv = await tx.invoice.create({
      data: {
        sessionId: session.id,
        userId: session.userId,
        energyKwh,
        subtotal,
        discount: fleetDiscount,
        amount,
        pointsEarned,
        invoiceNo,
      },
    });
    if (pointsEarned > 0) {
      const newPoints = session.user.loyaltyPoints + pointsEarned;
      await tx.user.update({
        where: { id: session.userId },
        data: { loyaltyPoints: newPoints, loyaltyTier: tierFromPoints(newPoints) },
      });
      await tx.loyaltyTransaction.create({
        data: {
          userId: session.userId,
          type: "EARN",
          points: pointsEarned,
          balance: newPoints,
          reason: `Phiên sạc ${energyKwh} kWh`,
        },
      });
    }
    return inv;
  });

  return {
    session: { id: session.id, status: "COMPLETED" },
    invoice: {
      id: invoice.id,
      invoiceNo: invoice.invoiceNo,
      energyKwh: invoice.energyKwh,
      subtotal: invoice.subtotal,
      discount: invoice.discount,
      amount: invoice.amount,
      pointsEarned: invoice.pointsEarned,
    },
    userId: session.userId,
    energyKwh,
    subtotal,
    fleetDiscount,
    fleetDiscountRate,
    amount,
    pointsEarned,
  };
}
