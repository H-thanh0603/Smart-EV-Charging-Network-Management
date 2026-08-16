import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyVNPayReturn } from "@/lib/vnpay";

export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const result = verifyVNPayReturn(params);

  if (!result.valid) return NextResponse.json({ RspCode: "97", Message: "Invalid signature" });

  const payment = await prisma.payment.findUnique({ where: { txnRef: result.txnRef } });
  if (!payment) return NextResponse.json({ RspCode: "01", Message: "Order not found" });

  if (payment.amount * 100 !== parseInt(params.vnp_Amount)) {
    return NextResponse.json({ RspCode: "04", Message: "Amount mismatch" });
  }

  if (payment.status === "SUCCESS") {
    return NextResponse.json({ RspCode: "02", Message: "Already updated" });
  }

  if (result.status === "success") {
    const failed = await prisma.$transaction(async (tx: any) => {
      // M10: claim 1 lần chống double-credit với /return
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
      if (claimed.count === 0) return true;
      let wallet = await tx.wallet.findUnique({ where: { userId: payment.userId } });
      if (!wallet) wallet = await tx.wallet.create({ data: { userId: payment.userId, balance: 0 } });
      const newBalance = wallet.balance + payment.amount;
      await tx.wallet.update({ where: { userId: payment.userId }, data: { balance: newBalance } });
      await tx.walletTransaction.create({
        data: { userId: payment.userId, type: "TOPUP", amount: payment.amount, balance: newBalance, note: `Nạp qua VNPay (IPN)`, paymentId: payment.id }
      });
      return false;
    });
    if (failed) return NextResponse.json({ RspCode: "02", Message: "Already updated" });
  } else {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED", responseCode: result.responseCode } });
  }

  return NextResponse.json({ RspCode: "00", Message: "Success" });
}
