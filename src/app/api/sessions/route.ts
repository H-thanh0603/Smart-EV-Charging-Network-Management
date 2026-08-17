import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";
export async function GET(req: NextRequest) {
  const token = getTokenFromRequest(req);
  const user = token ? verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const where = user.role === "ADMIN" ? {} : { userId: user.id };
  const include = { slot: { include: { station: { select: { name: true, address: true } } } }, invoice: true };
  const orderBy = { startTime: "desc" as const };

  // Không ?page → trả toàn bộ (backward-compat: driver dashboard/earnings cần aggregate đủ rows)
  const url = new URL(req.url);
  const pageParam = url.searchParams.get("page");
  if (!pageParam) {
    const sessions = await prisma.chargingSession.findMany({ where, include, orderBy });
    return NextResponse.json(sessions);
  }

  const page = Math.max(parseInt(pageParam) || 1, 1);
  const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "20") || 20, 1), 100);
  const [items, total] = await Promise.all([
    prisma.chargingSession.findMany({ where, include, orderBy, skip: (page - 1) * limit, take: limit }),
    prisma.chargingSession.count({ where }),
  ]);
  return NextResponse.json({ items, total, page, limit });
}
