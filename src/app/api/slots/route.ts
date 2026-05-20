import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const stationId = searchParams.get('stationId')
  const slots = await prisma.slot.findMany({
    where: stationId ? { stationId } : {},
    include: { station: { select: { name: true } } },
    orderBy: { slotNumber: 'asc' }
  })
  return NextResponse.json(slots)
}

export async function POST(req: NextRequest) {
  const token = getTokenFromRequest(req); const payload = token ? verifyToken(token) : null
  if (!payload || !['ADMIN'].includes(payload.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const data = await req.json()
  const slot = await prisma.slot.create({ data })
  return NextResponse.json(slot, { status: 201 })
}
