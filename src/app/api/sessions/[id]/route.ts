import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = getTokenFromRequest(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const session = await prisma.chargingSession.findUnique({
    where: { id },
    include: { chargingSlot: { include: { station: true } }, invoice: { include: { payment: true } }, reservation: true }
  })
  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (session.userId !== payload.userId && !['ADMIN', 'MANAGER'].includes(payload.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  return NextResponse.json(session)
}
