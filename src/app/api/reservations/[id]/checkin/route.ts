import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = getTokenFromRequest(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const reservation = await prisma.reservation.findUnique({ where: { id } })
  if (!reservation) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (reservation.userId !== payload.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (reservation.status !== 'RESERVED') return NextResponse.json({ error: 'Not in RESERVED status' }, { status: 400 })
  const now = new Date()
  if (now > reservation.checkInDeadline) {
    await prisma.reservation.update({ where: { id }, data: { status: 'EXPIRED' } })
    return NextResponse.json({ error: 'Check-in deadline passed. Reservation expired.' }, { status: 400 })
  }
  const [updated] = await Promise.all([
    prisma.reservation.update({ where: { id }, data: { status: 'CHECKED_IN' } }),
    prisma.chargingSlot.update({ where: { id: reservation.chargingSlotId }, data: { status: 'OCCUPIED' } })
  ])
  return NextResponse.json(updated)
}
