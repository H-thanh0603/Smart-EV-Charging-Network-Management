import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const payload = getTokenFromRequest(req)
  if (!payload || !['ADMIN', 'MANAGER', 'TECHNICIAN'].includes(payload.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const tickets = await prisma.maintenanceTicket.findMany({
    include: { chargingSlot: { include: { station: { select: { name: true, address: true } } } }, technician: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' }
  })
  return NextResponse.json(tickets)
}

export async function POST(req: NextRequest) {
  const payload = getTokenFromRequest(req)
  if (!payload || !['ADMIN', 'MANAGER', 'TECHNICIAN'].includes(payload.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { chargingSlotId, title, description, technicianId } = await req.json()
  const [ticket] = await Promise.all([
    prisma.maintenanceTicket.create({ data: { chargingSlotId, title, description, technicianId, status: 'OPEN' } }),
    prisma.chargingSlot.update({ where: { id: chargingSlotId }, data: { status: 'MAINTENANCE' } })
  ])
  return NextResponse.json(ticket, { status: 201 })
}
