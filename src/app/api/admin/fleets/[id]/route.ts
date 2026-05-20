import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireRole(req, ["ADMIN"]);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const data: any = {};
  ["name","contact","phone","email","discountRate","walletShared","active"].forEach((k) => {
    if (k in body) data[k] = body[k];
  });
  const fleet = await prisma.fleet.update({ where: { id: params.id }, data });
  return NextResponse.json(fleet);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireRole(req, ["ADMIN"]);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Detach drivers and vehicles before delete
  await prisma.user.updateMany({ where: { fleetId: params.id }, data: { fleetId: null } });
  await prisma.vehicle.updateMany({ where: { fleetId: params.id }, data: { fleetId: null } });
  await prisma.fleet.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
