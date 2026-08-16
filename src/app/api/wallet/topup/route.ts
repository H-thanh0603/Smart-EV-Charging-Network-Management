import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";
import { buildVNPayUrl } from "@/lib/vnpay";
import { parseBody, walletTopupSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const token = getTokenFromRequest(req);
  const user = token ? verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = await parseBody(req, walletTopupSchema);
  if (!parsed.ok) return parsed.response;
  const { amount, bankCode } = parsed.data;

  // Không cộng balance trực tiếp — chỉ tạo thanh toán VNPay.
  // Balance được cộng khi VNPay IPN/return xác nhận (`payments/vnpay/*`).
  const txnRef = `EV${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const ipAddr = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "127.0.0.1";

  await prisma.payment.create({
    data: { userId: user.id, txnRef, amount, status: "PENDING", provider: "VNPAY", ipAddress: ipAddr }
  });

  const paymentUrl = buildVNPayUrl({
    txnRef,
    amount,
    orderInfo: `Nap tien EV Charge - ${user.email}`,
    ipAddr,
    bankCode,
  });

  return NextResponse.json({ paymentUrl, txnRef });
}