import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  const token = getTokenFromRequest(req);
  const user = token ? verifyToken(token) : null;
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const keys = await prisma.apiKey.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(keys);
}

export async function POST(req: NextRequest) {
  const token = getTokenFromRequest(req);
  const user = token ? verifyToken(token) : null;
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { name, partnerId } = await req.json();
  const key = "evk_" + crypto.randomBytes(24).toString("hex");
  const apiKey = await prisma.apiKey.create({ data: { name, key, partnerId: partnerId || null, active: true } });
  return NextResponse.json(apiKey);
}
