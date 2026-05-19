import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const token = getTokenFromRequest(req);
  const user = token ? verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await req.json();
  const ticket = await prisma.maintenanceTicket.findUnique({ where: { id: params.id } });
  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (data.status === "RESOLVED") {
    data.resolvedAt = new Date();
    if (ticket.slotId) {
      await prisma.slot.update({ where: { id: ticket.slotId }, data: { status: "AVAILABLE", lastError: null } });
    }
  }
  const updated = await prisma.maintenanceTicket.update({ where: { id: params.id }, data });
  return NextResponse.json(updated);
}
