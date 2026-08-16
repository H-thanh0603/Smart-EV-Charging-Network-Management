import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

// 100 points = 10,000 VND
export async function POST(req: NextRequest) {
  const token = getTokenFromRequest(req);
  const user = token ? verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { points } = await req.json();
  if (!points || points < 100 || points % 100 !== 0) {
    return NextResponse.json({ error: "Quy đổi tối thiểu 100 điểm, bội số 100" }, { status: 400 });
  }

  try {
  const result = await prisma.$transaction(async (tx: any) => {
    const u = await tx.user.findUnique({ where: { id: user.id } });
    if (!u || u.loyaltyPoints < points) throw new Error("INSUFFICIENT_POINTS");

    const value = points * 100; // 100 pts = 10000 VND

    // Deduct points
    const newPoints = u.loyaltyPoints - points;
    await tx.user.update({ where: { id: user.id }, data: { loyaltyPoints: newPoints } });
    await tx.loyaltyTransaction.create({
      data: { userId: user.id, type: "REDEEM", points: -points, balance: newPoints, reason: `Quy đổi ${value.toLocaleString("vi-VN")} ₫ vào ví` }
    });

    // Add to wallet
    let wallet = await tx.wallet.findUnique({ where: { userId: user.id } });
    if (!wallet) wallet = await tx.wallet.create({ data: { userId: user.id, balance: 0 } });
    const newBalance = wallet.balance + value;
    await tx.wallet.update({ where: { userId: user.id }, data: { balance: newBalance } });
    await tx.walletTransaction.create({
      data: { userId: user.id, type: "REFUND", amount: value, balance: newBalance, note: `Quy đổi ${points} điểm thưởng` }
    });

    return { value, newPoints, walletBalance: newBalance };
  });

  return NextResponse.json({ success: true, ...result });
  } catch (e: any) {
    if (e?.message === "INSUFFICIENT_POINTS")
      return NextResponse.json({ error: "Không đủ điểm" }, { status: 400 });
    return NextResponse.json({ error: "Lỗi quy đổi" }, { status: 500 });
  }
}
