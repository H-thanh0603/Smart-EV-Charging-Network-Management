import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const token = getTokenFromRequest(req);
  const u = token ? verifyToken(token) : null;
  if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const inv = await prisma.invoice.findUnique({
    where: { id: params.id },
    include: { user: true, session: { include: { slot: { include: { station: true } } } } }
  });
  if (!inv || (inv.userId !== u.id && u.role !== "ADMIN")) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Return print-friendly HTML; client uses window.print() to convert to PDF
  return NextResponse.json({
    invoice: inv,
    invoiceNo: inv.invoiceNo || `EV${inv.id.slice(-8).toUpperCase()}`,
  });
}
