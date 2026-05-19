import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = getTokenFromRequest(req);
  const u = token ? verifyToken(token) : null;
  if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({
    where: { id: u.id },
    select: { id: true, email: true, name: true, phone: true, avatar: true, role: true, loyaltyPoints: true, loyaltyTier: true, emailVerified: true, createdAt: true }
  });
  return NextResponse.json(user);
}

export async function PUT(req: NextRequest) {
  const token = getTokenFromRequest(req);
  const u = token ? verifyToken(token) : null;
  if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { name, phone, avatar } = await req.json();
  const updated = await prisma.user.update({
    where: { id: u.id },
    data: { name, phone, avatar },
    select: { id: true, email: true, name: true, phone: true, avatar: true, role: true }
  });
  return NextResponse.json(updated);
}
