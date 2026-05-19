import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";
import { buildVNPayUrl } from "@/lib/vnpay";

export async function POST(req: NextRequest) {
  const token = getTokenFromRequest(req);
  const user = token ? verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { amount, bankCode } = await req.json();
  if (!amount || amount < 10000) return NextResponse.json({ error: "Số tiền tối thiểu 10,000 ₫" }, { status: 400 });
  if (amount > 100000000) return NextResponse.json({ error: "Số tiền tối đa 100,000,000 ₫" }, { status: 400 });

  const txnRef = `EV${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const ipAddr = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "127.0.0.1";

  await prisma.payment.create({
    data: {
      userId: user.id,
      txnRef,
      amount,
      status: "PENDING",
      provider: "VNPAY",
      ipAddress: ipAddr,
    }
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
