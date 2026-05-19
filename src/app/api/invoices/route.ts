import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";
export async function GET(req: NextRequest) {
  const token = getTokenFromRequest(req);
  const user = token ? verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const invoices = await prisma.invoice.findMany({
    where: user.role === "ADMIN" ? {} : { userId: user.id },
    include: { session: { include: { slot: { include: { station: { select: { name: true } } } } } } },
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json(invoices);
}
