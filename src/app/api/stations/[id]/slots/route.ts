import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const slots = await prisma.chargingSlot.findMany({ where: { stationId: id }, orderBy: { code: 'asc' } })
  return NextResponse.json(slots)
}
