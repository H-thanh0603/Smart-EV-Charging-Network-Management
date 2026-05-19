import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = getTokenFromRequest(req);
  const user = token ? verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const where = user.role === "TECHNICIAN" ? { assignedToId: user.id } : {};
  const tickets = await prisma.maintenanceTicket.findMany({
    where,
    include: {
      station: { select: { name: true } },
      slot: { select: { slotNumber: true } },
      createdBy: { select: { name: true } },
      assignedTo: { select: { name: true } }
    },
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json(tickets);
}

export async function POST(req: NextRequest) {
  const token = getTokenFromRequest(req);
  const user = token ? verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { stationId, slotId, title, description, priority, assignedToId } = await req.json();
  const ticket = await prisma.maintenanceTicket.create({
    data: {
      stationId, slotId: slotId || null, title, description,
      priority: priority || "MEDIUM",
      createdById: user.id,
      assignedToId: assignedToId || null,
      status: "OPEN"
    }
  });
  if (slotId) {
    await prisma.slot.update({ where: { id: slotId }, data: { status: "MAINTENANCE" } });
  }
  if (assignedToId) {
    await prisma.notification.create({
      data: { userId: assignedToId, title: "Ticket bảo trì mới", message: title, type: "ALERT", link: "/admin/maintenance" }
    });
  }
  return NextResponse.json(ticket);
}
