import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = getTokenFromRequest(req);
  const u = token ? verifyToken(token) : null;
  if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const vehicles = await prisma.vehicle.findMany({
    where: { userId: u.id },
    include: { fleet: { select: { name: true, code: true, discountRate: true } } },
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json(vehicles);
}

export async function POST(req: NextRequest) {
  const token = getTokenFromRequest(req);
  const u = token ? verifyToken(token) : null;
  if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { brand, model, licensePlate, connectorType, batteryKwh, vinNumber } = await req.json();
  if (!brand || !model || !licensePlate || !connectorType) {
    return NextResponse.json({ error: "Thiếu thông tin xe" }, { status: 400 });
  }
  const exists = await prisma.vehicle.findUnique({ where: { licensePlate } });
  if (exists) return NextResponse.json({ error: "Biển số đã tồn tại" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: u.id }, select: { fleetId: true } });
  const v = await prisma.vehicle.create({
    data: { userId: u.id, brand, model, licensePlate: licensePlate.toUpperCase(), connectorType, batteryKwh, vinNumber, fleetId: user?.fleetId }
  });
  return NextResponse.json(v);
}
