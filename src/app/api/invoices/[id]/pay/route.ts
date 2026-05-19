import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";
import { validateAndCalculate } from "@/lib/voucher";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const token = getTokenFromRequest(req);
  const u = token ? verifyToken(token) : null;
  if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { method, voucherCode } = await req.json();
  const invoice = await prisma.invoice.findUnique({ where: { id: params.id } });
  if (!invoice || invoice.userId !== u.id) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (invoice.status === "PAID") return NextResponse.json({ error: "Đã thanh toán" }, { status: 400 });

  let finalAmount = invoice.amount;
  let discount = 0;
  let appliedVoucher: any = null;

  if (voucherCode) {
    const result = await validateAndCalculate(voucherCode, u.id, invoice.amount);
    if (!result.valid) return NextResponse.json({ error: result.error }, { status: 400 });
    discount = result.discount!;
    finalAmount = invoice.amount - discount;
    appliedVoucher = result.voucher;
  }

  if (method === "wallet") {
    const wallet = await prisma.wallet.findUnique({ where: { userId: u.id } });
    if (!wallet || wallet.balance < finalAmount) return NextResponse.json({ error: "Số dư ví không đủ" }, { status: 400 });

    await prisma.$transaction(async (tx: any) => {
      const newBalance = wallet.balance - finalAmount;
      await tx.wallet.update({ where: { userId: u.id }, data: { balance: newBalance } });
      await tx.walletTransaction.create({
        data: { userId: u.id, type: "PAYMENT", amount: -finalAmount, balance: newBalance, note: `Thanh toán hoá đơn ${invoice.invoiceNo || invoice.id.slice(-6)}` }
      });
      await tx.invoice.update({
        where: { id: invoice.id },
        data: { status: "PAID", paidAt: new Date(), paymentMethod: "WALLET", subtotal: invoice.amount, discount, voucherCode: appliedVoucher?.code, amount: finalAmount }
      });
      if (appliedVoucher) {
        await tx.voucher.update({ where: { id: appliedVoucher.id }, data: { usedCount: { increment: 1 } } });
        await tx.voucherUsage.create({ data: { voucherId: appliedVoucher.id, userId: u.id, invoiceId: invoice.id, discount } });
      }
    });
    return NextResponse.json({ success: true, finalAmount, discount });
  }

  return NextResponse.json({ error: "Phương thức không hỗ trợ" }, { status: 400 });
}
