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

  if (payment.status === "SUCCESS") {
    return NextResponse.redirect(new URL(`/wallet?status=already_paid`, req.url));
  }

  if (result.status === "success") {
    // Atomic: update payment + wallet + transaction in one go
    await prisma.$transaction(async (tx: any) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "SUCCESS",
          responseCode: result.responseCode,
          bankCode: result.bankCode,
          bankTranNo: result.bankTranNo,
          paidAt: new Date(),
        }
      });

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
    });
    return NextResponse.redirect(new URL(`/wallet?status=success&amount=${payment.amount}&txn=${result.txnRef}`, req.url));
  } else {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED", responseCode: result.responseCode }
    });
    return NextResponse.redirect(new URL(`/wallet?status=failed&code=${result.responseCode}`, req.url));
  }
}
