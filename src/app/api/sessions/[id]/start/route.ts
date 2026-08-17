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
  // checkin/route.ts đặt CONFIRMED; chấp nhận cả CHECKED_IN (tương thích)
  if (reservation.status !== 'CHECKED_IN' && reservation.status !== 'CONFIRMED') return NextResponse.json({ error: 'Must check-in first' }, { status: 400 })
  const existing = await prisma.chargingSession.findFirst({ where: { reservationId, status: 'ACTIVE' } })
  if (existing) return NextResponse.json(existing)
  try {
    const session = await prisma.$transaction(async (tx) => {
      // Claim 1 lần: 2 request start song song chỉ 1 chiếm được slot (chống double session)
      const claimed = await tx.slot.updateMany({
        where: { id: reservation.slotId, status: 'OCCUPIED' },
        data: { status: 'CHARGING' },
      })
      if (claimed.count === 0) throw new Error('SLOT_NOT_AVAILABLE')
      return tx.chargingSession.create({ data: { userId: payload.id, reservationId, slotId: reservation.slotId, status: 'ACTIVE', startTime: new Date() } })
    })
    return NextResponse.json(session, { status: 201 })
  } catch (e: any) {
    if (e?.message === 'SLOT_NOT_AVAILABLE') {
      const active = await prisma.chargingSession.findFirst({ where: { reservationId, status: 'ACTIVE' } })
      if (active) return NextResponse.json(active)
      return NextResponse.json({ error: 'Slot không khả dụng' }, { status: 409 })
    }
    throw e
  }
}
