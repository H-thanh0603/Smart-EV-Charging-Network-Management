import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest } from '@/lib/auth'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = getTokenFromRequest(req)
  if (!payload || !['ADMIN', 'MANAGER', 'TECHNICIAN'].includes(payload.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  const { status, technicianId } = await req.json()
  const ticket = await prisma.maintenanceTicket.findUnique({ where: { id } })
  if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const updateData: any = { status }
  if (technicianId) updateData.technicianId = technicianId
  if (status === 'RESOLVED') updateData.resolvedAt = new Date()
  const [updated] = await Promise.all([
    prisma.maintenanceTicket.update({ where: { id }, data: updateData }),
    status === 'RESOLVED' ? prisma.chargingSlot.update({ where: { id: ticket.chargingSlotId }, data: { status: 'AVAILABLE' } }) : Promise.resolve()
  ])
  return NextResponse.json(updated)
}
