import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const slots = await prisma.slot.findMany({ where: { stationId: id }, orderBy: { slotNumber: 'asc' } })
  return NextResponse.json(slots)
}
