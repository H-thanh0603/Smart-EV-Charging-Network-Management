import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { getClientIp } from "@/lib/rate-limit";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const token = getTokenFromRequest(req);
  const user = token ? verifyToken(token) : null;
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await req.json();
  const tariff = await prisma.tariff.update({ where: { id: params.id }, data });
  await audit({ actorId: user.id, role: user.role, action: "UPDATE", entity: "Tariff", entityId: params.id, detail: tariff.name, ip: getClientIp(req) });
  return NextResponse.json(tariff);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const token = getTokenFromRequest(req);
  const user = token ? verifyToken(token) : null;
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await prisma.tariff.delete({ where: { id: params.id } });
  await audit({ actorId: user.id, role: user.role, action: "DELETE", entity: "Tariff", entityId: params.id, ip: getClientIp(req) });
  return NextResponse.json({ ok: true });
}
