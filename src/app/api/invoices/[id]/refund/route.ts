import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

// Hoàn tiền hóa đơn đã thanh toán về ví. Admin hoặc chủ hóa đơn.
// Mỗi hóa đơn chỉ refund 1 lần (status PAID → REFUNDED).
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const token = getTokenFromRequest(req);
  const u = token ? verifyToken(token) : null;
  if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const invoice = await prisma.invoice.findUnique({ where: { id: params.id } });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (invoice.userId !== u.id && u.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await prisma.$transaction(async (tx) => {
      // Claim 1 lần: 2 request refund song song chỉ 1 lần cộng ví
      const claimed = await tx.invoice.updateMany({
        where: { id: invoice.id, status: "PAID" },
        data: { status: "REFUNDED" },
      });
      if (claimed.count === 0) throw new Error("NOT_REFUNDABLE");

      const wallet = await tx.wallet.upsert({
        where: { userId: invoice.userId },
        update: { balance: { increment: invoice.amount } },
        create: { userId: invoice.userId, balance: invoice.amount },
      });
      await tx.walletTransaction.create({
        data: {
          userId: invoice.userId,
          type: "REFUND",
          amount: invoice.amount,
          balance: wallet.balance,
          note: `Hoàn tiền hóa đơn ${invoice.invoiceNo || invoice.id.slice(-6)}`,
        },
      });
    });
    return NextResponse.json({ success: true, amount: invoice.amount });
  } catch (e: any) {
    if (e?.message === "NOT_REFUNDABLE")
      return NextResponse.json({ error: "Hóa đơn không thể hoàn tiền" }, { status: 400 });
    return NextResponse.json({ error: "Lỗi hoàn tiền" }, { status: 500 });
  }
}
