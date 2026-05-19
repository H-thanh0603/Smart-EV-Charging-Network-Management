import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const station = await prisma.station.findUnique({ where: { id: params.id }, include: { slots: true } });
  if (!station) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(station);
}
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const data = await req.json();
  const station = await prisma.station.update({ where: { id: params.id }, data });
  return NextResponse.json(station);
}
