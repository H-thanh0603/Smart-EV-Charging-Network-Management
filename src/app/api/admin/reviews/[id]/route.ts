import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireRole(req, ["ADMIN"]);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const data: any = {};
  if ("verified" in body) data.verified = body.verified;
  const review = await prisma.review.update({ where: { id: params.id }, data });
  return NextResponse.json(review);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireRole(req, ["ADMIN"]);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const r = await prisma.review.findUnique({ where: { id: params.id } });
  if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.review.delete({ where: { id: params.id } });
  // Recompute station rating
  const all = await prisma.review.findMany({ where: { stationId: r.stationId } });
  const avg = all.length ? all.reduce((s, x) => s + x.rating, 0) / all.length : 0;
  await prisma.station.update({ where: { id: r.stationId }, data: { rating: avg, reviewCount: all.length } });
  return NextResponse.json({ ok: true });
}
