import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";
import { validateAndCalculate } from "@/lib/voucher";
import { parseBody, invoicePaySchema } from "@/lib/validation";

// 100 điểm = 10.000 ₫
const POINT_VALUE = 100;

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const token = getTokenFromRequest(req);
  const u = token ? verifyToken(token) : null;
  if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = await parseBody(req, invoicePaySchema);
  if (!parsed.ok) return parsed.response;
  const { method, voucherCode, redeemPoints } = parsed.data;

  const invoice = await prisma.invoice.findUnique({ where: { id: params.id } });
  if (!invoice || invoice.userId !== u.id) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (invoice.status === "PAID") return NextResponse.json({ error: "Đã thanh toán" }, { status: 400 });

  let discount = 0;
  let appliedVoucher: Awaited<ReturnType<typeof validateAndCalculate>>["voucher"] | null = null;

  // 1) Voucher (nếu có)
  if (voucherCode) {
    const result = await validateAndCalculate(voucherCode, u.id, invoice.amount);
    if (!result.valid) return NextResponse.json({ error: result.error }, { status: 400 });
    discount += result.discount!;
    appliedVoucher = result.voucher!;
  }

  // 2) Đổi điểm loyalty trừ thẳng hóa đơn (nếu có)
  let pointsRedeemed = 0;
  let pointDiscount = 0;
  if (redeemPoints && redeemPoints > 0) {
    const dbUser = await prisma.user.findUnique({ where: { id: u.id }, select: { loyaltyPoints: true } });
    if (!dbUser || dbUser.loyaltyPoints < redeemPoints)
      return NextResponse.json({ error: "Không đủ điểm để quy đổi" }, { status: 400 });
    const remaining = Math.max(invoice.amount - discount, 0);
    // Không cho quy đổi vượt số tiền còn lại
    const maxRedeemablePoints = Math.floor(remaining / POINT_VALUE);
    if (redeemPoints > maxRedeemablePoints)
      return NextResponse.json(
        { error: `Chỉ cần tối đa ${maxRedeemablePoints} điểm cho hóa đơn này` },
        { status: 400 }
      );
    pointsRedeemed = redeemPoints;
    pointDiscount = redeemPoints * POINT_VALUE;
    discount += pointDiscount;
  }

  const finalAmount = Math.max(invoice.amount - discount, 0);

  if (method !== "wallet")
    return NextResponse.json({ error: "Phương thức không hỗ trợ" }, { status: 400 });

  const wallet = await prisma.wallet.findUnique({ where: { userId: u.id } });
  if (!wallet || wallet.balance < finalAmount)
    return NextResponse.json({ error: "Số dư ví không đủ" }, { status: 400 });

  try {
    await prisma.$transaction(async (tx) => {
      // Claim 1 lần: 2 request pay song song chỉ 1 trừ ví được (chống double-pay)
      const claimed = await tx.invoice.updateMany({
        where: { id: invoice.id, status: "UNPAID" },
        data: {
          status: "PAID",
          paidAt: new Date(),
          paymentMethod: "WALLET",
          subtotal: invoice.amount,
          discount,
          voucherCode: appliedVoucher?.code,
          pointsRedeemed,
          amount: finalAmount,
        },
      });
      if (claimed.count === 0) throw new Error("ALREADY_PAID");

      const freshWallet = await tx.wallet.findUnique({ where: { userId: u.id } });
      if (!freshWallet || freshWallet.balance < finalAmount) throw new Error("INSUFFICIENT_BALANCE");
      const newBalance = freshWallet.balance - finalAmount;
      await tx.wallet.update({ where: { userId: u.id }, data: { balance: newBalance } });
      await tx.walletTransaction.create({
        data: {
          userId: u.id,
          type: "PAYMENT",
          amount: -finalAmount,
          balance: newBalance,
          note: `Thanh toán hoá đơn ${invoice.invoiceNo || invoice.id.slice(-6)}`,
        },
      });
      if (appliedVoucher) {
        // Re-check perUserLimit trong tx: check ngoài tx race khi 2 invoice song song cùng user
        const userUsage = await tx.voucherUsage.count({ where: { voucherId: appliedVoucher.id, userId: u.id } });
        if (userUsage >= appliedVoucher.perUserLimit) throw new Error("VOUCHER_USER_LIMIT");
        // Chống double-submit: chỉ tăng usedCount khi chưa đụng usageLimit
        if (appliedVoucher.usageLimit) {
          const bumped = await tx.voucher.updateMany({
            where: { id: appliedVoucher.id, usedCount: { lt: appliedVoucher.usageLimit } },
            data: { usedCount: { increment: 1 } }
          });
          if (bumped.count === 0) throw new Error("VOUCHER_LIMIT");
        } else {
          await tx.voucher.update({ where: { id: appliedVoucher.id }, data: { usedCount: { increment: 1 } } });
        }
        await tx.voucherUsage.create({
          data: { voucherId: appliedVoucher.id, userId: u.id, invoiceId: invoice.id, discount: appliedVoucher ? discount - pointDiscount : 0 },
        });
      }
      // Trừ điểm khi quy đổi
      if (pointsRedeemed > 0) {
        const freshUser = await tx.user.findUnique({ where: { id: u.id }, select: { loyaltyPoints: true } });
        const balancePoints = (freshUser?.loyaltyPoints || 0) - pointsRedeemed;
        if (balancePoints < 0) throw new Error("INSUFFICIENT_POINTS");
        await tx.user.update({ where: { id: u.id }, data: { loyaltyPoints: balancePoints } });
        await tx.loyaltyTransaction.create({
          data: {
            userId: u.id,
            type: "REDEEM",
            points: -pointsRedeemed,
            balance: balancePoints,
            reason: `Giảm ${pointDiscount.toLocaleString("vi-VN")} ₫ hóa đơn ${invoice.invoiceNo || invoice.id.slice(-6)}`,
          },
        });
      }
    });
  } catch (e: any) {
    if (e?.message === "ALREADY_PAID")
      return NextResponse.json({ error: "Đã thanh toán" }, { status: 400 });
    if (e?.message === "INSUFFICIENT_POINTS")
      return NextResponse.json({ error: "Không đủ điểm để quy đổi" }, { status: 400 });
    if (e?.message === "VOUCHER_LIMIT")
      return NextResponse.json({ error: "Mã đã hết lượt sử dụng" }, { status: 400 });
    if (e?.message === "VOUCHER_USER_LIMIT")
      return NextResponse.json({ error: "Bạn đã đạt giới hạn sử dụng mã này" }, { status: 400 });
    if (e?.message === "INSUFFICIENT_BALANCE")
      return NextResponse.json({ error: "Số dư ví không đủ" }, { status: 400 });
    return NextResponse.json({ error: "Lỗi thanh toán" }, { status: 500 });
  }

  return NextResponse.json({ success: true, finalAmount, discount, pointsRedeemed });
}
