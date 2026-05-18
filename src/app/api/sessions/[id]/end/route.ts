import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = getTokenFromRequest(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const session = await prisma.chargingSession.findUnique({ where: { id }, include: { chargingSlot: true } })
  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (session.userId !== payload.userId && !['ADMIN', 'MANAGER'].includes(payload.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (session.status !== 'ACTIVE') return NextResponse.json({ error: 'Session not active' }, { status: 400 })
  const endTime = new Date()
  const durationMs = endTime.getTime() - session.startTime.getTime()
  const durationHours = durationMs / (1000 * 60 * 60)
  const durationMinutes = Math.max(1, Math.round(durationMs / (1000 * 60)))
  const efficiency = 0.7 + Math.random() * 0.25
  const consumedKwh = Math.round(session.chargingSlot.powerKw * durationHours * efficiency * 100) / 100
  const tariffs = await prisma.tariff.findMany()
  const hour = session.startTime.getHours()
  let multiplier = 1.0
  for (const t of tariffs) {
    if (t.startHour <= t.endHour) { if (hour >= t.startHour && hour < t.endHour) { multiplier = t.multiplier; break } }
    else { if (hour >= t.startHour || hour < t.endHour) { multiplier = t.multiplier; break } }
  }
  const amount = Math.round(Math.max(consumedKwh, 0.1) * session.chargingSlot.pricePerKwh * multiplier)
  const [updatedSession, invoice] = await Promise.all([
    prisma.chargingSession.update({ where: { id }, data: { endTime, consumedKwh: Math.max(consumedKwh, 0.1), status: 'COMPLETED' } }),
    prisma.invoice.create({ data: { sessionId: id, userId: session.userId, amount, kwh: Math.max(consumedKwh, 0.1), durationMinutes, status: 'UNPAID' } }),
    prisma.chargingSlot.update({ where: { id: session.chargingSlotId }, data: { status: 'AVAILABLE' } }),
    session.reservationId ? prisma.reservation.update({ where: { id: session.reservationId }, data: { status: 'COMPLETED' } }) : Promise.resolve(),
  ])
  return NextResponse.json({ session: updatedSession, invoice })
}
