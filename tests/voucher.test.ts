import { test } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma";
import { validateAndCalculate } from "../src/lib/voucher";
import { resetDb, seedUser } from "./helpers";

const now = new Date();
const future = new Date(now.getTime() + 24 * 3600000); // +1 ngày
const past = new Date(now.getTime() - 24 * 3600000); // -1 ngày

test("PERCENT cap maxDiscount", async () => {
  await resetDb();
  await prisma.voucher.create({
    data: {
      code: "PCT10", name: "10%", type: "PERCENT", value: 10,
      maxDiscount: 5000, validFrom: past, validUntil: future, active: true,
    },
  });
  const r = await validateAndCalculate("pct10", "u1", 100000);
  assert.equal(r.valid, true);
  assert.equal(r.discount, 5000); // 10% của 100k = 10k, cap 5k
});

test("PERCENT dưới cap không bị giới hạn", async () => {
  await resetDb();
  await prisma.voucher.create({
    data: {
      code: "PCT5", name: "5%", type: "PERCENT", value: 5,
      maxDiscount: 5000, validFrom: past, validUntil: future, active: true,
    },
  });
  const r = await validateAndCalculate("PCT5", "u1", 100000);
  assert.equal(r.discount, 5000); // 5k < cap 5k
});

test("FIXED vượt amount bị clamp về amount", async () => {
  await resetDb();
  await prisma.voucher.create({
    data: {
      code: "FIX50", name: "Giảm 50k", type: "FIXED", value: 50000,
      validFrom: past, validUntil: future, active: true,
    },
  });
  const r = await validateAndCalculate("FIX50", "u1", 20000);
  assert.equal(r.valid, true);
  assert.equal(r.discount, 20000); // clamp
});

test("hết hạn: invalid", async () => {
  await resetDb();
  await prisma.voucher.create({
    data: {
      code: "EXP", name: "Hết hạn", type: "FIXED", value: 1000,
      validFrom: past, validUntil: past, active: true,
    },
  });
  const r = await validateAndCalculate("EXP", "u1", 50000);
  assert.equal(r.valid, false);
  assert.match(r.error, /hết hạn/i);
});

test("perUserLimit: dùng quá limit bị từ chối", async () => {
  await resetDb();
  const user = await seedUser();
  const voucher = await prisma.voucher.create({
    data: {
      code: "LIMIT1", name: "1 lần", type: "FIXED", value: 1000,
      perUserLimit: 1, validFrom: past, validUntil: future, active: true,
    },
  });
  await prisma.voucherUsage.create({
    data: { voucherId: voucher.id, userId: user.id, discount: 1000 },
  });
  const r = await validateAndCalculate("LIMIT1", user.id, 50000);
  assert.equal(r.valid, false);
  assert.match(r.error, /giới hạn/);
});

test("không đủ minAmount: invalid", async () => {
  await resetDb();
  await prisma.voucher.create({
    data: {
      code: "MIN100", name: "Tối thiểu 100k", type: "FIXED", value: 5000,
      minAmount: 100000, validFrom: past, validUntil: future, active: true,
    },
  });
  const r = await validateAndCalculate("MIN100", "u1", 50000);
  assert.equal(r.valid, false);
  assert.match(r.error, /tối thiểu/);
});
