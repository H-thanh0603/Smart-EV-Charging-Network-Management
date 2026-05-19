import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const token = getTokenFromRequest(req);
  const u = token ? verifyToken(token) : null;
  if (!u || u.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const v = await prisma.voucher.update({ where: { id: params.id }, data: body });
  return NextResponse.json(v);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const token = getTokenFromRequest(req);
  const u = token ? verifyToken(token) : null;
  if (!u || u.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await prisma.voucher.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
