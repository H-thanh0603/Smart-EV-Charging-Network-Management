import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";
export async function GET(req: NextRequest) {
  const token = getTokenFromRequest(req);
  const user = token ? verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sessions = await prisma.chargingSession.findMany({
    where: user.role === "ADMIN" ? {} : { userId: user.id },
    include: { slot: { include: { station: { select: { name: true, address: true } } } }, invoice: true },
    orderBy: { startTime: "desc" }
  });
  return NextResponse.json(sessions);
}
