import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const tariffs = await prisma.tariff.findMany({ orderBy: { startHour: "asc" } });
  return NextResponse.json(tariffs);
}

export async function POST(req: NextRequest) {
  const token = getTokenFromRequest(req);
  const user = token ? verifyToken(token) : null;
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await req.json();
  const tariff = await prisma.tariff.create({ data });
  return NextResponse.json(tariff);
}
