import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await requireRole(req, ["ADMIN"]);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const limit = Number(url.searchParams.get("limit") || 50);

  const payments = await prisma.payment.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { user: { select: { name: true, email: true } } },
  });

  const totals = await prisma.payment.aggregate({
    where: { status: "SUCCESS" },
    _sum: { amount: true },
    _count: true,
  });

  return NextResponse.json({
    payments,
    totals: {
      successAmount: totals._sum.amount || 0,
      successCount: totals._count,
    },
  });
}
