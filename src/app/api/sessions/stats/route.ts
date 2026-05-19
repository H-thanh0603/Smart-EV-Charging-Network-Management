import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = getTokenFromRequest(req);
  const user = token ? verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const start = new Date();
  start.setMonth(start.getMonth() - 12);
  const sessions = await prisma.chargingSession.findMany({
    where: { userId: user.id, status: "COMPLETED", startTime: { gte: start } },
    select: { startTime: true, energyKwh: true, invoice: { select: { amount: true } } }
  });

  const grouped: Record<string, { energy: number; cost: number; count: number }> = {};
  for (const s of sessions) {
    const key = `${s.startTime.getFullYear()}-${String(s.startTime.getMonth() + 1).padStart(2, "0")}`;
    if (!grouped[key]) grouped[key] = { energy: 0, cost: 0, count: 0 };
    grouped[key].energy += s.energyKwh || 0;
    grouped[key].cost += s.invoice?.amount || 0;
    grouped[key].count += 1;
  }
  const data = Object.entries(grouped).map(([month, v]) => ({ month, ...v })).sort((a, b) => a.month.localeCompare(b.month));
  return NextResponse.json({ data, totalEnergy: sessions.reduce((s, x) => s + (x.energyKwh || 0), 0), totalSessions: sessions.length });
}
