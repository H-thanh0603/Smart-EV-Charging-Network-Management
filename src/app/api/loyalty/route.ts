import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

const TIERS = [
  { name: "BRONZE", min: 0, perks: ["Chào mừng", "Tích điểm 1%"] },
  { name: "SILVER", min: 500, perks: ["Tích điểm 1.5%", "Ưu tiên đặt lịch"] },
  { name: "GOLD", min: 2000, perks: ["Tích điểm 2%", "Giảm 5% mọi phiên"] },
  { name: "PLATINUM", min: 5000, perks: ["Tích điểm 3%", "Giảm 10%", "Sạc nhanh ưu tiên"] },
];

export async function GET(req: NextRequest) {
  const token = getTokenFromRequest(req);
  const user = token ? verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const u = await prisma.user.findUnique({ where: { id: user.id }, select: { loyaltyPoints: true, loyaltyTier: true } });
  const transactions = await prisma.loyaltyTransaction.findMany({
    where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 30
  });

  const currentTier = TIERS.find(t => t.name === u?.loyaltyTier) || TIERS[0];
  const nextTier = TIERS[TIERS.indexOf(currentTier) + 1];

  return NextResponse.json({
    points: u?.loyaltyPoints || 0,
    tier: u?.loyaltyTier || "BRONZE",
    currentTier, nextTier, allTiers: TIERS,
    transactions
  });
}
