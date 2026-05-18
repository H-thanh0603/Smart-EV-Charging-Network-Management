import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const stationId = searchParams.get('stationId')
  const slots = await prisma.chargingSlot.findMany({
    where: stationId ? { stationId } : {},
    include: { station: { select: { name: true } } },
    orderBy: { code: 'asc' }
  })
  return NextResponse.json(slots)
}

export async function POST(req: NextRequest) {
  const payload = getTokenFromRequest(req)
  if (!payload || !['ADMIN', 'MANAGER'].includes(payload.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const data = await req.json()
  const slot = await prisma.chargingSlot.create({ data })
  return NextResponse.json(slot, { status: 201 })
}
