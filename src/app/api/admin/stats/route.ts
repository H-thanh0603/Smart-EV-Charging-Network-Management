import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";
export async function GET(req: NextRequest) {
  const token = getTokenFromRequest(req);
  const user = token ? verifyToken(token) : null;
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [totalUsers, totalStations, totalSlots, activeSessions, totalRevenue, recentSessions] = await Promise.all([
    prisma.user.count(), prisma.station.count(), prisma.slot.count(),
    prisma.chargingSession.count({ where: { status: "ACTIVE" } }),
    prisma.invoice.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }),
    prisma.chargingSession.findMany({ take: 10, orderBy: { startTime: "desc" },
      include: { user: { select: { name: true } }, slot: { include: { station: { select: { name: true } } } } } })
  ]);
  return NextResponse.json({ totalUsers, totalStations, totalSlots, activeSessions, totalRevenue: totalRevenue._sum.amount || 0, recentSessions });
}
