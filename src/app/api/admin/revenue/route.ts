import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = getTokenFromRequest(req);
  const user = token ? verifyToken(token) : null;
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "day"; // day, week, month

  const now = new Date();
  const start = new Date();
  if (period === "day") start.setDate(now.getDate() - 7);
  else if (period === "week") start.setDate(now.getDate() - 30);
  else start.setMonth(now.getMonth() - 12);

  const invoices = await prisma.invoice.findMany({
    where: { status: "PAID", paidAt: { gte: start } },
    select: { amount: true, energyKwh: true, paidAt: true }
  });

  // Group by period
  const grouped: Record<string, { revenue: number; energy: number; count: number }> = {};
  for (const inv of invoices) {
    if (!inv.paidAt) continue;
    let key: string;
    if (period === "day") key = inv.paidAt.toISOString().slice(0, 10);
    else if (period === "week") {
      const d = new Date(inv.paidAt);
      const week = Math.floor(d.getDate() / 7);
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-W${week}`;
    } else {
      key = `${inv.paidAt.getFullYear()}-${String(inv.paidAt.getMonth() + 1).padStart(2, "0")}`;
    }
    if (!grouped[key]) grouped[key] = { revenue: 0, energy: 0, count: 0 };
    grouped[key].revenue += inv.amount;
    grouped[key].energy += inv.energyKwh;
    grouped[key].count += 1;
  }

  const data = Object.entries(grouped).map(([date, v]) => ({ date, ...v })).sort((a, b) => a.date.localeCompare(b.date));
  const totalRevenue = invoices.reduce((s, i) => s + i.amount, 0);
  const totalEnergy = invoices.reduce((s, i) => s + i.energyKwh, 0);

  return NextResponse.json({ data, totalRevenue, totalEnergy, totalSessions: invoices.length });
}
