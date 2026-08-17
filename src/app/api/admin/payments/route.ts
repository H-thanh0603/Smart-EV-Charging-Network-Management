import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await requireRole(req, ["ADMIN"]);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const page = Math.max(parseInt(url.searchParams.get("page") || "1") || 1, 1);
  const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "50") || 50, 1), 100);
  const where = status ? { status } : undefined;

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.payment.count({ where }),
  ]);

  const totals = await prisma.payment.aggregate({
    where: { status: "SUCCESS" },
    _sum: { amount: true },
    _count: true,
  });

  return NextResponse.json({
    payments,
    total,
    page,
    limit,
    totals: {
      successAmount: totals._sum.amount || 0,
      successCount: totals._count,
    },
  });
}
