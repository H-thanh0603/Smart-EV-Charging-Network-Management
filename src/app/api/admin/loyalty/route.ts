import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await requireRole(req, ["ADMIN"]);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const limit = Number(url.searchParams.get("limit") || 50);

  const txns = await prisma.loyaltyTransaction.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { user: { select: { name: true, email: true, loyaltyTier: true } } },
  });

  const tierStats = await prisma.user.groupBy({
    by: ["loyaltyTier"],
    _count: true,
    where: { role: "CUSTOMER" },
  });

  const sumPoints = await prisma.user.aggregate({
    _sum: { loyaltyPoints: true },
    where: { role: "CUSTOMER" },
  });

  return NextResponse.json({ txns, tierStats, totalPoints: sumPoints._sum.loyaltyPoints || 0 });
}
