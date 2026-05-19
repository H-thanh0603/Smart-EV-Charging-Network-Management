import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = getTokenFromRequest(req);
  const u = token ? verifyToken(token) : null;
  if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (u.role === "ADMIN") {
    const all = await prisma.voucher.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(all);
  }
  // Customer: only active and valid vouchers
  const now = new Date();
  const vouchers = await prisma.voucher.findMany({
    where: { active: true, validFrom: { lte: now }, validUntil: { gt: now } },
    orderBy: { validUntil: "asc" }
  });
  return NextResponse.json(vouchers);
}

export async function POST(req: NextRequest) {
  const token = getTokenFromRequest(req);
  const u = token ? verifyToken(token) : null;
  if (!u || u.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const v = await prisma.voucher.create({
    data: {
      code: body.code.toUpperCase(),
      name: body.name,
      description: body.description,
      type: body.type,
      value: body.value,
      minAmount: body.minAmount || 0,
      maxDiscount: body.maxDiscount,
      usageLimit: body.usageLimit,
      perUserLimit: body.perUserLimit || 1,
      validFrom: body.validFrom ? new Date(body.validFrom) : new Date(),
      validUntil: new Date(body.validUntil),
      active: body.active !== false,
    }
  });
  return NextResponse.json(v);
}
