import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyVNPayReturn } from "@/lib/vnpay";

export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const result = verifyVNPayReturn(params);

  if (!result.valid) {
    return NextResponse.redirect(new URL(`/wallet?status=invalid`, req.url));
  }

  const payment = await prisma.payment.findUnique({ where: { txnRef: result.txnRef } });
  if (!payment) {
    return NextResponse.redirect(new URL(`/wallet?status=notfound`, req.url));
  }

  // M9: kiểm tra amount khớp như IPN
  if (payment.amount * 100 !== parseInt(String(params.vnp_Amount || "0"))) {
    return NextResponse.redirect(new URL(`/wallet?status=amount_mismatch`, req.url));
  }

  if (payment.status === "SUCCESS") {
    return NextResponse.redirect(new URL(`/wallet?status=already_paid`, req.url));
  }

  if (result.status === "success") {
    const credited = await prisma.$transaction(async (tx: any) => {
      // M10: claim 1 lần — chỉ PENDING → SUCCESS; IPN/return chạy song song chỉ 1 cộng tiền
      const claimed = await tx.payment.updateMany({
        where: { id: payment.id, status: "PENDING" },
        data: {
          status: "SUCCESS",
          responseCode: result.responseCode,
          bankCode: result.bankCode,
          bankTranNo: result.bankTranNo,
          paidAt: new Date(),
        }
      });
      if (claimed.count === 0) return false;

      let wallet = await tx.wallet.findUnique({ where: { userId: payment.userId } });
      if (!wallet) wallet = await tx.wallet.create({ data: { userId: payment.userId, balance: 0 } });
      const newBalance = wallet.balance + payment.amount;
      await tx.wallet.update({ where: { userId: payment.userId }, data: { balance: newBalance } });
      await tx.walletTransaction.create({
        data: {
          userId: payment.userId,
          type: "TOPUP",
          amount: payment.amount,
          balance: newBalance,
          note: `Nạp qua VNPay (${result.bankCode || "BANK"} - ${result.bankTranNo || "N/A"})`,
          paymentId: payment.id,
        }
      });
      await tx.notification.create({
        data: {
          userId: payment.userId,
          title: "Nạp tiền thành công",
          message: `${payment.amount.toLocaleString("vi-VN")} ₫ đã được nạp vào ví.`,
          type: "INFO",
          link: "/wallet"
        }
      });
      return true;
    });
    if (!credited) return NextResponse.redirect(new URL(`/wallet?status=already_paid`, req.url));
    return NextResponse.redirect(new URL(`/wallet?status=success&amount=${payment.amount}&txn=${result.txnRef}`, req.url));
  } else {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED", responseCode: result.responseCode }
    });
    return NextResponse.redirect(new URL(`/wallet?status=failed&code=${result.responseCode}`, req.url));
  }
}
