import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const token = getTokenFromRequest(req);
  const user = token ? verifyToken(token) : null;
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await prisma.apiKey.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
