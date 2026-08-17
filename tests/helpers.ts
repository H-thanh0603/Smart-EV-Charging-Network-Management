// Reset + seed DB test trước mỗi test file. Chạy qua tsx với DATABASE_URL trỏ tests/test.db.
import { prisma } from "../src/lib/prisma";

export async function resetDb() {
  // Xóa theo thứ tự FK
  await prisma.invoice.deleteMany();
  await prisma.chargingSession.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.voucherUsage.deleteMany();
  await prisma.loyaltyTransaction.deleteMany();
  await prisma.walletTransaction.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.maintenanceTicket.deleteMany();
  await prisma.review.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.slot.deleteMany();
  await prisma.station.deleteMany();
  await prisma.tariff.deleteMany();
  await prisma.voucher.deleteMany();
  await prisma.fleet.deleteMany();
  await prisma.user.deleteMany();
}

export async function seedUser(overrides: Record<string, unknown> = {}) {
  return prisma.user.create({
    data: { email: "test@test.com", password: "x", name: "Tester", role: "CUSTOMER", ...overrides },
  });
}

export async function seedStation() {
  return prisma.station.create({
    data: { name: "Trạm Test", address: "HN", city: "Hà Nội", status: "ACTIVE" },
  });
}

export async function seedSlot(stationId: string) {
  return prisma.slot.create({
    data: { slotNumber: "A1", connectorType: "CCS2", powerKw: 60, status: "AVAILABLE", stationId },
  });
}

export async function seedTariff() {
  return prisma.tariff.create({
    data: { name: "Giờ bình thường", startHour: 0, endHour: 24, ratePerKwh: 3210, active: true },
  });
}
