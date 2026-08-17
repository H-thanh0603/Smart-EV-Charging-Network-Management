import { test } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma";
import { finalizeSession } from "../src/lib/session";
import { resetDb, seedUser, seedStation, seedSlot, seedTariff } from "./helpers";

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
