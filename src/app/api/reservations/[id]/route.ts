import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = getTokenFromRequest(req)
  const payload = token ? verifyToken(token) : null
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: {
      slot: { include: { station: true } },
      session: { include: { invoice: true } },
    },
  })
  if (!reservation) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(reservation)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = getTokenFromRequest(req)
  const payload = token ? verifyToken(token) : null
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const reservation = await prisma.reservation.findUnique({ where: { id } })
  if (!reservation) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (reservation.userId !== payload.id && !['ADMIN'].includes(payload.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!['RESERVED', 'PENDING'].includes(reservation.status))
    return NextResponse.json({ error: 'Cannot cancel' }, { status: 400 })
  const updated = await prisma.reservation.update({ where: { id }, data: { status: 'CANCELLED' } })
  return NextResponse.json(updated)
}
