import { test } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma";
import { finalizeSession, computeEnergyCost } from "../src/lib/session";
import { resetDb, seedUser, seedStation, seedSlot, seedTariff } from "./helpers";

test("computeEnergyCost prorate xuyên khung giờ", () => {
  const tariffs = [
    { startHour: 22, endHour: 24, ratePerKwh: 2570 },
    { startHour: 0, endHour: 6, ratePerKwh: 2570 },
    { startHour: 6, endHour: 9, ratePerKwh: 3210 },
    { startHour: 9, endHour: 11, ratePerKwh: 4580 },
    { startHour: 11, endHour: 17, ratePerKwh: 3210 },
    { startHour: 17, endHour: 22, ratePerKwh: 4580 },
  ];
  // 22:00 → 02:00 hôm sau, 4h, đều giá đêm 2570 → 10 kWh * 2570 = 25700
  const start = new Date("2026-08-17T22:00:00");
  const end = new Date("2026-08-18T02:00:00");
  assert.equal(computeEnergyCost(tariffs, start, end, 10), 25700);

  // 21:00 → 23:00, 2h. 1h giá 4580 (21-22), 1h giá 2570 (22-23). 10 kWh → 5*4580 + 5*2570 = 35750
  const s2 = new Date("2026-08-17T21:00:00");
  const e2 = new Date("2026-08-17T23:00:00");
  assert.equal(computeEnergyCost(tariffs, s2, e2, 10), 35750);

  // Không tariff → fallback 3210
  assert.equal(computeEnergyCost([], start, end, 10), 32100);
});

async function seedActiveSession() {
  const user = await seedUser();
  const station = await seedStation();
  const slot = await seedSlot(station.id);
  await seedTariff();
  const session = await prisma.chargingSession.create({
    data: {
      userId: user.id,
      slotId: slot.id,
      startTime: new Date(Date.now() - 2 * 3600000), // 2 giờ trước
      energyKwh: 0,
      status: "ACTIVE",
    },
  });
  return { user, slot, session };
}

test("finalizeSession tính tiền đúng tariff", async () => {
  await resetDb();
  const { user, session } = await seedActiveSession();
  const r = await finalizeSession(session.id, { energyKwhOverride: 10 });

  // 10 kWh * 3210 VND = 32100
  assert.equal(r.subtotal, 32100);
  assert.equal(r.amount, 32100);
  assert.equal(r.pointsEarned, 3); // 32100 / 10000 = 3

  const invoice = await prisma.invoice.findUnique({ where: { sessionId: session.id } });
  assert.ok(invoice, "invoice được tạo");
  assert.equal(invoice!.status, "UNPAID");
  assert.equal(invoice!.energyKwh, 10);

  // Session COMPLETED, slot giải phóng
  const s = await prisma.chargingSession.findUnique({ where: { id: session.id } });
  assert.equal(s!.status, "COMPLETED");
  const slot = await prisma.slot.findUnique({ where: { id: s!.slotId } });
  assert.equal(slot!.status, "AVAILABLE");
  const u = await prisma.user.findUnique({ where: { id: user.id } });
  assert.equal(u!.loyaltyPoints, 3);
});

test("fleet discount trừ đúng", async () => {
  await resetDb();
  const fleet = await prisma.fleet.create({
    data: { name: "Xanh SM", code: "XSM", discountRate: 10, active: true },
  });
  await seedUser({ fleetId: fleet.id });
  const station = await seedStation();
  const slot = await seedSlot(station.id);
  await seedTariff();
  const session = await prisma.chargingSession.create({
    data: { userId: (await prisma.user.findFirst())!.id, slotId: slot.id, startTime: new Date(Date.now() - 1000), status: "ACTIVE" },
  });
  const r = await finalizeSession(session.id, { energyKwhOverride: 10 });

  assert.equal(r.subtotal, 32100);
  assert.equal(r.fleetDiscount, 3210); // 10%
  assert.equal(r.amount, 28890);
});

test("double-call finalize: lần 2 throw SESSION_NOT_ACTIVE", async () => {
  await resetDb();
  const { session } = await seedActiveSession();
  await finalizeSession(session.id, { energyKwhOverride: 5 });
  await assert.rejects(finalizeSession(session.id, { energyKwhOverride: 5 }), /SESSION_NOT_ACTIVE/);
  const count = await prisma.invoice.count({ where: { sessionId: session.id } });
  assert.equal(count, 1, "chỉ 1 invoice");
});

test("session không tồn tại: throw SESSION_NOT_FOUND", async () => {
  await resetDb();
  await assert.rejects(finalizeSession("nonexistent"), /SESSION_NOT_FOUND/);
});
