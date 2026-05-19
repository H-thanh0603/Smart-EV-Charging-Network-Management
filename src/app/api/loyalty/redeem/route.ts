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

  const u = await prisma.user.findUnique({ where: { id: user.id } });
  if (!u || u.loyaltyPoints < points) return NextResponse.json({ error: "Không đủ điểm" }, { status: 400 });

  const value = points * 100; // 100 pts = 10000 VND

  // Deduct points
  const newPoints = u.loyaltyPoints - points;
  await prisma.user.update({ where: { id: user.id }, data: { loyaltyPoints: newPoints } });
  await prisma.loyaltyTransaction.create({
    data: { userId: user.id, type: "REDEEM", points: -points, balance: newPoints, reason: `Quy đổi ${value.toLocaleString("vi-VN")} ₫ vào ví` }
  });

  // Add to wallet
  let wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
  if (!wallet) wallet = await prisma.wallet.create({ data: { userId: user.id, balance: 0 } });
  const newBalance = wallet.balance + value;
  await prisma.wallet.update({ where: { userId: user.id }, data: { balance: newBalance } });
  await prisma.walletTransaction.create({
    data: { userId: user.id, type: "REFUND", amount: value, balance: newBalance, note: `Quy đổi ${points} điểm thưởng` }
  });

  return NextResponse.json({ success: true, value, newPoints, walletBalance: newBalance });
}
