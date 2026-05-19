import { prisma } from "./prisma";

export async function validateAndCalculate(code: string, userId: string, amount: number) {
  const voucher = await prisma.voucher.findUnique({ where: { code: code.toUpperCase() } });
  if (!voucher) return { valid: false, error: "Mã không tồn tại" };
  if (!voucher.active) return { valid: false, error: "Mã đã bị vô hiệu hoá" };

  const now = new Date();
  if (voucher.validFrom > now) return { valid: false, error: "Mã chưa có hiệu lực" };
  if (voucher.validUntil < now) return { valid: false, error: "Mã đã hết hạn" };

  if (voucher.usageLimit && voucher.usedCount >= voucher.usageLimit) {
    return { valid: false, error: "Mã đã hết lượt sử dụng" };
  }

  const userUsage = await prisma.voucherUsage.count({ where: { voucherId: voucher.id, userId } });
  if (userUsage >= voucher.perUserLimit) {
    return { valid: false, error: `Bạn đã dùng mã này ${userUsage} lần (giới hạn ${voucher.perUserLimit})` };
  }

  if (amount < voucher.minAmount) {
    return { valid: false, error: `Đơn tối thiểu ${voucher.minAmount.toLocaleString("vi-VN")} ₫` };
  }

  let discount = 0;
  if (voucher.type === "PERCENT") {
    discount = Math.round(amount * voucher.value / 100);
    if (voucher.maxDiscount) discount = Math.min(discount, voucher.maxDiscount);
  } else {
    discount = voucher.value;
  }
  discount = Math.min(discount, amount);

  return { valid: true, voucher, discount };
}
