import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { getClientIp } from "@/lib/rate-limit";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const token = getTokenFromRequest(req);
  const u = token ? verifyToken(token) : null;
  if (!u || u.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const v = await prisma.voucher.update({ where: { id: params.id }, data: body });
  await audit({ actorId: u.id, role: u.role, action: "UPDATE", entity: "Voucher", entityId: params.id, detail: v.code, ip: getClientIp(req) });
  return NextResponse.json(v);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const token = getTokenFromRequest(req);
  const u = token ? verifyToken(token) : null;
  if (!u || u.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await prisma.voucher.delete({ where: { id: params.id } });
  await audit({ actorId: u.id, role: u.role, action: "DELETE", entity: "Voucher", entityId: params.id, ip: getClientIp(req) });
  return NextResponse.json({ success: true });
}
