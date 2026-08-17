import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { getClientIp } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const user = await requireRole(req, ["ADMIN"]);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const fleets = await prisma.fleet.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { drivers: true, vehicles: true } },
    },
  });
  return NextResponse.json(fleets);
}

export async function POST(req: NextRequest) {
  const user = await requireRole(req, ["ADMIN"]);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { name, code, contact, phone, email, discountRate, walletShared, active } = body;
  if (!name || !code) return NextResponse.json({ error: "Missing name or code" }, { status: 400 });
  // discountRate ngoài 0-100 => âm hóa đơn/points âm; clamp
  const rate = Math.max(0, Math.min(100, Number(discountRate) || 0));

  try {
    const fleet = await prisma.fleet.create({
      data: {
        name,
        code: code.toUpperCase(),
        contact: contact || null,
        phone: phone || null,
        email: email || null,
        discountRate: rate,
        walletShared: walletShared ?? true,
        active: active ?? true,
      },
    });
    await audit({ actorId: user.id, role: user.role, action: "CREATE", entity: "Fleet", entityId: fleet.id, detail: fleet.code, ip: getClientIp(req) });
    return NextResponse.json(fleet);
  } catch (e: any) {
    if (e.code === "P2002") return NextResponse.json({ error: "Mã fleet đã tồn tại" }, { status: 409 });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
