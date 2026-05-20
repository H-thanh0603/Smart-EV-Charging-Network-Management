import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = getTokenFromRequest(req); const payload = token ? verifyToken(token) : null
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { reservationId } = await req.json()
  const reservation = await prisma.reservation.findUnique({ where: { id: reservationId }, include: { slot: true } })
  if (!reservation) return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
  if (reservation.userId !== payload.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (reservation.status !== 'CHECKED_IN') return NextResponse.json({ error: 'Must check-in first' }, { status: 400 })
  const existing = await prisma.chargingSession.findFirst({ where: { reservationId, status: 'ACTIVE' } })
  if (existing) return NextResponse.json(existing)
  const [session] = await Promise.all([
    prisma.chargingSession.create({ data: { userId: payload.id, reservationId, slotId: reservation.slotId, status: 'ACTIVE', startTime: new Date() } }),
    prisma.slot.update({ where: { id: reservation.slotId }, data: { status: 'CHARGING' } })
  ])
  return NextResponse.json(session, { status: 201 })
}
