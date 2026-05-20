import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = getTokenFromRequest(req)
  const payload = token ? verifyToken(token) : null
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const session = await prisma.chargingSession.findUnique({ where: { id }, include: { slot: true } })
  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (session.userId !== payload.id && !['ADMIN'].includes(payload.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (session.status !== 'ACTIVE') return NextResponse.json({ error: 'Session not active' }, { status: 400 })

  const endTime = new Date()
  const durationMs = endTime.getTime() - session.startTime.getTime()
  const durationHours = durationMs / (1000 * 60 * 60)
  const efficiency = 0.7 + Math.random() * 0.25
  const energyKwh = Math.round(session.slot.powerKw * durationHours * efficiency * 100) / 100

  // Get applicable tariff for this hour
  const tariffs = await prisma.tariff.findMany({ where: { active: true } })
  const hour = session.startTime.getHours()
  let ratePerKwh = 3500 // default VND/kWh
  for (const t of tariffs) {
    const inRange = t.startHour <= t.endHour
      ? (hour >= t.startHour && hour < t.endHour)
      : (hour >= t.startHour || hour < t.endHour)
    if (inRange) { ratePerKwh = t.ratePerKwh; break }
  }
  const finalKwh = Math.max(energyKwh, 0.1)
  const amount = Math.round(finalKwh * ratePerKwh)

  const [updatedSession, invoice] = await Promise.all([
    prisma.chargingSession.update({ where: { id }, data: { endTime, energyKwh: finalKwh, status: 'COMPLETED' } }),
    prisma.invoice.create({ data: { sessionId: id, userId: session.userId, amount, energyKwh: finalKwh, status: 'UNPAID' } }),
    prisma.slot.update({ where: { id: session.slotId }, data: { status: 'AVAILABLE' } }),
    session.reservationId ? prisma.reservation.update({ where: { id: session.reservationId }, data: { status: 'COMPLETED' } }) : Promise.resolve(),
  ])
  return NextResponse.json({ session: updatedSession, invoice })
}
