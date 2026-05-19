import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";
export async function GET() {
  const stations = await prisma.station.findMany({ include: { slots: { select: { id: true, status: true, connectorType: true, powerKw: true } } } });
  return NextResponse.json(stations);
}
export async function POST(req: NextRequest) {
  const token = getTokenFromRequest(req);
  const user = token ? verifyToken(token) : null;
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await req.json();
  const station = await prisma.station.create({ data });
  return NextResponse.json(station);
}
