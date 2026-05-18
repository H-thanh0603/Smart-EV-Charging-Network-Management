import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const payload = getTokenFromRequest(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const isAdmin = ['ADMIN', 'MANAGER'].includes(payload.role)
  const reservations = await prisma.reservation.findMany({
    where: isAdmin ? {} : { userId: payload.userId },
    include: {
      station: { select: { name: true, address: true } },
      chargingSlot: { select: { code: true, connectorType: true, powerKw: true, pricePerKwh: true } },
      chargingSession: { select: { id: true, status: true } }
    },
    orderBy: { createdAt: 'desc' }
  })
  return NextResponse.json(reservations)
}

export async function POST(req: NextRequest) {
  const payload = getTokenFromRequest(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { stationId, chargingSlotId, startTime, endTime, notes } = await req.json()
  if (!stationId || !chargingSlotId || !startTime || !endTime)
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  const slot = await prisma.chargingSlot.findUnique({ where: { id: chargingSlotId } })
  if (!slot) return NextResponse.json({ error: 'Slot not found' }, { status: 404 })
  if (['MAINTENANCE', 'ERROR'].includes(slot.status))
    return NextResponse.json({ error: 'Slot is not available' }, { status: 400 })
  const conflict = await prisma.reservation.findFirst({
    where: {
      chargingSlotId, status: { in: ['RESERVED', 'CHECKED_IN'] },
      OR: [
        { startTime: { lte: new Date(startTime) }, endTime: { gt: new Date(startTime) } },
        { startTime: { lt: new Date(endTime) }, endTime: { gte: new Date(endTime) } },
        { startTime: { gte: new Date(startTime) }, endTime: { lte: new Date(endTime) } },
      ]
    }
  })
  if (conflict) return NextResponse.json({ error: 'Time slot already reserved' }, { status: 409 })
  const checkInDeadline = new Date(new Date(startTime).getTime() + 15 * 60 * 1000)
  const reservation = await prisma.reservation.create({
    data: { userId: payload.userId, stationId, chargingSlotId, startTime: new Date(startTime), endTime: new Date(endTime), checkInDeadline, notes, status: 'RESERVED' },
    include: { station: true, chargingSlot: true }
  })
  await prisma.notification.create({ data: { userId: payload.userId, title: 'Dat lich thanh cong', message: 'Ban da dat lich sac thanh cong', type: 'SUCCESS' } })
  return NextResponse.json(reservation, { status: 201 })
}
