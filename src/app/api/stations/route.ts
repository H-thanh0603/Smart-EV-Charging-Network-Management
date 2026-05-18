import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''
  const stations = await prisma.station.findMany({
    where: {
      AND: [
        search ? { OR: [{ name: { contains: search } }, { address: { contains: search } }] } : {},
        status ? { status } : {},
      ]
    },
    include: { _count: { select: { chargingSlots: true } }, chargingSlots: { select: { status: true } } },
    orderBy: { createdAt: 'desc' }
  })
  return NextResponse.json(stations)
}

export async function POST(req: NextRequest) {
  const payload = getTokenFromRequest(req)
  if (!payload || !['ADMIN', 'MANAGER'].includes(payload.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const data = await req.json()
  const station = await prisma.station.create({ data })
  return NextResponse.json(station, { status: 201 })
}
